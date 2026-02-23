const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const isExpoPushToken = (token) =>
  typeof token === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(token);

/**
 * Send a push notification via Expo Push API
 */
const sendPush = async (token, title, body, data = {}) => {
  if (!token || !isExpoPushToken(token)) return null;
  try {
    const res = await axios.post(
      EXPO_PUSH_URL,
      { to: token, title, body, data, sound: 'default', priority: 'high' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log(`📲 Push sent to ${token.substring(0, 20)}...`);
    return res.data;
  } catch (e) {
    console.error('Push notification error:', e.message);
    return null;
  }
};

/**
 * Send push to a user by userId (looks up token from DB)
 */
const sendPushToUser = async (userId, title, body, data = {}) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(userId, { attributes: ['expoPushToken'] });
    if (user?.expoPushToken) {
      return sendPush(user.expoPushToken, title, body, data);
    }
  } catch (e) {
    console.error('Push to user error:', e.message);
  }
  return null;
};

// Pre-built notification templates
const pushTemplates = {
  paymentReceived: (plan, amount) => ({
    title: '📝 Paiement reçu',
    body: `Votre paiement ${plan.toUpperCase()} de ${amount.toLocaleString()} XOF est en cours de vérification.`,
  }),
  licenseActivated: (plan, daysLeft) => ({
    title: '✅ Licence activée !',
    body: `Votre licence ${plan.toUpperCase()} est active pour ${daysLeft} jours. Profitez de KABRAK Exchange Pro !`,
  }),
  paymentRejected: (reason) => ({
    title: '❌ Paiement rejeté',
    body: reason || 'Votre paiement a été rejeté. Veuillez réessayer ou contacter le support.',
  }),
  trialActivated: (daysLeft) => ({
    title: '🎉 Essai gratuit activé !',
    body: `Votre essai gratuit de ${daysLeft} jours est actif. Bienvenue sur KABRAK Exchange Pro !`,
  }),
  licenseExpiringSoon: (daysLeft) => ({
    title: '⚠️ Licence bientôt expirée',
    body: `Votre licence expire dans ${daysLeft} jour(s). Renouvelez maintenant pour continuer.`,
  }),
};

module.exports = { sendPush, sendPushToUser, pushTemplates, isExpoPushToken };
