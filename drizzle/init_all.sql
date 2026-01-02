-- Combined schema for Med-Connect (generated from drizzle SQL files)
-- Import this file in phpMyAdmin (select your database then Import)

SET FOREIGN_KEY_CHECKS = 0;

-- From 0000_damp_johnny_storm.sql
CREATE TABLE `utilisateurs` (
	`id` varchar(255) NOT NULL,
	`mail` varchar(255) NOT NULL,
	`mot_de_passe` varchar(255) NOT NULL,
	`secret_deux_facteur` varchar(255),
	`code_sms` varchar(4),
	`code_sms_expiration` timestamp,
	`date_creation` timestamp NOT NULL DEFAULT (now()),
	`derniere_connexion` timestamp,
	`adresse` text,
	`telephone` varchar(20),
	`type_utilisateur` enum('patient','medecin','administrateur') NOT NULL,
	`code_reset_password` varchar(10),
	`code_reset_password_expires` timestamp,
	CONSTRAINT `utilisateurs_id` PRIMARY KEY(`id`),
	CONSTRAINT `utilisateurs_mail_unique` UNIQUE(`mail`)
);

CREATE TABLE `patients` (
	`id` varchar(255) NOT NULL,
	`nom` varchar(255) NOT NULL,
	`date_naissance` date NOT NULL,
	`genre` enum('Homme','Femme','Autre') NOT NULL,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);

CREATE TABLE `medecins` (
	`id` varchar(255) NOT NULL,
	`nom` varchar(255) NOT NULL,
	`specialite` varchar(255) NOT NULL,
	`numero_licence` varchar(255) NOT NULL,
	`statut_verification` varchar(50) NOT NULL DEFAULT 'en_attente',
	`document_identite` varchar(500),
	`diplome` varchar(500),
	`photo_profil` varchar(500),
	CONSTRAINT `medecins_id` PRIMARY KEY(`id`),
	CONSTRAINT `medecins_numero_licence_unique` UNIQUE(`numero_licence`)
);

CREATE TABLE `administrateurs` (
	`id` varchar(255) NOT NULL,
	`nom` varchar(255) NOT NULL,
	CONSTRAINT `administrateurs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `dossiers_medicaux` (
	`id` varchar(255) NOT NULL,
	`id_patient` varchar(255) NOT NULL,
	`titre` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`description` text,
	`type` enum('Resultat_Labo','Radio','Ordonnance','Notes','Diagnostic','Imagerie','examen'),
	`version` int NOT NULL DEFAULT 1,
	`dernier_modification` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dossiers_medicaux_id` PRIMARY KEY(`id`)
);

CREATE TABLE `ordonnances` (
	`id` varchar(255) NOT NULL,
	`id_dossier_medical` varchar(255),
	`id_medecin` varchar(255),
	`medicament` varchar(255) NOT NULL,
	`dosage` varchar(255) NOT NULL,
	`duree` varchar(255) NOT NULL,
	`date_emission` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ordonnances_id` PRIMARY KEY(`id`)
);

CREATE TABLE `documents_medicaux` (
	`id` varchar(255) NOT NULL,
	`id_dossier_medical` varchar(255) NOT NULL,
	`id_patient` varchar(255) NOT NULL,
	`nom` varchar(255) NOT NULL,
	`type` enum('Resultat_Labo','Radio','Ordonnance','Notes','Diagnostic','Imagerie','examen') NOT NULL,
	`chemin_fichier` text,
	`date_creation` timestamp NOT NULL DEFAULT (now()),
	`description` text,
	CONSTRAINT `documents_medicaux_id` PRIMARY KEY(`id`)
);

CREATE TABLE `allergies` (
	`id` varchar(255) NOT NULL,
	`id_dossier_medical` varchar(255),
	`id_patient` varchar(255) NOT NULL,
	`nom` varchar(255) NOT NULL,
	`description` text,
	`date_decouverte` timestamp,
	CONSTRAINT `allergies_id` PRIMARY KEY(`id`)
);

CREATE TABLE `commentaires` (
	`id` varchar(255) NOT NULL,
	`id_dossier_medical` varchar(255) NOT NULL,
	`id_medecin` varchar(255) NOT NULL,
	`contenu` text NOT NULL,
	`date_creation` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentaires_id` PRIMARY KEY(`id`)
);

CREATE TABLE `connexions` (
	`id` varchar(255) NOT NULL,
	`id_patient` varchar(255) NOT NULL,
	`id_medecin` varchar(255) NOT NULL,
	`statut` enum('En_attente','Accepté','Revoqué') NOT NULL DEFAULT 'En_attente',
	`niveau_acces` enum('Complet','Partiel','Lecture_Seule'),
	`date_creation` timestamp NOT NULL DEFAULT (now()),
	`date_acceptation` timestamp,
	CONSTRAINT `connexions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `rendez_vous` (
	`id` varchar(255) NOT NULL,
	`id_patient` varchar(255) NOT NULL,
	`id_medecin` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`type` enum('Téléconsultation','Présentiel') NOT NULL,
	`statut` enum('Planifié','Terminé','Annulé') NOT NULL DEFAULT 'Planifié',
	`notes` text,
	`duree` int,
	CONSTRAINT `rendez_vous_id` PRIMARY KEY(`id`)
);

CREATE TABLE `disponibilites` (
	`id` varchar(255) NOT NULL,
	`id_medecin` varchar(255) NOT NULL,
	`jour` timestamp NOT NULL,
	`heure_debut` time NOT NULL,
	`heure_fin` time NOT NULL,
	`lieu` varchar(255),
	`centre_medical` varchar(255),
	`type_consultation` enum('Téléconsultation','Présentiel') NOT NULL,
	`actif` boolean NOT NULL DEFAULT true,
	`date_creation` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disponibilites_id` PRIMARY KEY(`id`)
);

CREATE TABLE `messages` (
	`id` varchar(255) NOT NULL,
	`id_expediteur` varchar(255) NOT NULL,
	`id_destinataire` varchar(255) NOT NULL,
	`contenu` text NOT NULL,
	`date_envoi` timestamp NOT NULL DEFAULT (now()),
	`lu` boolean NOT NULL DEFAULT false,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);

CREATE TABLE `partages_medicaux` (
	`id` varchar(255) NOT NULL,
	`id_patient` varchar(255) NOT NULL,
	`id_medecin` varchar(255) NOT NULL,
	`type_ressource` enum('dossier','document') NOT NULL,
	`id_ressource` varchar(255) NOT NULL,
	`peut_telecharger` boolean NOT NULL DEFAULT false,
	`peut_screenshot` boolean NOT NULL DEFAULT false,
	`date_creation` timestamp NOT NULL DEFAULT (now()),
	`date_expiration` timestamp,
	`statut` enum('actif','revoke','expire') NOT NULL DEFAULT 'actif',
	CONSTRAINT `partages_medicaux_id` PRIMARY KEY(`id`)
);

ALTER TABLE `patients` ADD CONSTRAINT `patients_id_utilisateurs_id_fk` FOREIGN KEY (`id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `medecins` ADD CONSTRAINT `medecins_id_utilisateurs_id_fk` FOREIGN KEY (`id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `administrateurs` ADD CONSTRAINT `administrateurs_id_utilisateurs_id_fk` FOREIGN KEY (`id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `dossiers_medicaux` ADD CONSTRAINT `dossiers_medicaux_id_patient_patients_id_fk` FOREIGN KEY (`id_patient`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `ordonnances` ADD CONSTRAINT `ordonnances_id_dossier_medical_dossiers_medicaux_id_fk` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossiers_medicaux`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `ordonnances` ADD CONSTRAINT `ordonnances_id_medecin_medecins_id_fk` FOREIGN KEY (`id_medecin`) REFERENCES `medecins`(`id`) ON DELETE set null ON UPDATE no action;
ALTER TABLE `documents_medicaux` ADD CONSTRAINT `documents_medicaux_id_dossier_medical_dossiers_medicaux_id_fk` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossiers_medicaux`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `documents_medicaux` ADD CONSTRAINT `documents_medicaux_id_patient_patients_id_fk` FOREIGN KEY (`id_patient`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `allergies` ADD CONSTRAINT `allergies_id_dossier_medical_dossiers_medicaux_id_fk` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossiers_medicaux`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `allergies` ADD CONSTRAINT `allergies_id_patient_patients_id_fk` FOREIGN KEY (`id_patient`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `commentaires` ADD CONSTRAINT `commentaires_id_dossier_medical_dossiers_medicaux_id_fk` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossiers_medicaux`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `commentaires` ADD CONSTRAINT `commentaires_id_medecin_medecins_id_fk` FOREIGN KEY (`id_medecin`) REFERENCES `medecins`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `connexions` ADD CONSTRAINT `connexions_id_patient_patients_id_fk` FOREIGN KEY (`id_patient`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `connexions` ADD CONSTRAINT `connexions_id_medecin_medecins_id_fk` FOREIGN KEY (`id_medecin`) REFERENCES `medecins`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `rendez_vous` ADD CONSTRAINT `rendez_vous_id_patient_patients_id_fk` FOREIGN KEY (`id_patient`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `rendez_vous` ADD CONSTRAINT `rendez_vous_id_medecin_medecins_id_fk` FOREIGN KEY (`id_medecin`) REFERENCES `medecins`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `disponibilites` ADD CONSTRAINT `disponibilites_id_medecin_medecins_id_fk` FOREIGN KEY (`id_medecin`) REFERENCES `medecins`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `messages` ADD CONSTRAINT `messages_id_expediteur_utilisateurs_id_fk` FOREIGN KEY (`id_expediteur`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `messages` ADD CONSTRAINT `messages_id_destinataire_utilisateurs_id_fk` FOREIGN KEY (`id_destinataire`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `partages_medicaux` ADD CONSTRAINT `partages_medicaux_id_patient_patients_id_fk` FOREIGN KEY (`id_patient`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `partages_medicaux` ADD CONSTRAINT `partages_medicaux_id_medecin_medecins_id_fk` FOREIGN KEY (`id_medecin`) REFERENCES `medecins`(`id`) ON DELETE cascade ON UPDATE no action;

-- From 0001_clumsy_wong.sql
CREATE TABLE `historique_validations` (
	`id` varchar(255) NOT NULL,
	`medecin_id` varchar(255) NOT NULL,
	`admin_id` varchar(255) NOT NULL,
	`action` enum('validation','rejet','mise_en_attente') NOT NULL,
	`statut_avant` varchar(50) NOT NULL,
	`statut_apres` varchar(50) NOT NULL,
	`motif` text,
	`date_action` timestamp NOT NULL DEFAULT (now()),
	`commentaire_admin` text,
	`adresse_ip` varchar(45),
	CONSTRAINT `historique_validations_id` PRIMARY KEY(`id`)
);

ALTER TABLE `medecins` ADD `date_validation` timestamp;
ALTER TABLE `medecins` ADD `motif_rejet` text;
ALTER TABLE `medecins` ADD `admin_validateur_id` varchar(255);
ALTER TABLE `medecins` ADD `historique_actions` text;
ALTER TABLE `medecins` ADD CONSTRAINT `medecins_admin_validateur_id_utilisateurs_id_fk` FOREIGN KEY (`admin_validateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `historique_validations` ADD CONSTRAINT `historique_validations_medecin_id_medecins_id_fk` FOREIGN KEY (`medecin_id`) REFERENCES `medecins`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `historique_validations` ADD CONSTRAINT `historique_validations_admin_id_utilisateurs_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;

SET FOREIGN_KEY_CHECKS = 1;
