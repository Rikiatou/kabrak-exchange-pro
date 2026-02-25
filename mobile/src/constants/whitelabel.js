import Constants from 'expo-constants';

// Reads from app.config.js extra.isBogo (set by EAS build profile env vars)
export const IS_BOGO = Constants.expoConfig?.extra?.isBogo === true;

export const APP_NAME = IS_BOGO ? 'BOGO EXPRESS\n& SAOUDIE SERVICE' : 'KABRAK Exchange Pro';
export const APP_NAME_SHORT = IS_BOGO ? 'BOGO EXPRESS' : 'KABRAK';
export const APP_NAME_SUB = IS_BOGO ? '& SAOUDIE SERVICE' : 'Exchange Pro';

// Colors
export const BRAND_DARK   = IS_BOGO ? '#0d1447' : '#071a12';
export const BRAND_MID    = IS_BOGO ? '#1a237e' : '#0a3d22';
export const BRAND_MAIN   = IS_BOGO ? '#1a237e' : '#0B6E4F';
export const BRAND_GOLD   = IS_BOGO ? '#c9a227' : '#e8a020';

// Logo — for Bogo we use the Image component with the local asset
export const LOGO_IMAGE   = IS_BOGO ? require('../../assets/bogo-icon.png') : null;
