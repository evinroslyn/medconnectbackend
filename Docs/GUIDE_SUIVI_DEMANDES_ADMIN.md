# Guide du Système de Suivi des Demandes d'Administration

## Vue d'ensemble

Ce guide détaille la procédure complète pour utiliser le système de suivi efficace des demandes de validation des médecins. Le système permet aux administrateurs de suivre toutes les actions effectuées sur les demandes avec un historique complet et une traçabilité.

## Fonctionnalités du Système

### 1. Suivi Complet des Demandes
- **Demandes en attente** : Nouvelles inscriptions à traiter
- **Demandes approuvées** : Médecins validés avec historique
- **Demandes rejetées** : Médecins refusés avec motifs détaillés

### 2. Historique Détaillé
- Traçabilité de toutes les actions
- Identification de l'administrateur responsable
- Horodatage précis des actions
- Motifs détaillés des rejets
- Adresse IP pour la sécurité

### 3. Recherche et Filtrage
- Recherche par nom, spécialité, numéro de licence
- Filtrage par statut et dates
- Pagination des résultats

## Procédure Pas à Pas

### Étape 1 : Mise en Place de la Base de Données

1. **Exécuter la migration SQL** :
   ```bash
   mysql -u [username] -p [database_name] < Backend/src/infrastructure/database/migrations/add-tracking-fields.sql
   ```

2. **Vérifier les nouvelles tables** :
   - Table `medecins` avec nouveaux champs de suivi
   - Table `historique_validations` pour l'historique complet

### Étape 2 : Utilisation des API

#### A. Récupérer les Demandes par Statut

**Demandes en attente** :
```http
GET /api/admin/medecins/en-attente
Authorization: Bearer [token_admin]
```

**Demandes approuvées** :
```http
GET /api/admin/medecins/valides
Authorization: Bearer [token_admin]
```

**Demandes rejetées** :
```http
GET /api/admin/medecins/rejetes
Authorization: Bearer [token_admin]
```

#### B. Valider une Demande

```http
PATCH /api/admin/medecins/{medecinId}/valider
Authorization: Bearer [token_admin]
Content-Type: application/json
```

**Résultat** :
- Statut changé vers "valide"
- Mot de passe généré et envoyé par email
- Action enregistrée dans l'historique
- Admin validateur identifié

#### C. Rejeter une Demande

```http
PATCH /api/admin/medecins/{medecinId}/rejeter
Authorization: Bearer [token_admin]
Content-Type: application/json

{
  "motif": "Documents incomplets - Diplôme non lisible"
}
```

**Résultat** :
- Statut changé vers "rejete"
- Motif enregistré
- Email de notification envoyé
- Action tracée dans l'historique

#### D. Consulter l'Historique

```http
GET /api/admin/medecins/{medecinId}/historique
Authorization: Bearer [token_admin]
```

**Réponse exemple** :
```json
{
  "success": true,
  "message": "Historique récupéré avec succès",
  "data": [
    {
      "id": "hist-123",
      "action": "rejet",
      "statutAvant": "en_attente",
      "statutApres": "rejete",
      "motif": "Documents incomplets",
      "dateAction": "2024-01-15T10:30:00Z",
      "adminNom": "Dr. Martin Admin",
      "adminEmail": "admin@medconnect.com"
    }
  ]
}
```

#### E. Rechercher avec Filtres

```http
GET /api/admin/medecins/rechercher?statut=valide&specialite=Cardiologie&page=1&limit=10
Authorization: Bearer [token_admin]
```

### Étape 3 : Bonnes Pratiques

#### A. Validation des Demandes
1. **Vérifier tous les documents** avant validation
2. **Utiliser des motifs clairs** pour les rejets
3. **Documenter les actions** dans les commentaires internes

#### B. Gestion des Rejets
1. **Motifs détaillés** : Expliquer précisément pourquoi
2. **Suggestions d'amélioration** : Guider le médecin
3. **Ton professionnel** : Rester constructif

#### C. Suivi et Reporting
1. **Consulter régulièrement** les statistiques
2. **Analyser les tendances** de validation/rejet
3. **Identifier les problèmes récurrents**

### Étape 4 : Statistiques et Monitoring

#### Récupérer les Statistiques
```http
GET /api/admin/statistiques
Authorization: Bearer [token_admin]
```

**Métriques disponibles** :
- Nombre total de demandes par statut
- Pourcentages de validation/rejet
- Évolution temporelle
- Performance des administrateurs

### Étape 5 : Sécurité et Traçabilité

#### Informations Tracées
- **Qui** : ID et nom de l'administrateur
- **Quand** : Horodatage précis
- **Quoi** : Action effectuée et changement de statut
- **Pourquoi** : Motif détaillé
- **Où** : Adresse IP de l'action

#### Audit Trail
Toutes les actions sont enregistrées de manière permanente pour :
- Conformité réglementaire
- Résolution de conflits
- Analyse des performances
- Sécurité des données

## Exemples d'Utilisation

### Scénario 1 : Validation Standard
1. Admin consulte les demandes en attente
2. Vérifie les documents du Dr. Dupont
3. Valide la demande
4. Système génère un mot de passe
5. Email envoyé automatiquement
6. Action enregistrée dans l'historique

### Scénario 2 : Rejet avec Motif
1. Admin examine la demande du Dr. Martin
2. Constate que le diplôme est illisible
3. Rejette avec motif : "Diplôme non lisible, merci de fournir une copie de meilleure qualité"
4. Email de rejet envoyé
5. Historique mis à jour

### Scénario 3 : Recherche et Suivi
1. Admin recherche tous les cardiologues validés
2. Consulte l'historique d'un médecin spécifique
3. Vérifie qui a validé et quand
4. Analyse les tendances de validation

## Maintenance et Support

### Logs et Debugging
- Tous les logs sont dans la console serveur
- Erreurs tracées avec stack traces
- Monitoring des performances des requêtes

### Backup et Récupération
- Sauvegarder régulièrement la table `historique_validations`
- Conserver les logs d'audit
- Tester les procédures de récupération

## Conclusion

Ce système de suivi offre une traçabilité complète et une gestion efficace des demandes d'administration. Il respecte les bonnes pratiques de sécurité et fournit tous les outils nécessaires pour un suivi professionnel des validations de médecins.