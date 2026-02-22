const express = require('express');
const router = express.Router();
const { getAll, create } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { PaymentProof, User, License } = require('../models');
const { adminAuth } = require('../middleware/admin.middleware');

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
      basic: 100000,    // 100,000 XOF/mois
      premium: 990000   // 990,000 XOF/an
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
