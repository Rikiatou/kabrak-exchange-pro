# Exchange Management App
### Application de Gestion de Bureau de Change

---

## Structure du projet

```
exchange Management App/
├── backend/          # API Node.js + Express
└── mobile/           # Application React Native (Expo)
```

---

## BACKEND — Installation & Démarrage

### Prérequis
- Node.js v18+
- npm

### Installation

```bash
cd backend
npm install
```

### Configuration

```bash
# Copier le fichier .env
copy .env.example .env
```

Modifier `.env` selon vos besoins :
```env
PORT=5000
NODE_ENV=development
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
JWT_SECRET=votre_secret_jwt_tres_long_et_securise
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@exchange.com
ADMIN_PASSWORD=Admin@1234
```

### Initialiser la base de données + données de démo

```bash
npm run seed
```

Cela crée :
- Un compte **Admin** (admin@exchange.com / Admin@1234)
- 7 devises (EUR, USD, GBP, XOF, NGN, MAD, CHF)
- 3 clients de démonstration

### Démarrer le serveur

```bash
# Développement (avec rechargement automatique)
npm run dev

# Production
npm start
```

Le serveur tourne sur `http://localhost:5000`

### Endpoints API principaux

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Connexion |
| GET | /api/auth/me | Profil connecté |
| GET | /api/dashboard | Tableau de bord |
| GET/POST | /api/clients | Clients |
| GET/POST | /api/transactions | Transactions |
| POST | /api/payments | Enregistrer un paiement |
| GET | /api/currencies | Devises |
| GET | /api/cashbook/today | Journal du jour |
| GET | /api/reports/monthly | Rapport mensuel |
| GET | /api/alerts | Alertes |
| GET | /api/users | Utilisateurs (admin) |

---

## MOBILE — Installation & Démarrage

### Prérequis
- Node.js v18+
- Expo CLI : `npm install -g expo-cli`
- Application **Expo Go** sur votre téléphone (Android/iOS)

### Installation

```bash
cd mobile
npm install
```

### Configuration de l'IP du serveur

Ouvrir `src/services/api.js` et modifier l'IP :

```js
const BASE_URL = 'http://VOTRE_IP_LOCAL:5000/api';
// Exemple: 'http://192.168.1.100:5000/api'
```

> Pour trouver votre IP : `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
> Le téléphone et le PC doivent être sur le **même réseau WiFi**

### Démarrer l'application

```bash
npm start
```

Scanner le QR code avec **Expo Go** sur votre téléphone.

---

## Fonctionnalités

### Clients
- Enregistrement unique par client
- Fiche complète : historique, solde dû, total payé
- Recherche par nom, téléphone, numéro d'identité

### Transactions
- Échange multi-devises avec taux personnalisé
- Calcul automatique du montant à recevoir
- Statuts : 🔴 Non payé / 🟡 Partiel / 🟢 Soldé

### Paiements
- Paiements partiels supportés
- Mise à jour automatique du solde client
- Méthodes : Espèces, Virement, Mobile Money

### Reçus PDF
- Génération automatique après chaque transaction
- Envoi par **WhatsApp / Email** (partage natif)
- **Impression** directe depuis l'application
- Contient : référence, client, échange, solde restant, historique paiements

### Tableau de bord
- Total argent dehors (créances)
- Clients débiteurs classés par montant
- Transactions récentes
- Résumé journalier

### Journal de caisse
- Ouverture/clôture de journée par devise
- Comptage physique vs système
- Calcul automatique des écarts

### Multi-devises
- EUR, USD, GBP, XOF (FCFA), NGN, MAD, CHF, etc.
- Taux d'achat et de vente séparés
- Historique des taux
- Alertes stock faible

### Alertes intelligentes
- Seuil de dette client dépassé
- Stock de devise faible
- Vérification manuelle ou automatique

### Rapports
- Rapport mensuel par devise
- Relevé de compte client
- Export PDF

### Sécurité
- Authentification JWT
- Rôles : Admin / Employé
- Journal d'audit (toutes les actions tracées)
- Mots de passe hashés (bcrypt)

---

## Identifiants par défaut

```
Email    : admin@exchange.com
Password : Admin@1234
```

> ⚠️ **Changer le mot de passe après la première connexion !**

---

## Technologies utilisées

### Backend
- Node.js + Express
- Sequelize ORM + SQLite (migrable vers PostgreSQL)
- JWT + bcryptjs
- Helmet, CORS, Rate Limiting

### Mobile
- React Native + Expo
- Expo Router (navigation)
- Zustand (state management)
- expo-print + expo-sharing (PDF)
- expo-secure-store (token sécurisé)
- Axios (API calls)
