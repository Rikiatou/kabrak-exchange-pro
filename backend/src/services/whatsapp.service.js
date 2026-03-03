const axios = require('axios');

/**
 * Service d'envoi de messages via WhatsApp Business API (Meta)
 * Pour l'instant, on log juste le message (à remplacer par vraie API WhatsApp)
 */

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Intégration avec Meta WhatsApp Business API
    if (process.env.META_APP_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
      
      // Envoyer le message via l'API Meta
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber.replace('+', ''), // Format international sans +
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ Message WhatsApp envoyé avec succès:', response.data);
      return { success: true, messageId: response.data.messages[0].id };
      
    } else {
      // Mode développement: log le message
      console.log('📱 WhatsApp envoyé à', phoneNumber);
      console.log('📝 Message:');
      console.log(message);
      
      return { success: true, message: 'Message WhatsApp envoyé avec succès (mode dev)' };
    }
    
    /* EXEMPLE AVEC META WHATSAPP BUSINESS API (à décommenter et configurer):
    
    // 1. Obtenir un access token
    const tokenResponse = await axios.post(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        grant_type: 'client_credentials',
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // 2. Envoyer le message
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber.replace('+', ''), // Format international sans +
        type: 'template',
        template: {
          name: 'otp_verification',
          language: { code: 'fr' },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: '123456' // Le code OTP
                }
              ]
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return { success: true, messageId: response.data.messages[0].id };
    
    */
    
    /* EXEMPLE AVEC TWILIO WHATSAPP (alternative):
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_WHATSAPP_NUMBER;
    
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: `whatsapp:${phoneNumber}`,
        From: `whatsapp:${twilioPhone}`,
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
    console.error('❌ Erreur envoi WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer un code OTP par WhatsApp
 */
const sendWhatsAppOTP = async (phoneNumber, code, userName = '') => {
  const message = `🔐 *KABRAK Exchange Pro*

Bonjour${userName ? ' ' + userName : ''},

Votre code de vérification est:

*🔑 ${code}*

⏰ Ce code expire dans 5 minutes

🔒 Ne partagez jamais ce code avec personne.

Pour votre sécurité, nous vous recommandons de:
• Ne jamais cliquer sur des liens suspects
• Vérifier toujours l'expéditeur
• Contacter le support en cas de doute

---
© 2026 KABRAK Exchange Pro`;
  
  return await sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Envoyer une notification de connexion suspecte
 */
const sendWhatsAppLoginAlert = async (phoneNumber, userName, location = '') => {
  const message = `🚨 *Alerte de Sécurité - KABRAK Exchange Pro*

Bonjour${userName ? ' ' + userName : ''},

Une nouvelle connexion a été détectée sur votre compte${location ? ` depuis ${location}` : ''}.

📅 Date: ${new Date().toLocaleDateString('fr-FR')}
🕐 Heure: ${new Date().toLocaleTimeString('fr-FR')}

🔐 *Si ce n'est pas vous:*
1. Changez immédiatement votre mot de passe
2. Activez l'authentification 2FA
3. Contactez notre support

---
© 2026 KABRAK Exchange Pro
📧 Support: support@kabrakeng.com`;
  
  return await sendWhatsAppMessage(phoneNumber, message);
};

/**
 * Envoyer une notification de paiement reçu
 */
const sendWhatsAppPaymentNotification = async (phoneNumber, clientName, amount, currency, transactionRef) => {
  const message = `💰 *Paiement Reçu - KABRAK Exchange Pro*

Bonjour,

Un paiement a été enregistré pour la transaction:

👤 *Client:* ${clientName}
💵 *Montant:* ${amount} ${currency}
📋 *Référence:* ${transactionRef}
✅ *Statut:* Paiement reçu avec succès

📄 Vous pouvez télécharger le reçu ici:
https://exchange.kabrakeng.com/receipt/${transactionRef}

---
© 2026 KABRAK Exchange Pro`;
  
  return await sendWhatsAppMessage(phoneNumber, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppOTP,
  sendWhatsAppLoginAlert,
  sendWhatsAppPaymentNotification,
};
