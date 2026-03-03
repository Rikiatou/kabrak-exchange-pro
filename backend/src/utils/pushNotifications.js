const axios = require('axios');

/**
 * Validate if a string is a valid Expo Push Token
 */
const isExpoPushToken = (token) => {
  return typeof token === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(token);
};

/**
 * Send a push notification via Expo Push API
 * @param {string} token - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data for deep linking
 */
const sendPushNotification = async (token, title, body, data = {}) => {
  if (!token || !isExpoPushToken(token)) {
    console.log('Invalid or missing Expo push token');
    return { success: false, error: 'Invalid token' };
  }

  try {
    const message = {
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    };

    const response = await axios.post(
      'https://exp.host/--/api/v2/push/send',
      message,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Push notification error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications to multiple tokens
 * @param {string[]} tokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data for deep linking
 */
const sendPushNotifications = async (tokens, title, body, data = {}) => {
  const validTokens = tokens.filter(isExpoPushToken);
  
  if (validTokens.length === 0) {
    return { success: false, error: 'No valid tokens' };
  }

  const results = await Promise.allSettled(
    validTokens.map(token => sendPushNotification(token, title, body, data))
  );

  return {
    success: true,
    sent: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  };
};

/**
 * Notify about a new transaction
 * @param {object} transaction - Transaction object
 * @param {object} client - Client object
 * @param {string[]} tokens - Array of push tokens (operator, owner, etc.)
 */
const notifyNewTransaction = async (transaction, client, tokens) => {
  const title = '💱 Nouvelle transaction';
  const body = `${client.name} — ${parseFloat(transaction.amountFrom).toLocaleString('fr-FR')} ${transaction.currencyFrom} → ${parseFloat(transaction.amountTo).toLocaleString('fr-FR')} ${transaction.currencyTo}`;
  const data = {
    type: 'transaction',
    id: transaction.id,
    transactionId: transaction.id,
    reference: transaction.reference,
  };

  return await sendPushNotifications(tokens, title, body, data);
};

/**
 * Notify about a payment
 * @param {object} payment - Payment object
 * @param {object} transaction - Transaction object
 * @param {object} client - Client object
 * @param {string[]} tokens - Array of push tokens
 */
const notifyPayment = async (payment, transaction, client, tokens) => {
  const title = '💰 Paiement reçu';
  const body = `${client.name} — ${parseFloat(payment.amount).toLocaleString('fr-FR')} ${payment.currency} — ${transaction.reference}`;
  const data = {
    type: 'transaction',
    id: transaction.id,
    transactionId: transaction.id,
    paymentId: payment.id,
    reference: transaction.reference,
  };

  return await sendPushNotifications(tokens, title, body, data);
};

module.exports = {
  isExpoPushToken,
  sendPushNotification,
  sendPushNotifications,
  notifyNewTransaction,
  notifyPayment,
};
