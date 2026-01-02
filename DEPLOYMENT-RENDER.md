# Guide de Déploiement sur Render

## 📋 Configuration sur Render

### Étape 1 : Configuration de Base

Sur la page de configuration Render, configurez comme suit :

#### **Langue (Runtime)**
- Sélectionnez : **Nœud** (Node)

#### **Branche**
- Sélectionnez : **Principaux** (main)

#### **Région**
- Sélectionnez : **Virginie (États-Unis Est)** ou la région la plus proche de vos utilisateurs

#### **Répertoire racine optionnel**
- Entrez : **Backend**
- ⚠️ **IMPORTANT** : Si votre projet est un monorepo, entrez `Backend` ici

#### **Commande de construction (Build Command)**
- Entrez : **`npm ci --include=dev && npm run build`**
- Ou : **`yarn install --include=dev && yarn build`** si vous utilisez Yarn
- ⚠️ **IMPORTANT** : Utilisez `npm ci --include=dev` (et non `npm install`) pour une installation propre et pour vous assurer que les dépendances de développement (ex. `@types/*`) nécessaires au build TypeScript sont installées. Si vous définissez `NODE_ENV=production` dans vos variables d'environnement, ajoutez `--include=dev` explicitement pour installer les devDependencies pendant le build.

#### **Start Command**
- Entrez : **`npm start`**
- Ou : **`yarn start`** si vous utilisez Yarn

### Étape 2 : Variables d'Environnement

Dans la section **Environment Variables**, ajoutez les variables suivantes :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Environnement de production |
| `PORT` | `10000` | Port (Render définit automatiquement, mais vous pouvez spécifier) |
| `DATABASE_URL` | `mysql://user:password@host:port/database` | URL de connexion MySQL |
| `JWT_SECRET` | `votre-secret-jwt-tres-securise` | Secret pour signer les JWT |
| `CORS_ORIGIN` | `https://votre-app.vercel.app` | URL de votre frontend Vercel |
| `EMAIL_HOST` | `smtp.gmail.com` | Serveur SMTP (si vous utilisez l'envoi d'emails) |
| `EMAIL_PORT` | `587` | Port SMTP |
| `EMAIL_USER` | `votre-email@gmail.com` | Email pour l'envoi |
| `EMAIL_PASS` | `votre-mot-de-passe-app` | Mot de passe d'application |

**Exemple de configuration :**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=mysql://user:password@host:3306/meed_connect
JWT_SECRET=mon-super-secret-jwt-changez-moi-en-production
CORS_ORIGIN=https://med-connect.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
```

### Étape 3 : Base de Données MySQL

#### Option 1 : Base de données Render (Recommandé)

1. Dans Render, créez un nouveau service **MySQL**
2. Notez l'URL de connexion fournie
3. Utilisez cette URL dans la variable `DATABASE_URL`

#### Option 2 : Base de données externe

- Utilisez PlanetScale, AWS RDS, ou un autre service MySQL
- Entrez l'URL de connexion dans `DATABASE_URL`

### Étape 4 : Déploiement

1. Cliquez sur **"Create Web Service"** ou **"Save Changes"**
2. Render va :
   - Cloner votre dépôt
   - Installer les dépendances (`npm install`)
   - Builder l'application (`npm run build`)
   - Démarrer le service (`npm start`)

### Étape 5 : Vérification

Après le déploiement, vous obtiendrez une URL comme :
```
https://meed-connect-backend.onrender.com
```

Testez l'endpoint de santé :
```
https://meed-connect-backend.onrender.com/health
```

## 🔧 Configuration CORS

Assurez-vous que `CORS_ORIGIN` contient l'URL de votre frontend Vercel :

```
CORS_ORIGIN=https://med-connect.vercel.app,https://med-connect-git-main.vercel.app
```

Pour autoriser plusieurs domaines, séparez-les par des virgules.

## 📝 Notes Importantes

1. **Répertoire racine** : Utilisez `Backend` si votre projet est un monorepo
2. **Build Command** : `npm install && npm run build` (installe puis build)
3. **Start Command** : `npm start` (lance le serveur Node.js)
4. **Port** : Render définit automatiquement le port via `process.env.PORT`
5. **Base de données** : Les migrations s'exécutent automatiquement au démarrage

## 🐛 Dépannage

### Erreur : "Cannot find module"
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que `node_modules` n'est pas dans `.gitignore`

### Erreur : "Port already in use"
- Render définit automatiquement le port via `process.env.PORT`
- Vérifiez que votre code utilise `process.env.PORT || 3000`

### Erreur de connexion à la base de données
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que la base de données est accessible depuis Render
- Vérifiez les migrations dans `Backend/src/infrastructure/database/db.ts`

### Erreur CORS
- Vérifiez que `CORS_ORIGIN` contient l'URL de votre frontend
- Vérifiez que l'URL est exacte (avec ou sans `/` à la fin)

## 🔄 Mise à Jour

Pour mettre à jour votre backend :
1. Faites vos modifications
2. Committez et pushez sur GitHub
3. Render redéploiera automatiquement

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [Node.js sur Render](https://render.com/docs/node)
- [MySQL sur Render](https://render.com/docs/databases)

