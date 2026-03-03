const { OTP, User } = require('../models');
const { sendOTP } = require('../services/sms.service');
const { Op } = require('sequelize');

/**
 * Générer un code OTP à 6 chiffres
 */
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/otp/send - Envoyer un code OTP
 */
const sendOTPCode = async (req, res) => {
  try {
    const { userId, type = 'login' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId est requis',
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Aucun numéro de téléphone associé à ce compte',
      });
    }

    // Invalider les anciens OTP non utilisés
    await OTP.update(
      { verified: true },
      {
        where: {
          userId,
          type,
          verified: false,
        },
      }
    );

    // Générer un nouveau code
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Créer l'OTP
    await OTP.create({
      userId,
      code,
      type,
      expiresAt,
    });

    // Envoyer le SMS
    const smsResult = await sendOTP(user.phone, code, user.firstName || user.name);

    if (!smsResult.success) {
      console.error('Erreur envoi SMS OTP:', smsResult.error);
    }

    res.json({
      success: true,
      message: 'Code OTP envoyé par SMS',
      data: {
        phone: user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'), // Masquer le numéro
        expiresIn: 300, // 5 minutes en secondes
      },
    });
  } catch (error) {
    console.error('Erreur sendOTPCode:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/otp/verify - Vérifier un code OTP
 */
const verifyOTPCode = async (req, res) => {
  try {
    const { userId, code, type = 'login' } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'userId et code sont requis',
      });
    }

    // Chercher l'OTP
    const otp = await OTP.findOne({
      where: {
        userId,
        code,
        type,
        verified: false,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otp) {
      // Incrémenter les tentatives
      await OTP.increment('attempts', {
        where: {
          userId,
          type,
          verified: false,
        },
      });

      return res.status(400).json({
        success: false,
        message: 'Code OTP invalide ou expiré',
      });
    }

    // Vérifier le nombre de tentatives
    if (otp.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Trop de tentatives. Demandez un nouveau code.',
      });
    }

    // Marquer comme vérifié
    await otp.update({ verified: true });

    res.json({
      success: true,
      message: 'Code OTP vérifié avec succès',
    });
  } catch (error) {
    console.error('Erreur verifyOTPCode:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/otp/resend - Renvoyer un code OTP
 */
const resendOTPCode = async (req, res) => {
  try {
    const { userId, type = 'login' } = req.body;

    // Vérifier qu'il n'y a pas eu trop de demandes récentes
    const recentOTPs = await OTP.count({
      where: {
        userId,
        type,
        createdAt: {
          [Op.gt]: new Date(Date.now() - 2 * 60 * 1000), // 2 dernières minutes
        },
      },
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Trop de demandes. Veuillez patienter 2 minutes.',
      });
    }

    // Renvoyer un nouveau code
    return sendOTPCode(req, res);
  } catch (error) {
    console.error('Erreur resendOTPCode:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendOTPCode,
  verifyOTPCode,
  resendOTPCode,
};
