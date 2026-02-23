# Guide Stripe - Mise en Production

## 1. Créer un compte Stripe

1. Aller sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Remplir les informations de votre entreprise
3. Vérifier votre email

## 2. Activer le compte (obligatoire pour les paiements réels)

1. Aller dans **Settings > Account details**
2. Remplir toutes les informations requises :
   - Nom de l'entreprise
   - Adresse
   - Numéro de téléphone
   - Informations bancaires (compte pour recevoir les paiements)
3. Soumettre la vérification

## 3. Obtenir les clés de production

### Clé secrète (Secret Key)
1. Aller sur [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Basculer le toggle **"Test mode"** vers **OFF** (mode Live)
3. Copier la **Secret key** qui commence par `sk_live_...`

### Webhook Secret
1. Aller sur [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer **"Add endpoint"**
3. URL : `https://kabrak-exchange-pro-production.up.railway.app/api/payments/stripe/webhook`
4. Événements à écouter : `checkout.session.completed`
5. Cliquer **"Add endpoint"**
6. Copier le **Signing secret** qui commence par `whsec_...`

## 4. Configurer les variables d'environnement

### Sur Railway (production)
```bash
# Dans le dashboard Railway > Variables
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_ICI
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI
```

### En local (développement)
Ajouter dans le fichier `.env` :
```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_TEST
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_TEST
```

## 5. Tester avant la mise en production

### Mode Test (recommandé d'abord)
- Utiliser les clés `sk_test_...` 
- Carte de test : `4242 4242 4242 4242` (expiration future, CVC quelconque)
- Vérifier que le webhook reçoit bien l'événement
- Vérifier que la licence s'active automatiquement

### Mode Live
- Basculer vers les clés `sk_live_...`
- Faire un vrai paiement de test avec une vraie carte
- Vérifier le flux complet

## 6. Devises supportées

Le système convertit automatiquement XOF → EUR :
- **Basic** : 100,000 XOF ≈ 153 EUR
- **Premium** : 1,000,000 XOF ≈ 1,527 EUR

La conversion utilise le taux fixe 1 EUR = 655 XOF.

## 7. Important - Webhook pour le body raw

Le webhook Stripe nécessite le body brut (raw). Assurez-vous que la route webhook est configurée **avant** le middleware `express.json()` ou utilisez `express.raw()` pour cette route spécifique.

Si vous rencontrez des erreurs de signature webhook, ajoutez dans `server.js` :
```javascript
// AVANT app.use(express.json())
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
```

## 8. Checklist de production

- [ ] Compte Stripe vérifié et activé
- [ ] Clé secrète live configurée (`sk_live_...`)
- [ ] Webhook endpoint créé et secret configuré (`whsec_...`)
- [ ] Body raw configuré pour le webhook
- [ ] Test de paiement réussi en mode test
- [ ] Test de paiement réussi en mode live
- [ ] Licence s'active automatiquement après paiement
- [ ] Email de confirmation envoyé après activation
