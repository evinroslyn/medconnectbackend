# Déploiement Backend sur Render

## Configuration requise

### Variables d'environnement

Configurez ces variables dans Render :

```
NODE_ENV=production
PORT=10000
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-frontend.vercel.app,exp://192.168.1.1:8081
```

### Base de données

1. Créez une base de données MySQL sur Render ou utilisez une base externe
2. Configurez `DATABASE_URL` avec l'URL complète de connexion
3. Les migrations s'exécutent automatiquement au démarrage

### CORS

Le backend accepte les requêtes depuis :
- Le frontend Vercel (URL dans `CORS_ORIGIN`)
- Les applications Expo (format `exp://...`)

Séparez les URLs par des virgules dans `CORS_ORIGIN`.

## Déploiement

1. Connectez votre repository GitHub à Render
2. Configurez le service avec `render.yaml` ou manuellement
3. Ajoutez les variables d'environnement
4. Déployez

## Health Check

Le backend expose un endpoint de santé : `/api/health`

## Notes

- Render peut avoir un "cold start" de quelques secondes
- Les fichiers uploadés sont stockés dans `./uploads` (persistant sur Render)
- Les logs sont disponibles dans le dashboard Render

