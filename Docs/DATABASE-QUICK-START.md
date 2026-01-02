# Guide Rapide : Configuration de la Base de Données

## 🚀 Démarrage rapide (5 minutes)

### Étape 1 : Choisir un fournisseur de base de données

**Option recommandée : PlanetScale (Gratuit pour commencer)**

1. Créez un compte sur [planetscale.com](https://planetscale.com)
2. Créez une nouvelle base de données
3. Copiez l'URL de connexion (format : `mysql://...`)

### Étape 2 : Configurer dans Render

1. Allez dans votre service backend sur Render
2. Section "Environment"
3. Ajoutez la variable :
   ```
   DATABASE_URL = [l'URL que vous avez copiée]
   ```

### Étape 3 : Redémarrer le service

Render redémarrera automatiquement et :
- ✅ Se connectera à la base de données
- ✅ Créera toutes les tables automatiquement
- ✅ Ajoutera les colonnes manquantes

### Étape 4 : Vérifier

Vérifiez les logs Render, vous devriez voir :
```
✅ Connexion MySQL établie avec succès
📊 Création des tables si nécessaire...
✅ Tables créées avec succès
```

## 📋 Format de l'URL de connexion

```
mysql://username:password@host:port/database
```

**Exemple PlanetScale** :
```
mysql://abc123:xyz789@aws.connect.psdb.cloud:3306/meedconnect?sslaccept=strict
```

**Exemple Render (si MySQL disponible)** :
```
mysql://admin:password@dpg-xxxxx-a.oregon-postgres.render.com:3306/meedconnect_db
```

## ⚠️ Important

- **Ne partagez jamais** votre `DATABASE_URL` publiquement
- **Utilisez SSL** pour les connexions en production
- Les **migrations sont automatiques** - pas besoin de les exécuter manuellement

## 🆘 Besoin d'aide ?

Consultez `DATABASE-SETUP.md` pour plus de détails.

