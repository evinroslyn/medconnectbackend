-- Init SQL for Postgres — Med-Connect
-- Create enum types if not exists, then create tables

-- User types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE user_type AS ENUM ('patient','medecin','administrateur');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genre_type') THEN
    CREATE TYPE genre_type AS ENUM ('Homme','Femme','Autre');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dossier_type') THEN
    CREATE TYPE dossier_type AS ENUM ('Resultat_Labo','Radio','Ordonnance','Notes','Diagnostic','Imagerie','examen');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connexions_statut') THEN
    CREATE TYPE connexions_statut AS ENUM ('En_attente','Accepté','Revoqué');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'niveau_acces_type') THEN
    CREATE TYPE niveau_acces_type AS ENUM ('Complet','Partiel','Lecture_Seule');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rv_type') THEN
    CREATE TYPE rv_type AS ENUM ('Téléconsultation','Présentiel');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rv_statut') THEN
    CREATE TYPE rv_statut AS ENUM ('Planifié','Terminé','Annulé');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partage_type') THEN
    CREATE TYPE partage_type AS ENUM ('dossier','document');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'historique_action') THEN
    CREATE TYPE historique_action AS ENUM ('validation','rejet','mise_en_attente');
  END IF;
END $$;

BEGIN;

CREATE TABLE IF NOT EXISTS utilisateurs (
  id VARCHAR(255) PRIMARY KEY,
  mail VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  secret_deux_facteur VARCHAR(255),
  code_sms VARCHAR(4),
  code_sms_expiration TIMESTAMP NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  derniere_connexion TIMESTAMP NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  type_utilisateur user_type NOT NULL,
  code_reset_password VARCHAR(10),
  code_reset_password_expires TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(255) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  date_naissance DATE NOT NULL,
  genre genre_type NOT NULL,
  photo_profil VARCHAR(500) NULL,
  CONSTRAINT patients_id_utilisateurs_fk FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medecins (
  id VARCHAR(255) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  specialite VARCHAR(255) NOT NULL,
  numero_licence VARCHAR(255) NOT NULL UNIQUE,
  statut_verification VARCHAR(50) DEFAULT 'en_attente' NOT NULL,
  document_identite VARCHAR(500),
  diplome VARCHAR(500),
  photo_profil VARCHAR(500),
  date_validation TIMESTAMP NULL,
  motif_rejet TEXT NULL,
  admin_validateur_id VARCHAR(255) NULL,
  historique_actions TEXT NULL,
  CONSTRAINT medecins_admin_validateur_fk FOREIGN KEY (admin_validateur_id) REFERENCES utilisateurs(id) ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS administrateurs (
  id VARCHAR(255) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  CONSTRAINT administrateurs_id_utilisateurs_fk FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dossiers_medicaux (
  id VARCHAR(255) PRIMARY KEY,
  id_patient VARCHAR(255) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  date TIMESTAMP NOT NULL,
  description TEXT,
  type dossier_type,
  version INT DEFAULT 1 NOT NULL,
  dernier_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT dossiers_medicaux_id_patient_fk FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ordonnances (
  id VARCHAR(255) PRIMARY KEY,
  id_dossier_medical VARCHAR(255),
  id_medecin VARCHAR(255),
  medicament VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) NOT NULL,
  duree VARCHAR(255) NOT NULL,
  date_emission TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT ordonnances_id_medecin_fk FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE SET NULL,
  CONSTRAINT ordonnances_id_dossier_fk FOREIGN KEY (id_dossier_medical) REFERENCES dossiers_medicaux(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents_medicaux (
  id VARCHAR(255) PRIMARY KEY,
  id_dossier_medical VARCHAR(255) NOT NULL,
  id_patient VARCHAR(255) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  type dossier_type NOT NULL,
  chemin_fichier TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  description TEXT,
  CONSTRAINT documents_medicaux_id_dossier_fk FOREIGN KEY (id_dossier_medical) REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
  CONSTRAINT documents_medicaux_id_patient_fk FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS allergies (
  id VARCHAR(255) PRIMARY KEY,
  id_dossier_medical VARCHAR(255),
  id_patient VARCHAR(255) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  date_decouverte TIMESTAMP,
  CONSTRAINT allergies_id_patient_fk FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT allergies_id_dossier_fk FOREIGN KEY (id_dossier_medical) REFERENCES dossiers_medicaux(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commentaires (
  id VARCHAR(255) PRIMARY KEY,
  id_dossier_medical VARCHAR(255) NOT NULL,
  id_medecin VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  id_document_medical VARCHAR(255) NULL,
  CONSTRAINT commentaires_id_dossier_fk FOREIGN KEY (id_dossier_medical) REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
  CONSTRAINT commentaires_id_medecin_fk FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE,
  CONSTRAINT commentaires_id_document_medical_fk FOREIGN KEY (id_document_medical) REFERENCES documents_medicaux(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS connexions (
  id VARCHAR(255) PRIMARY KEY,
  id_patient VARCHAR(255) NOT NULL,
  id_medecin VARCHAR(255) NOT NULL,
  statut connexions_statut DEFAULT 'En_attente' NOT NULL,
  niveau_acces niveau_acces_type,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_acceptation TIMESTAMP NULL,
  CONSTRAINT connexions_patient_fk FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT connexions_medecin_fk FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rendez_vous (
  id VARCHAR(255) PRIMARY KEY,
  id_patient VARCHAR(255) NOT NULL,
  id_medecin VARCHAR(255) NOT NULL,
  date TIMESTAMP NOT NULL,
  type rv_type NOT NULL,
  statut rv_statut DEFAULT 'Planifié' NOT NULL,
  notes TEXT,
  duree INT,
  CONSTRAINT rendez_vous_patient_fk FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT rendez_vous_medecin_fk FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disponibilites (
  id VARCHAR(255) PRIMARY KEY,
  id_medecin VARCHAR(255) NOT NULL,
  jour TIMESTAMP NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  lieu VARCHAR(255),
  centre_medical VARCHAR(255),
  type_consultation rv_type NOT NULL,
  actif BOOLEAN DEFAULT TRUE NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT disponibilites_medecin_fk FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(255) PRIMARY KEY,
  id_expediteur VARCHAR(255) NOT NULL,
  id_destinataire VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  lu BOOLEAN DEFAULT FALSE NOT NULL,
  CONSTRAINT messages_expediteur_fk FOREIGN KEY (id_expediteur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT messages_destinataire_fk FOREIGN KEY (id_destinataire) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partages_medicaux (
  id VARCHAR(255) PRIMARY KEY,
  id_patient VARCHAR(255) NOT NULL,
  id_medecin VARCHAR(255) NOT NULL,
  type_ressource partage_type NOT NULL,
  id_ressource VARCHAR(255) NOT NULL,
  peut_telecharger BOOLEAN DEFAULT FALSE NOT NULL,
  peut_screenshot BOOLEAN DEFAULT FALSE NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_expiration TIMESTAMP NULL,
  statut VARCHAR(50) DEFAULT 'actif' NOT NULL,
  CONSTRAINT partages_patient_fk FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT partages_medecin_fk FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historique_validations (
  id VARCHAR(255) PRIMARY KEY,
  medecin_id VARCHAR(255) NOT NULL,
  admin_id VARCHAR(255) NOT NULL,
  action historique_action NOT NULL,
  statut_avant VARCHAR(50) NOT NULL,
  statut_apres VARCHAR(50) NOT NULL,
  motif TEXT,
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  commentaire_admin TEXT,
  adresse_ip VARCHAR(45),
  CONSTRAINT historique_medecin_fk FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE,
  CONSTRAINT historique_admin_fk FOREIGN KEY (admin_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

COMMIT;
