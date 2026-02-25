const IS_BOGO = process.env.APP_VARIANT === 'bogo';

const appName = process.env.APP_NAME || 'KABRAK Exchange Pro';
const slug = 'mobile';
const bundleId = process.env.APP_BUNDLE_ID || 'com.kabrak.exchangepro';
const packageName = process.env.APP_PACKAGE || 'com.kabrak.exchangepro';
const scheme = process.env.APP_SCHEME || 'kabrak-exchange';
const primaryColor = process.env.APP_PRIMARY_COLOR || '#0B6E4F';
const splashBg = process.env.APP_SPLASH_BG || '#071a12';

const icon = IS_BOGO ? './assets/bogo-icon.png' : './assets/icon.png';
const adaptiveIcon = IS_BOGO ? './assets/bogo-adaptive-icon.png' : './assets/adaptive-icon.png';
const splash = IS_BOGO ? './assets/bogo-splash.png' : './assets/splash.png';

export default {
  expo: {
    name: appName,
    slug,
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon,
    userInterfaceStyle: 'light',
    primaryColor,
    splash: {
      image: splash,
      resizeMode: 'contain',
      backgroundColor: splashBg,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: bundleId,
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: `${appName} utilise la caméra pour scanner les reçus.`,
        NSPhotoLibraryUsageDescription: `${appName} accède à vos photos pour joindre des reçus.`,
        NSPhotoLibraryAddUsageDescription: `${appName} sauvegarde les reçus dans votre galerie.`,
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        backgroundColor: splashBg,
      },
      package: packageName,
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
          icon,
          color: primaryColor,
          sounds: [],
        },
      ],
    ],
    scheme,
    extra: {
      eas: {
        projectId: 'cbf6d54d-0207-4b4f-8429-5a7793458893',
      },
      appName,
      isBogo: IS_BOGO,
    },
    owner: 'kabrak',
  },
};
