import { Linking, Alert, Platform } from 'react-native';
import api from './api';

/**
 * Send transaction confirmation via WhatsApp
 */
export const sendWhatsAppConfirmation = async (transactionId, lang = 'fr') => {
  try {
    const { data } = await api.post('/notifications/transaction-confirmation', { transactionId, lang });
    const { message, clientPhone } = data.data;

    if (!clientPhone) {
      Alert.alert(
        lang === 'fr' ? 'Pas de numéro' : 'No phone number',
        lang === 'fr' ? 'Ce client n\'a pas de numéro de téléphone enregistré.' : 'This client has no phone number on file.'
      );
      return { success: false };
    }

    const phone = clientPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    const url = `whatsapp://send?phone=${phone}&text=${encoded}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return { success: true };
    } else {
      // Fallback to wa.me
      const webUrl = `https://wa.me/${phone}?text=${encoded}`;
      await Linking.openURL(webUrl);
      return { success: true };
    }
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Send transaction confirmation via SMS
 */
export const sendSMSConfirmation = async (transactionId, lang = 'fr') => {
  try {
    const { data } = await api.post('/notifications/transaction-confirmation', { transactionId, lang });
    const { message, clientPhone } = data.data;

    if (!clientPhone) {
      Alert.alert(
        lang === 'fr' ? 'Pas de numéro' : 'No phone number',
        lang === 'fr' ? 'Ce client n\'a pas de numéro de téléphone enregistré.' : 'This client has no phone number on file.'
      );
      return { success: false };
    }

    // Remove WhatsApp-style formatting for SMS
    const smsMessage = message.replace(/\*/g, '');
    const encoded = encodeURIComponent(smsMessage);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${clientPhone}${separator}body=${encoded}`;

    await Linking.openURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Send payment reminder via WhatsApp
 */
export const sendWhatsAppReminder = async (transactionId, lang = 'fr') => {
  try {
    const { data } = await api.post('/notifications/payment-reminder', { transactionId, lang });
    const { message, clientPhone } = data.data;

    if (!clientPhone) {
      Alert.alert(
        lang === 'fr' ? 'Pas de numéro' : 'No phone number',
        lang === 'fr' ? 'Ce client n\'a pas de numéro de téléphone enregistré.' : 'This client has no phone number on file.'
      );
      return { success: false };
    }

    const phone = clientPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    const url = `whatsapp://send?phone=${phone}&text=${encoded}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return { success: true };
    } else {
      await Linking.openURL(`https://wa.me/${phone}?text=${encoded}`);
      return { success: true };
    }
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Send payment reminder via SMS
 */
export const sendSMSReminder = async (transactionId, lang = 'fr') => {
  try {
    const { data } = await api.post('/notifications/payment-reminder', { transactionId, lang });
    const { message, clientPhone } = data.data;

    if (!clientPhone) {
      Alert.alert(
        lang === 'fr' ? 'Pas de numéro' : 'No phone number',
        lang === 'fr' ? 'Ce client n\'a pas de numéro de téléphone enregistré.' : 'This client has no phone number on file.'
      );
      return { success: false };
    }

    const smsMessage = message.replace(/\*/g, '');
    const encoded = encodeURIComponent(smsMessage);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${clientPhone}${separator}body=${encoded}`;

    await Linking.openURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
};
