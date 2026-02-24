import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Generate or retrieve a unique device ID
export const getDeviceId = async () => {
  const DEVICE_ID_KEY = 'kabrak_device_id';
  
  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID if none exists
      const randomBytes = await import('expo-crypto').then(crypto => 
        crypto.CryptoDigest.digestAsync(
          crypto.CryptoDigestAlgorithm.SHA256,
          new Date().toISOString() + Math.random().toString()
        )
      );
      
      deviceId = randomBytes
        .slice(0, 16)
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
        .toUpperCase();
      
      // Store the new device ID
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a simple random ID
    return 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
};
