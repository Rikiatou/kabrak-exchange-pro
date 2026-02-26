export default {
  expo: {
    name: 'KABRAK Exchange Pro',
    slug: 'kabrak-exchange-pro',
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    primaryColor: '#0B6E4F',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#071a12',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.kabrak.exchangepro',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'KABRAK Exchange Pro utilise la caméra pour scanner les reçus.',
        NSPhotoLibraryUsageDescription: 'KABRAK Exchange Pro accède à vos photos pour joindre des reçus.',
        NSPhotoLibraryAddUsageDescription: 'KABRAK Exchange Pro sauvegarde les reçus dans votre galerie.',
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#071a12',
      },
      package: 'com.kabrak.exchangepro',
      versionCode: 1,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.INTERNET',
      ],
      googleServicesFile: './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#0B6E4F',
          sounds: [],
        },
      ],
    ],
    scheme: 'kabrak-exchange',
    extra: {
      eas: {
        projectId: 'cbf6d54d-0207-4b4f-8429-5a7793458893',
      },
    },
    owner: 'kabrak',
  },
};
