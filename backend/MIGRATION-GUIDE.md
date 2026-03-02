# Guide de Migration - Isolation Multi-Tenant

## 🔒 Contexte

L'application a été mise à jour pour ajouter une **isolation complète** des données entre les différents bureaux de change. Chaque compte (owner) ne voit maintenant que ses propres données.

### Changements appliqués :
- ✅ Ajout de la colonne `userId` aux tables `clients` et `alerts`
- ✅ Filtrage par `userId` dans tous les controllers
- ✅ Isolation complète : clients, transactions, paiements, devises, alertes, etc.

---

## ⚠️ Problème avec les anciennes données

Les données créées **AVANT** cette mise à jour ont `userId = NULL`. Elles ne seront **PAS visibles** dans l'application tant qu'elles n'auront pas été assignées à un owner.

---

## 🛠️ Solution : Script de Migration

### Option 1 : Migration Automatique (Recommandé)

**Exécuter le script de migration sur Railway :**

1. **Connecte-toi à Railway CLI** (si pas déjà fait) :
   ```bash
   railway login
   ```

2. **Exécute le script de migration** :
   ```bash
   railway run node src/scripts/migrate-old-data.js
   ```

3. **Vérifie les logs** pour confirmer que les données ont été migrées.

**⚠️ IMPORTANT :** Ce script assigne **TOUTES** les anciennes données au **PREMIER owner** trouvé dans la base de données.

---

### Option 2 : Migration Manuelle via SQL

Si tu as **plusieurs owners** et que tu veux assigner les données manuellement :

#### 1. Identifier les owners

```sql
SELECT id, email, "firstName", "lastName" 
FROM users 
WHERE "teamOwnerId" IS NULL OR "teamRole" = 'owner';
```

#### 2. Assigner les données à un owner spécifique

Remplace `'OWNER_ID_ICI'` par l'ID de l'owner :

```sql
-- Clients
UPDATE clients SET "userId" = 'OWNER_ID_ICI' WHERE "userId" IS NULL;

-- Transactions
UPDATE transactions SET "userId" = 'OWNER_ID_ICI' WHERE "userId" IS NULL;

-- Paiements
UPDATE payments SET "userId" = 'OWNER_ID_ICI' WHERE "userId" IS NULL;

-- Devises
UPDATE currencies SET "userId" = 'OWNER_ID_ICI' WHERE "userId" IS NULL;

-- Alertes
UPDATE alerts SET "userId" = 'OWNER_ID_ICI' WHERE "userId" IS NULL;

-- Livre de caisse
UPDATE "cash_books" SET "userId" = 'OWNER_ID_ICI' WHERE "userId" IS NULL;

-- Versements
UPDATE deposit_orders SET "userId" = 'OWNER_ID_ICI' WHERE "userId" IS NULL;
```

---

### Option 3 : Supprimer les anciennes données (si test)

Si les anciennes données sont juste des **données de test** :

```sql
-- Supprimer toutes les données sans userId
DELETE FROM payments WHERE "userId" IS NULL;
DELETE FROM transactions WHERE "userId" IS NULL;
DELETE FROM clients WHERE "userId" IS NULL;
DELETE FROM currencies WHERE "userId" IS NULL;
DELETE FROM alerts WHERE "userId" IS NULL;
DELETE FROM "cash_books" WHERE "userId" IS NULL;
DELETE FROM deposit_orders WHERE "userId" IS NULL;
```

---

## 📊 Vérification après migration

### 1. Vérifier qu'il n'y a plus de données NULL

```sql
SELECT 
  (SELECT COUNT(*) FROM clients WHERE "userId" IS NULL) as clients_null,
  (SELECT COUNT(*) FROM transactions WHERE "userId" IS NULL) as transactions_null,
  (SELECT COUNT(*) FROM payments WHERE "userId" IS NULL) as payments_null,
  (SELECT COUNT(*) FROM currencies WHERE "userId" IS NULL) as currencies_null,
  (SELECT COUNT(*) FROM alerts WHERE "userId" IS NULL) as alerts_null;
```

**Résultat attendu :** Tous les compteurs doivent être à **0**.

### 2. Tester l'application

1. Connecte-toi avec un compte existant
2. Vérifie que tu vois tes clients, transactions, etc.
3. Crée un nouveau compte
4. Vérifie que le nouveau compte ne voit **PAS** les données de l'ancien compte

---

## 🚀 Comptes actuels

D'après la configuration, tu as actuellement **2 licences actives** :

1. **rikiatouhassansale@gmail.com** - Licence: `55E1-1780-8F95-4BBC-21F7-4676-4875-BB98`
2. **elkabir2016@gmail.com** - Licence: `B844-EFA3-8AFB-2B2F-E1E8-AE88-B5E5-0D08`

**Recommandation :** Exécute le script de migration pour assigner toutes les anciennes données au premier compte, puis teste avec le deuxième compte pour vérifier l'isolation.

---

## ❓ Questions fréquentes

### Q: Que se passe-t-il si je ne migre pas les données ?
**R:** Les anciennes données avec `userId = NULL` ne seront **pas visibles** dans l'application. Elles existent toujours dans la base de données mais sont filtrées.

### Q: Puis-je annuler la migration ?
**R:** Oui, tu peux remettre `userId = NULL` avec une requête SQL, mais ce n'est pas recommandé.

### Q: Le script va-t-il supprimer des données ?
**R:** Non, le script ne fait que **mettre à jour** la colonne `userId`. Aucune donnée n'est supprimée.

### Q: Que faire si j'ai plusieurs bureaux de change ?
**R:** Utilise l'**Option 2** (migration manuelle SQL) pour assigner les données à chaque owner spécifique.

---

## 📞 Support

Si tu rencontres des problèmes lors de la migration, vérifie :
1. Les logs du script de migration
2. Les logs Railway
3. La connexion à la base de données

**En cas de problème, contacte le support technique.**
