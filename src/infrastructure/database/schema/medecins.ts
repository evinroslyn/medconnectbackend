import { pgTable, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { utilisateurs } from "./utilisateurs";
import { relations } from "drizzle-orm";

/**
 * Table des médecins
 * Étend les informations de l'utilisateur avec des données spécifiques aux médecins
 */
export const medecins = pgTable("medecins", {
  id: varchar("id", { length: 255 }).primaryKey().references(() => utilisateurs.id, {
    onDelete: "cascade",
  }),
  nom: varchar("nom", { length: 255 }).notNull(),
  specialite: varchar("specialite", { length: 255 }).notNull(),
  numeroLicence: varchar("numero_licence", { length: 255 }).notNull().unique(),
  statutVerification: varchar("statut_verification", { length: 50 })
    .default("en_attente")
    .notNull(), // en_attente, valide, rejete
  documentIdentite: varchar("document_identite", { length: 500 }), // Chemin vers le document CNI/Passeport
  diplome: varchar("diplome", { length: 500 }), // Chemin vers le diplôme
  photoProfil: varchar("photo_profil", { length: 500 }), // Chemin vers la photo de profil
  anneesExperience: varchar("annees_experience", { length: 10 }), // Nombre d'années d'expérience
  description: text("description"), // Description personnelle du médecin
  education: text("education"), // Éducation et formations du médecin
  specialisations: text("specialisations"), // Spécialisations médicales
  // Champs pour le suivi des demandes
  dateValidation: timestamp("date_validation"), // Date de validation/rejet
  motifRejet: text("motif_rejet"), // Motif détaillé du rejet
  adminValidateurId: varchar("admin_validateur_id", { length: 255 }).references(() => utilisateurs.id), // ID de l'admin qui a traité la demande
  historiqueActions: text("historique_actions"), // JSON des actions effectuées
});


/**
 * Relations pour la table medecins
 */
export const medecinsRelations = relations(medecins, ({ one }) => ({
  utilisateur: one(utilisateurs, {
    fields: [medecins.id],
    references: [utilisateurs.id],
  }),
}));

