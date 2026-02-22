# 🚀 KABRAK Exchange Pro — Guide de déploiement production

## Architecture cible

```
App Mobile (Expo EAS) ──────────────────────┐
                                             ▼
Website (Vercel) ──────────────► Backend API (Render) ──► PostgreSQL (Railway)
                                             │
                                             └──► Fichiers uploads (Render disk)
```

---

## ÉTAPE 1 — Base de données PostgreSQL sur Railway

### 1.1 Créer la base
1. Va sur https://railway.app → **Sign up with GitHub**
2. **New Project** → **Deploy PostgreSQL**
3. Attends 30 secondes que la DB démarre
4. Clique sur le service PostgreSQL → onglet **Variables**
5. Note ces 5 valeurs :
   - `PGHOST` → ton DB_HOST
   - `PGPORT` → ton DB_PORT (5432)
   - `PGDATABASE` → ton DB_NAME
   - `PGUSER` → ton DB_USER
   - `PGPASSWORD` → ton DB_PASSWORD

---

## ÉTAPE 2 — Backend Node.js sur Render

### 2.1 Préparer le repo Git
Assure-toi que le dossier `backend/` est dans un repo Git (ou push tout le projet).

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2.2 Créer le service sur Render
1. Va sur https://render.com → **Sign up with GitHub**
2. **New** → **Web Service**
3. Connecte ton repo GitHub
4. Configure :
   - **Name** : `kabrak-exchange-backend`
   - **Root Directory** : `backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free (ou Starter à 7$/mois pour plus de perf)

### 2.3 Variables d'environnement sur Render
Dans **Environment** → ajoute ces variables :

```
NODE_ENV=production
PORT=10000
DB_DIALECT=postgres
DB_HOST=<PGHOST de Railway>
DB_PORT=5432
DB_NAME=<PGDATABASE de Railway>
DB_USER=<PGUSER de Railway>
DB_PASSWORD=<PGPASSWORD de Railway>
JWT_SECRET=<génère une clé aléatoire longue>
JWT_REFRESH_SECRET=<génère une autre clé aléatoire>
CORS_ORIGIN=https://ton-site.vercel.app,https://kabrak.com
```

> Pour générer une clé JWT : https://generate-secret.vercel.app/64

### 2.4 Initialiser la base de données
Après le premier déploiement, dans Render → **Shell** :
```bash
npm run migrate
npm run seed
```

### 2.5 Ton URL backend
Render te donne une URL du type :
```
https://kabrak-exchange-backend.onrender.com
```
**Note cette URL** — tu en auras besoin pour le website et l'app mobile.

---

## ÉTAPE 3 — Website Next.js sur Vercel

### 3.1 Déployer
1. Va sur https://vercel.com → **Sign up with GitHub**
2. **New Project** → importe ton repo
3. Configure :
   - **Root Directory** : `website`
   - **Framework** : Next.js (détecté automatiquement)

### 3.2 Variables d'environnement sur Vercel
Dans **Settings** → **Environment Variables** :

```
NEXT_PUBLIC_API_URL=https://kabrak-exchange-backend.onrender.com
NEXT_PUBLIC_SITE_URL=https://ton-projet.vercel.app
```

### 3.3 Domaine personnalisé (optionnel)
Dans Vercel → **Domains** → ajoute `kabrak.com`
Configure chez ton registrar :
```
A     @    76.76.21.21
CNAME www  cname.vercel-dns.com
```

---

## ÉTAPE 4 — App Mobile (EAS Build)

### 4.1 Installer EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 4.2 Mettre à jour l'URL API dans l'app mobile
Dans `mobile/src/services/api.js`, remplace :
```js
const BASE_URL = 'http://localhost:5000/api';
```
par :
```js
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://kabrak-exchange-backend.onrender.com/api';
```

Ou crée `mobile/.env` :
```
EXPO_PUBLIC_API_URL=https://kabrak-exchange-backend.onrender.com/api
```

### 4.3 Initialiser EAS
```bash
cd mobile
eas init
```
Copie le `projectId` généré et mets-le dans `app.json` → `extra.eas.projectId`.

### 4.4 Build Android (APK test interne)
```bash
eas build --platform android --profile preview
```
→ Génère un APK téléchargeable, partage le lien pour tester.

### 4.5 Build Android (Play Store — AAB)
```bash
eas build --platform android --profile production
```

### 4.6 Soumettre au Play Store
1. Crée un compte Google Play Console (25$ unique) : https://play.google.com/console
2. Crée une nouvelle app → remplis les métadonnées
3. Upload le fichier `.aab` généré par EAS
4. Ou utilise `eas submit --platform android`

### 4.7 Build iOS (App Store)
Nécessite un Mac ou un compte Apple Developer (99$/an).
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## ÉTAPE 5 — Vérifications post-déploiement

### Checklist
- [ ] `https://kabrak-exchange-backend.onrender.com/api/health` → répond `{"success":true}`
- [ ] Login admin fonctionne depuis l'app mobile
- [ ] Page upload client `https://kabrak.com/upload/XX1234` fonctionne
- [ ] Page portal client `https://kabrak.com/client/XXXX` fonctionne
- [ ] Formulaire de contact sur le website envoie bien la demande de licence

### Commandes de vérification
```bash
# Test santé backend
curl https://kabrak-exchange-backend.onrender.com/api/health

# Test login
curl -X POST https://kabrak-exchange-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exchange.com","password":"Admin@1234"}'
```

---

## Résumé des URLs en production

| Service | URL |
|---------|-----|
| Backend API | `https://kabrak-exchange-backend.onrender.com` |
| Website | `https://kabrak.com` (ou `xxx.vercel.app`) |
| Portal client | `https://kabrak.com/client/[code]` |
| Upload reçu | `https://kabrak.com/upload/[code]` |
| App Android | Play Store → KABRAK Exchange Pro |
| App iOS | App Store → KABRAK Exchange Pro |

---

## Coûts estimés

| Service | Plan | Coût |
|---------|------|------|
| Railway (PostgreSQL) | Hobby | ~5$/mois |
| Render (Backend) | Free | 0$ (dort après 15min inactivité) |
| Render (Backend) | Starter | 7$/mois (toujours actif) |
| Vercel (Website) | Free | 0$ |
| Google Play Console | One-time | 25$ |
| Apple Developer | Annual | 99$/an |

> **Recommandation** : Render Starter (7$/mois) pour éviter le "cold start" de 30s sur le plan gratuit.
