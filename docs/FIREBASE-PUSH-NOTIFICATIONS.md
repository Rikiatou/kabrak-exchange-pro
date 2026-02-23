# Guide Firebase Push Notifications

## Architecture actuelle

Le système utilise **Expo Push Notifications** (pas Firebase directement).
- Le mobile obtient un **Expo Push Token** via `expo-notifications`
- Le token est envoyé au backend via `PUT /api/auth/push-token`
- Le backend envoie les notifications via l'API Expo Push (`https://exp.host/--/api/v2/push/send`)

## Quand les notifications sont envoyées

| Événement | Titre | Destinataire |
|-----------|-------|-------------|
| Essai gratuit activé | 🎉 Essai gratuit activé ! | Utilisateur |
| Paiement Orange Money reçu | 📝 Paiement reçu | Utilisateur |
| Licence activée (admin valide) | ✅ Licence activée ! | Utilisateur |
| Paiement rejeté | ❌ Paiement rejeté | Utilisateur |
| Licence bientôt expirée | ⚠️ Licence bientôt expirée | Utilisateur |

## Configuration Firebase (pour builds natifs)

Pour les builds EAS (production APK/IPA), Firebase est nécessaire comme transport pour les push notifications.

### 1. Créer un projet Firebase
1. Aller sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Cliquer **"Ajouter un projet"**
3. Nom : `kabrak-exchange-pro`
4. Désactiver Google Analytics (optionnel)

### 2. Ajouter l'app Android
1. Dans le projet Firebase, cliquer **"Ajouter une application" > Android**
2. Package name : `com.kabrak.exchangepro`
3. Télécharger `google-services.json`
4. Placer le fichier dans : `mobile/google-services.json`

### 3. Ajouter l'app iOS (optionnel)
1. Cliquer **"Ajouter une application" > iOS**
2. Bundle ID : `com.kabrak.exchangepro`
3. Télécharger `GoogleService-Info.plist`
4. Placer dans : `mobile/GoogleService-Info.plist`

### 4. Configurer les credentials FCM dans Expo
1. Aller sur [https://expo.dev](https://expo.dev)
2. Projet > Credentials > Android
3. Uploader la **Server Key FCM** (trouvée dans Firebase > Project Settings > Cloud Messaging)

### 5. Configurer le Project ID EAS
Dans `mobile/app.json`, remplacer :
```json
"extra": {
  "eas": {
    "projectId": "YOUR_EAS_PROJECT_ID"
  }
}
```
Par votre vrai Project ID depuis [https://expo.dev](https://expo.dev).

### 6. Build de production
```bash
# Installer EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

## Test en développement

En mode développement (`expo start`), les push notifications fonctionnent via Expo Go **sans Firebase**. Firebase n'est nécessaire que pour les builds natifs (APK/IPA).

Pour tester :
1. Lancer l'app sur un appareil physique (pas émulateur)
2. Se connecter → le push token est automatiquement enregistré
3. Faire un paiement → la notification arrive sur l'appareil

## Fichiers concernés

- `mobile/src/utils/pushNotifications.js` — Enregistrement du token
- `mobile/src/store/authStore.js` — Envoi du token au backend après login
- `backend/src/services/push.service.js` — Service d'envoi centralisé
- `backend/src/routes/auth.routes.js` — Endpoint `PUT /auth/push-token`
- `backend/src/routes/payment.routes.js` — Envoi des notifications sur événements
- `backend/src/models/User.js` — Champ `expoPushToken` sur le modèle User
