const express = require('express');
const router = express.Router();
const { getAll, create } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { PaymentProof, User, License } = require('../models');
const { adminAuth } = require('../middleware/admin.middleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Existing routes
router.get('/', authenticate, getAll);
router.post('/', authenticate, auditLog('CREATE', 'payment'), create);

// USSD Payment routes
router.post('/ussd-proof', async (req, res) => {
  try {
    const { userId, plan, amount, reference, phoneNumber } = req.body;
    
    // Vérifier si la référence existe déjà
    const existingProof = await PaymentProof.findOne({ where: { reference } });
    if (existingProof) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cette référence a déjà été utilisée' 
      });
    }
    
    // Vérifier que le montant correspond au plan
    const planAmounts = {
      trial: 0,
      basic: 100000,     // 100,000 XOF/mois
      premium: 1000000   // 1,000,000 XOF/an
    };
    
    if (planAmounts[plan] !== amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Montant incorrect pour le plan ${plan}. Attendu: ${planAmounts[plan]} XOF` 
      });
    }
    
    // Créer la preuve de paiement
    const paymentProof = await PaymentProof.create({
      userId,
      plan,
      amount,
      reference,
      phoneNumber,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h pour valider
    });
    
    res.json({
      success: true,
      message: 'Preuve de paiement enregistrée. Validation en cours...',
      paymentProof: {
        id: paymentProof.id,
        reference: paymentProof.reference,
        plan: paymentProof.plan,
        amount: paymentProof.amount,
        status: 'pending'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingPayments = await PaymentProof.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'businessName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(pendingPayments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/validate', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin.userId;
    
    const paymentProof = await PaymentProof.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });
    
    if (!paymentProof) {
      return res.status(404).json({ error: 'Payment proof not found' });
    }
    
    if (paymentProof.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }
    
    // Marquer comme validé
    await paymentProof.update({
      status: 'validated',
      validatedAt: new Date(),
      validatedBy: adminId,
      notes
    });
    
    // Activer ou étendre la licence
    const licenseDurations = {
      basic: 30,      // 1 mois
      premium: 365    // 1 an
    };
    
    const days = licenseDurations[paymentProof.plan];
    const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    // Chercher une licence existante
    let license = await License.findOne({
      where: { userId: paymentProof.userId },
      order: [['createdAt', 'DESC']]
    });
    
    if (license) {
      // Étendre la licence existante
      await license.update({
        status: 'active',
        plan: paymentProof.plan,
        expiresAt: new Date(Math.max(license.expiresAt, newExpiry))
      });
    } else {
      // Créer une nouvelle licence
      const licenseKey = generateLicenseKey();
      license = await License.create({
        userId: paymentProof.userId,
        businessName: paymentProof.user.businessName || `${paymentProof.user.firstName} ${paymentProof.user.lastName}`,
        ownerName: `${paymentProof.user.firstName} ${paymentProof.user.lastName}`,
        ownerEmail: paymentProof.user.email,
        ownerPhone: paymentProof.phoneNumber,
        plan: paymentProof.plan,
        status: 'active',
        licenseKey,
        startsAt: new Date(),
        expiresAt: newExpiry
      });
    }
    
    res.json({
      success: true,
      message: 'Paiement validé et licence activée',
      license: {
        licenseKey: license.licenseKey,
        plan: license.plan,
        expiresAt: license.expiresAt,
        daysLeft: Math.ceil((license.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/reject', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.userId;
    
    const paymentProof = await PaymentProof.findByPk(id);
    
    if (!paymentProof) {
      return res.status(404).json({ error: 'Payment proof not found' });
    }
    
    if (paymentProof.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }
    
    await paymentProof.update({
      status: 'rejected',
      validatedBy: adminId,
      notes: reason
    });
    
    res.json({ success: true, message: 'Paiement rejeté' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stripe Payment routes
router.post('/stripe/create', async (req, res) => {
  try {
    const { plan, userId } = req.body;
    
    const planAmounts = {
      basic: 100000,     // 100,000 XOF
      premium: 1000000   // 1,000,000 XOF
    };
    
    const amount = planAmounts[plan];
    const amountEur = Math.round(amount / 655); // Conversion XOF → EUR
    
    // Créer session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `KABRAK Exchange - ${plan.toUpperCase()}`,
            description: `${plan === 'basic' ? '1 mois' : '1 an'} d'accès complet`,
          },
          unit_amount: amountEur * 100, // Stripe en cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.BASE_URL || 'https://kabrak-exchange-pro-production.up.railway.app'}/payment/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'https://kabrak-exchange-pro-production.up.railway.app'}/payment/stripe/cancel`,
      metadata: {
        userId,
        plan,
        amount: amount.toString()
      }
    });
    
    res.json({ 
      success: true, 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Stripe Webhook
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.log('Webhook secret not configured');
    return res.json({ received: true });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, plan, amount } = session.metadata;
      
      // Activer licence automatiquement
      const licenseDurations = {
        basic: 30,      // 1 mois
        premium: 365    // 1 an
      };
      
      const days = licenseDurations[plan];
      const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      
      // Chercher une licence existante
      let license = await License.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      
      if (license) {
        // Étendre la licence existante
        await license.update({
          status: 'active',
          plan: plan,
          expiresAt: new Date(Math.max(license.expiresAt, newExpiry))
        });
      } else {
        // Créer une nouvelle licence
        const user = await User.findByPk(userId);
        const licenseKey = generateLicenseKey();
        license = await License.create({
          userId,
          businessName: user.businessName || `${user.firstName} ${user.lastName}`,
          ownerName: `${user.firstName} ${user.lastName}`,
          ownerEmail: user.email,
          plan: plan,
          status: 'active',
          licenseKey,
          startsAt: new Date(),
          expiresAt: newExpiry
        });
      }
      
      console.log(`Licence activée automatiquement via Stripe: ${license.licenseKey}`);
    }
    
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(400).json({ error: e.message });
  }
});

// Stripe success page
router.get('/stripe/success', async (req, res) => {
  const { session_id } = req.query;
  
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Paiement Réussi - KABRAK Exchange</title>
        <meta charset="UTF-8">
        <style>
          body { background: #071a12; color: white; font-family: Arial; text-align: center; padding: 50px; }
          .success { color: #4ade80; font-size: 2em; margin-bottom: 20px; }
          .btn { background: #0B6E4F; color: white; padding: 12px 24px; border: none; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="success">✅ Paiement réussi !</div>
        <h2>Votre licence KABRAK Exchange est activée</h2>
        <p>Montant : ${session.amount_total / 100} EUR</p>
        <p>Vous pouvez maintenant vous connecter à votre application.</p>
        <a href="/login.html" class="btn">Se connecter</a>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(400).send('Erreur lors de la vérification du paiement');
  }
});

// Stripe cancel page
router.get('/stripe/cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Paiement Annulé - KABRAK Exchange</title>
      <meta charset="UTF-8">
      <style>
        body { background: #071a12; color: white; font-family: Arial; text-align: center; padding: 50px; }
        .cancel { color: #ef4444; font-size: 2em; margin-bottom: 20px; }
        .btn { background: #0B6E4F; color: white; padding: 12px 24px; border: none; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="cancel">❌ Paiement annulé</div>
      <h2>Le paiement n'a pas été complété</h2>
      <p>Vous pouvez réessayer le paiement ou choisir une autre méthode.</p>
      <a href="/payment.html" class="btn">Réessayer le paiement</a>
    </body>
    </html>
  `);
});

function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'KAB-';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) result += '-';
  }
  return result;
}

module.exports = router;
