# KABRAK Exchange Pro — Déploiement App Store & Play Store

## Prérequis

1. **Compte Expo EAS** : `npm install -g eas-cli` puis `eas login`
2. **Compte Apple Developer** : https://developer.apple.com (99$/an)
3. **Compte Google Play Console** : https://play.google.com/console (25$ unique)

---

## Étape 1 — Initialiser EAS

```bash
cd mobile
eas init --id YOUR_EAS_PROJECT_ID
```

Remplace `YOUR_EAS_PROJECT_ID` dans `app.json` par l'ID généré.

---

## Étape 2 — Build Android (Play Store)

### Build APK pour test interne
```bash
eas build --platform android --profile preview
```

### Build AAB pour Play Store
```bash
eas build --platform android --profile production
```

### Soumettre au Play Store
```bash
eas submit --platform android --profile production
```

> Nécessite un fichier `google-play-key.json` (Service Account Google Play).
> Guide : https://docs.expo.dev/submit/android/

---

## Étape 3 — Build iOS (App Store)

### Build pour simulateur (test)
```bash
eas build --platform ios --profile development
```

### Build pour App Store
```bash
eas build --platform ios --profile production
```

### Soumettre à l'App Store
```bash
eas submit --platform ios --profile production
```

> Nécessite : Apple ID, App Store Connect App ID, Apple Team ID.
> Guide : https://docs.expo.dev/submit/ios/

---

## Étape 4 — Fichiers manquants à créer manuellement

### `google-services.json` (Android — Firebase)
- Va sur https://console.firebase.google.com
- Crée un projet, ajoute l'app Android avec package `com.kabrak.exchangepro`
- Télécharge `google-services.json` et place-le dans `mobile/`

### `google-play-key.json` (soumission Play Store)
- Google Play Console → Setup → API access → Service account
- Télécharge la clé JSON et place-la dans `mobile/`

---

## Métadonnées App Store / Play Store

### Nom de l'app
- **FR** : KABRAK Exchange Pro
- **EN** : KABRAK Exchange Pro

### Description courte
Application professionnelle de gestion de bureau de change. Transactions, clients, devises, rapports et clôture de caisse.

### Description longue
KABRAK Exchange Pro est une solution complète pour les bureaux de change :
- Gestion des transactions de change
- Suivi des clients et de leurs dépôts
- Inventaire des devises en caisse
- Rapports et export PDF/Excel
- Clôture de caisse journalière
- Taux de change en temps réel
- Recherche globale et filtres avancés

### Catégorie
- **iOS** : Finance
- **Android** : Finance

### Mots-clés
bureau de change, forex, currency exchange, gestion devises, transactions, KABRAK

---

## Variables d'environnement à configurer

Dans `mobile/.env` (ou via EAS Secrets) :
```
API_URL=https://ton-backend.com/api
```

Dans `website/.env.local` :
```
NEXT_PUBLIC_API_URL=https://ton-backend.com
NEXT_PUBLIC_SITE_URL=https://kabrak.com
```

---

## Lien client PWA

Le client reçoit un lien du type :
```
https://kabrak.com/client/AB1234
```

Quand il ouvre ce lien sur mobile :
- **Android Chrome** : bannière "Ajouter à l'écran d'accueil" apparaît automatiquement
- **iOS Safari** : l'utilisateur doit appuyer sur "Partager" → "Sur l'écran d'accueil"

La PWA s'installe avec l'icône KABRAK et s'ouvre en mode standalone (sans barre de navigateur).
