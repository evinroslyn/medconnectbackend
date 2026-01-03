import { pgTable, varchar, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { medecins } from "./medecins";
import { patients } from "./patients";
import { relations } from "drizzle-orm";

export const partageTypeEnum = pgEnum("partage_type", ["dossier", "document"]);

/**
 * Table des partages médicaux
 * Stocke les permissions de partage de dossiers ou documents médicaux avec des médecins
 */
export const partagesMedicaux = pgTable("partages_medicaux", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  // Type de ressource partagée : 'dossier' ou 'document'
  typeRessource: partageTypeEnum("type_ressource").notNull(),
  // ID de la ressource partagée (dossier ou document)
  idRessource: varchar("id_ressource", { length: 255 }).notNull(),
  // Permissions : peut télécharger, peut faire des captures d'écran
  peutTelecharger: boolean("peut_telecharger").default(false).notNull(),
  peutScreenshot: boolean("peut_screenshot").default(false).notNull(),
  // Date de création et expiration du partage
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
  dateExpiration: timestamp("date_expiration"), // Optionnel, null = pas d'expiration
  // Statut du partage
  statut: varchar("statut", { length: 50 }).default("actif").notNull(),
});


/**
 * Relations pour la table partagesMedicaux
 */
export const partagesMedicauxRelations = relations(partagesMedicaux, ({ one }) => ({
  patient: one(patients, {
    fields: [partagesMedicaux.idPatient],
    references: [patients.id],
  }),
  medecin: one(medecins, {
    fields: [partagesMedicaux.idMedecin],
    references: [medecins.id],
  }),
}));

