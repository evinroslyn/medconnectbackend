-- Migration pour ajouter les champs de suivi des demandes
-- À exécuter sur la base de données MySQL

-- Ajouter les nouveaux champs à la table medecins
ALTER TABLE medecins 
ADD COLUMN date_validation TIMESTAMP NULL,
ADD COLUMN motif_rejet TEXT NULL,
ADD COLUMN admin_validateur_id VARCHAR(255) NULL,
ADD COLUMN historique_actions TEXT NULL,
ADD FOREIGN KEY (admin_validateur_id) REFERENCES utilisateurs(id);

-- Créer la table historique_validations
CREATE TABLE historique_validations (
    id VARCHAR(255) PRIMARY KEY,
    medecin_id VARCHAR(255) NOT NULL,
    admin_id VARCHAR(255) NOT NULL,
    action ENUM('validation', 'rejet', 'mise_en_attente') NOT NULL,
    statut_avant VARCHAR(50) NOT NULL,
    statut_apres VARCHAR(50) NOT NULL,
    motif TEXT NULL,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    commentaire_admin TEXT NULL,
    adresse_ip VARCHAR(45) NULL,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_medecin_id (medecin_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_date_action (date_action)
);

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_medecins_statut_verification ON medecins(statut_verification);
CREATE INDEX idx_medecins_date_validation ON medecins(date_validation);
CREATE INDEX idx_medecins_admin_validateur ON medecins(admin_validateur_id);