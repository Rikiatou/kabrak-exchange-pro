const axios = require('axios');

/**
 * Service d'envoi de SMS via Twilio ou autre provider
 * Pour l'instant, on log juste le code (à remplacer par vraie API SMS)
 */

const sendSMS = async (phoneNumber, message) => {
  try {
    // TODO: Intégrer un vrai service SMS (Twilio, Africa's Talking, etc.)
    // Pour l'instant, on log le code pour le développement
    console.log('📱 SMS envoyé à', phoneNumber);
    console.log('📝 Message:', message);
    
    // Simulation d'envoi réussi
    return { success: true, message: 'SMS envoyé avec succès' };
    
    /* EXEMPLE AVEC TWILIO (à décommenter et configurer):
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: phoneNumber,
        From: twilioPhone,
        Body: message,
      }),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
      }
    );
    
    return { success: true, sid: response.data.sid };
    */
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer un code OTP par SMS
 */
const sendOTP = async (phoneNumber, code, userName = '') => {
  const message = `KABRAK Exchange Pro\n\nBonjour ${userName},\n\nVotre code de vérification est: ${code}\n\nCe code expire dans 5 minutes.\n\nNe partagez ce code avec personne.`;
  
  return await sendSMS(phoneNumber, message);
};

/**
 * Envoyer une notification de connexion suspecte
 */
const sendLoginAlert = async (phoneNumber, userName, location = '') => {
  const message = `KABRAK Exchange Pro\n\nBonjour ${userName},\n\nUne nouvelle connexion a été détectée sur votre compte${location ? ` depuis ${location}` : ''}.\n\nSi ce n'est pas vous, changez immédiatement votre mot de passe.`;
  
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendOTP,
  sendLoginAlert,
};
