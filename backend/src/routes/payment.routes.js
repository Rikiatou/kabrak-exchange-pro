const express = require('express');
const router = express.Router();
const { getAll, create } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { PaymentProof, User, License } = require('../models');
const { adminAuth } = require('../middleware/admin.middleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const { sendTrialActivated, sendPaymentReceived, sendLicenseActivated, sendPaymentRejected } = require('../services/email.service');
const { sendPushToUser, pushTemplates } = require('../services/push.service');

// Existing routes
router.get('/', authenticate, getAll);
router.post('/', authenticate, auditLog('CREATE', 'payment'), create);

// USSD Payment routes
router.post('/ussd-proof', async (req, res) => {
  try {
    const { userId, plan, amount, reference, phoneNumber } = req.body;
    console.log('📝 Payment Proof submission:', { userId, plan, amount, reference, phoneNumber });
    
    // Validation de base
    if (!userId || !plan || !amount || !reference || !phoneNumber) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont requis' 
      });
    }
    
    // Vérifier si la référence existe déjà (mais permettre les doublons pour Orange Money)
    const existingProof = await PaymentProof.findOne({ 
      where: { 
        reference,
        userId,
        status: ['pending', 'validated']
      } 
    });
    if (existingProof) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ce Transaction ID a déjà été soumis pour validation' 
      });
    }
    
    // Valider que le format ressemble un ID Orange Money (court ou complet)
    const shortPattern = /^(PP|CO|OM|TX|PAY|REF|VIR)\d{6}\.\d{4}\.[A-Z0-9]+$/;
    const longPattern = /^(PP|CO|OM|TX|PAY|REF|VIR)\d{6}\.\d{4}\.[A-Z0-9]+\s+(CO|PP|OM|TX|PAY|REF|VIR)\d{6}\.\d{4}\.[A-Z0-9]+$/;
    
    if (!shortPattern.test(reference) && !longPattern.test(reference)) {
      console.log('⚠️ Reference does not match Orange Money pattern:', reference);
      // On accepte quand même pour être flexible avec les différents formats
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
    
    // Pour les trials, valider automatiquement et créer la licence
    if (plan === 'trial') {
      console.log('🎯 Trial plan detected - creating license automatically...');
      
      // Créer la licence trial directement
      const user = await User.findByPk(userId);
      const licenseKey = generateLicenseKey();
      const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 jours
      
      const license = await License.create({
        userId,
        businessName: user.businessName || `${user.firstName} ${user.lastName}`,
        ownerName: `${user.firstName} ${user.lastName}`,
        ownerEmail: user.email,
        ownerPhone: user.phone,
        plan: 'trial',
        status: 'active',
        licenseKey,
        startsAt: new Date(),
        expiresAt: trialExpiry
      });
      
      console.log(`✅ Trial license created: ${license.licenseKey}, expires: ${trialExpiry}`);
      
      // Push notification trial
      const trialPush = pushTemplates.trialActivated(14);
      sendPushToUser(userId, trialPush.title, trialPush.body, { type: 'trial_activated' }).catch(() => {});
      
      // Envoyer email de confirmation trial
      sendTrialActivated({
        email: user.email,
        businessName: user.businessName || user.firstName || 'Client',
        licenseKey: license.licenseKey,
        expiresAt: license.expiresAt
      }).catch(e => console.error('Email error:', e.message));
      
      // Créer la preuve de paiement pour suivi
      const paymentProof = await PaymentProof.create({
        userId,
        plan: 'trial',
        amount: 0,
        reference,
        phoneNumber,
        method: 'trial',
        status: 'validated',
        validatedAt: new Date(),
        notes: 'Essai gratuit de 14 jours - Activé automatiquement'
      });
      
      return res.json({
        success: true,
        message: 'Essai gratuit de 14 jours activé !',
        license: {
          licenseKey: license.licenseKey,
          plan: license.plan,
          expiresAt: license.expiresAt,
          daysLeft: Math.ceil((license.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
        }
      });
    }
    
    // Créer la preuve de paiement
    console.log('✅ Creating payment proof...');
    const paymentProof = await PaymentProof.create({
      userId,
      plan,
      amount,
      reference,
      phoneNumber,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h pour valider
    });
    
    console.log('✅ Payment proof created:', paymentProof.id, 'Transaction ID:', paymentProof.reference);
    
    // Envoyer email de confirmation Orange Money
    const proofUser = await User.findByPk(userId);
    if (proofUser) {
      sendPaymentReceived({
        email: proofUser.email,
        businessName: proofUser.businessName || proofUser.firstName || 'Client',
        plan,
        amount,
        reference
      }).catch(e => console.error('Email error:', e.message));
    }
    
    // Push notification paiement reçu
    const recvPush = pushTemplates.paymentReceived(plan, amount);
    sendPushToUser(userId, recvPush.title, recvPush.body, { type: 'payment_received' }).catch(() => {});
    
    res.json({
      success: true,
      message: 'Transaction ID enregistré ! Validation en cours...',
      paymentProof: {
        id: paymentProof.id,
        reference: paymentProof.reference,
        plan: paymentProof.plan,
        amount: paymentProof.amount,
        status: 'pending'
      }
    });
  } catch (e) {
    console.error('❌ Error creating payment proof:', e);
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
          attributes: ['id', 'email', 'firstName', 'lastName', 'businessName', 'phone']
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
    
    // Envoyer email licence activée
    sendLicenseActivated({
      email: paymentProof.user.email,
      businessName: paymentProof.user.businessName || paymentProof.user.firstName || 'Client',
      licenseKey: license.licenseKey,
      plan: license.plan,
      expiresAt: license.expiresAt
    }).catch(e => console.error('Email error:', e.message));
    
    // Push notification licence activée
    const daysLeft = Math.ceil((license.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    const actPush = pushTemplates.licenseActivated(license.plan, daysLeft);
    sendPushToUser(paymentProof.userId, actPush.title, actPush.body, { type: 'license_activated' }).catch(() => {});
    
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
    
    // Envoyer email rejet
    const rejectedProof = await PaymentProof.findByPk(id, { include: [{ model: User, as: 'user' }] });
    if (rejectedProof?.user) {
      sendPaymentRejected({
        email: rejectedProof.user.email,
        businessName: rejectedProof.user.businessName || rejectedProof.user.firstName || 'Client',
        reason
      }).catch(e => console.error('Email error:', e.message));
      
      // Push notification rejet
      const rejPush = pushTemplates.paymentRejected(reason);
      sendPushToUser(rejectedProof.userId, rejPush.title, rejPush.body, { type: 'payment_rejected' }).catch(() => {});
    }
    
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
