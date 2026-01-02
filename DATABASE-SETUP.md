# Configuration de la Base de Données MySQL

Ce guide explique comment configurer la base de données MySQL pour le déploiement sur Render ou une autre plateforme.

## 📊 Options d'hébergement de la base de données

### Option 1 : Base de données MySQL sur Render (Recommandé)

Render propose des bases de données MySQL gérées :

1. **Créer une base de données MySQL sur Render** :
   - Allez sur [Render Dashboard](https://dashboard.render.com)
   - Cliquez sur "New +" → "PostgreSQL" (ou cherchez "MySQL")
   - **Note** : Render propose principalement PostgreSQL, mais vous pouvez utiliser une base MySQL externe

2. **Obtenir l'URL de connexion** :
   - Render fournira une `DATABASE_URL` au format : `mysql://user:password@host:port/database`
   - Copiez cette URL

3. **Configurer dans le service backend** :
   - Dans les variables d'environnement de votre service backend Render
   - Ajoutez : `DATABASE_URL=mysql://user:password@host:port/database`

### Option 2 : Base de données MySQL externe (PlanetScale, AWS RDS, etc.)

#### PlanetScale (Recommandé pour MySQL)

1. **Créer un compte sur [PlanetScale](https://planetscale.com)**
2. **Créer une nouvelle base de données**
3. **Obtenir l'URL de connexion** :
   - Format : `mysql://user:password@host:port/database?sslaccept=strict`
4. **Configurer dans Render** :
   - Ajoutez `DATABASE_URL` avec l'URL complète

#### AWS RDS MySQL

1. **Créer une instance RDS MySQL**
2. **Configurer les groupes de sécurité** pour autoriser Render
3. **Obtenir l'endpoint RDS** et créer l'URL :
   ```
   mysql://username:password@your-rds-endpoint.region.rds.amazonaws.com:3306/database
   ```

#### Autres options

- **DigitalOcean Managed MySQL**
- **Azure Database for MySQL**
- **Google Cloud SQL**

## 🔧 Configuration dans Render

### Variables d'environnement

Dans votre service backend Render, configurez **UNE** des deux options :

#### Option A : Utiliser DATABASE_URL (Recommandé)

```
DATABASE_URL=mysql://user:password@host:port/database
```

**Exemple** :
```
DATABASE_URL=mysql://admin:MySecurePassword123@dpg-xxxxx-a.oregon-postgres.render.com:3306/meedconnect_db
```

#### Option B : Utiliser les variables individuelles

```
DB_HOST=your-db-host.com
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=meedconnect
```

**Note** : `DATABASE_URL` a la priorité si les deux sont définis.

## 🚀 Migration automatique

Le backend exécute automatiquement les migrations au démarrage :

1. **Création des tables** : Si les tables n'existent pas, elles sont créées automatiquement
2. **Ajout des colonnes** : Les colonnes manquantes sont ajoutées automatiquement
3. **Création des index** : Les index nécessaires sont créés

### Logs de migration

Lors du démarrage, vous verrez dans les logs Render :

```
📊 Création des tables si nécessaire...
✅ Tables créées avec succès
✅ Migration 'date_validation' ajoutée à medecins
✅ Migration 'description' ajoutée à medecins
...
```

## ✅ Vérification

### 1. Vérifier la connexion

Le backend teste automatiquement la connexion au démarrage. Vérifiez les logs Render pour :

```
✅ Connexion MySQL établie avec succès
```

### 2. Tester manuellement

Vous pouvez tester la connexion en appelant l'endpoint de santé :

```bash
curl https://votre-backend.onrender.com/health
```

### 3. Vérifier les tables

Connectez-vous à votre base de données MySQL et vérifiez que les tables existent :

```sql
SHOW TABLES;
```

Vous devriez voir :
- `utilisateurs`
- `patients`
- `medecins`
- `administrateurs`
- `dossiers_medicaux`
- `documents_medicaux`
- `historique_validations`
- etc.

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter les credentials** dans le code
2. **Utiliser des mots de passe forts** pour la base de données
3. **Restreindre l'accès** : Configurez les firewall pour n'autoriser que Render
4. **Activer SSL/TLS** : Utilisez des connexions sécurisées

### Variables sensibles

Toutes les variables de base de données sont marquées comme `sync: false` dans `render.yaml`, ce qui signifie qu'elles ne sont pas synchronisées entre les environnements et doivent être configurées manuellement.

## 🐛 Dépannage

### Erreur : "Access denied for user"

- Vérifiez que le nom d'utilisateur et le mot de passe sont corrects
- Vérifiez que l'utilisateur a les permissions nécessaires

### Erreur : "Can't connect to MySQL server"

- Vérifiez que l'host est correct
- Vérifiez que le port est correct (généralement 3306)
- Vérifiez que le firewall autorise les connexions depuis Render

### Erreur : "Unknown database"

- Vérifiez que le nom de la base de données est correct
- Créez la base de données si elle n'existe pas :
  ```sql
  CREATE DATABASE meedconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

### Les migrations ne s'exécutent pas

- Vérifiez les logs Render pour voir les erreurs
- Vérifiez que l'utilisateur a les permissions `CREATE`, `ALTER`, `INDEX`
- Les migrations s'exécutent uniquement si les tables/colonnes n'existent pas déjà

## 📝 Exemple de configuration complète

### Render Dashboard

```
Variables d'environnement :
├── NODE_ENV=production
├── PORT=10000
├── DATABASE_URL=mysql://admin:SecurePass123@db.example.com:3306/meedconnect
├── JWT_SECRET=your-super-secret-key
└── CORS_ORIGIN=https://votre-app.vercel.app
```

### Structure de la base de données

Après les migrations, votre base de données contiendra :

```
meedconnect/
├── utilisateurs
├── patients
├── medecins
│   ├── id
│   ├── nom
│   ├── specialite
│   ├── date_validation (ajouté automatiquement)
│   ├── description (ajouté automatiquement)
│   └── ...
├── administrateurs
├── dossiers_medicaux
├── documents_medicaux
├── historique_validations
└── ...
```

## 🔄 Sauvegarde

### Recommandations

1. **Sauvegardes automatiques** : Configurez des sauvegardes automatiques sur votre fournisseur de base de données
2. **Sauvegardes manuelles** : Exportez régulièrement votre base de données
3. **Test de restauration** : Testez régulièrement la restauration des sauvegardes

### Export manuel

```bash
mysqldump -h host -u user -p database > backup.sql
```

### Import

```bash
mysql -h host -u user -p database < backup.sql
```

