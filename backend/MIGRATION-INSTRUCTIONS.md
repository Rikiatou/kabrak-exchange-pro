# 🚀 Instructions de Migration - KABRAK Exchange Pro

## ✅ ÉTAPE 1 : Vérifier l'état actuel

**Ouvre ton navigateur et va sur :**
```
https://kabrak-exchange-pro-production.up.railway.app/api/migration/check-migration-status
```

Tu verras combien de données ont besoin d'être migrées.

---

## ✅ ÉTAPE 2 : Exécuter la migration

### **Option A : Via Postman/Insomnia (Recommandé)**

1. **Ouvre Postman ou Insomnia**

2. **Crée une nouvelle requête POST :**
   - URL: `https://kabrak-exchange-pro-production.up.railway.app/api/migration/migrate-old-data`
   - Method: `POST`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
   ```json
   {
     "secretToken": "KABRAK_MIGRATION_2024"
   }
   ```

3. **Envoie la requête**

4. **Vérifie la réponse** - tu devrais voir :
   ```json
   {
     "success": true,
     "message": "Migration terminée avec succès",
     "results": {
       "owners": [...],
       "totalMigrated": 123
     }
   }
   ```

---

### **Option B : Via cURL (Terminal)**

**Ouvre PowerShell et exécute :**

```powershell
$body = @{
    secretToken = "KABRAK_MIGRATION_2024"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kabrak-exchange-pro-production.up.railway.app/api/migration/migrate-old-data" -Method POST -Body $body -ContentType "application/json"
```

---

### **Option C : Via le navigateur (Console)**

1. **Va sur :** `https://kabrak-exchange-pro-production.up.railway.app`

2. **Ouvre la console du navigateur** (F12)

3. **Colle ce code et appuie sur Entrée :**

```javascript
fetch('https://kabrak-exchange-pro-production.up.railway.app/api/migration/migrate-old-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretToken: 'KABRAK_MIGRATION_2024' })
})
.then(r => r.json())
.then(data => console.log('✅ Migration:', data))
.catch(err => console.error('❌ Erreur:', err));
```

---

## ✅ ÉTAPE 3 : Vérifier que la migration a réussi

**Retourne sur :**
```
https://kabrak-exchange-pro-production.up.railway.app/api/migration/check-migration-status
```

**Tous les compteurs doivent être à 0 :**
```json
{
  "success": true,
  "needsMigration": false,
  "stats": {
    "clientsWithoutUserId": 0,
    "transactionsWithoutUserId": 0,
    "paymentsWithoutUserId": 0,
    ...
  }
}
```

---

## ✅ ÉTAPE 4 : Tester l'application

1. **Connecte-toi avec ton compte** : `rikiatouhassansale@gmail.com`
2. **Vérifie que tu vois tes clients, transactions, etc.**
3. **Crée un nouveau compte de test**
4. **Vérifie que le nouveau compte NE VOIT PAS les données de l'ancien**

---

## 🔒 Sécurité

Le token secret `KABRAK_MIGRATION_2024` est temporaire. Après la migration, tu peux :
- Supprimer les routes de migration
- Ou changer le token dans `.env` : `MIGRATION_SECRET=nouveau_token`

---

## ❓ Problèmes ?

### "Unauthorized" ou 403
- Vérifie que le `secretToken` est correct
- Vérifie que `MIGRATION_SECRET=KABRAK_MIGRATION_2024` est dans Railway

### "needsMigration: false" mais je ne vois pas mes données
- Les données ont déjà été migrées
- Vérifie que tu es connecté avec le bon compte
- Vérifie les logs Railway pour voir à quel owner les données ont été assignées

### Erreur 500
- Vérifie les logs Railway : `railway logs`
- Contacte le support si le problème persiste

---

## 📊 Résumé

✅ **Avant migration :** Anciennes données invisibles (userId = NULL)  
✅ **Après migration :** Toutes les données assignées au premier owner  
✅ **Isolation :** Chaque compte voit uniquement ses propres données  

**La migration est une opération sûre qui ne supprime aucune donnée !**
