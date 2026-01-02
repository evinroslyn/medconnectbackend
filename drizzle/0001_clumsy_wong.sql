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
--> statement-breakpoint
ALTER TABLE `medecins` ADD `date_validation` timestamp;--> statement-breakpoint
ALTER TABLE `medecins` ADD `motif_rejet` text;--> statement-breakpoint
ALTER TABLE `medecins` ADD `admin_validateur_id` varchar(255);--> statement-breakpoint
ALTER TABLE `medecins` ADD `historique_actions` text;--> statement-breakpoint
ALTER TABLE `medecins` ADD CONSTRAINT `medecins_admin_validateur_id_utilisateurs_id_fk` FOREIGN KEY (`admin_validateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historique_validations` ADD CONSTRAINT `historique_validations_medecin_id_medecins_id_fk` FOREIGN KEY (`medecin_id`) REFERENCES `medecins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historique_validations` ADD CONSTRAINT `historique_validations_admin_id_utilisateurs_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;