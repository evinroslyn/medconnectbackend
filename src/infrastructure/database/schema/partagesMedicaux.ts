import { mysqlTable, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
import { medecins } from "./medecins";
import { patients } from "./patients";
import { dossiersMedicaux } from "./dossiersMedicaux";
import { documentsMedicaux } from "./documentsMedicaux";
import { relations } from "drizzle-orm";

/**
 * Table des partages médicaux
 * Stocke les permissions de partage de dossiers ou documents médicaux avec des médecins
 */
export const partagesMedicaux = mysqlTable("partages_medicaux", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  // Type de ressource partagée : 'dossier' ou 'document'
  typeRessource: mysqlEnum("type_ressource", ["dossier", "document"]).notNull(),
  // ID de la ressource partagée (dossier ou document)
  idRessource: varchar("id_ressource", { length: 255 }).notNull(),
  // Permissions : peut télécharger, peut faire des captures d'écran
  peutTelecharger: boolean("peut_telecharger").default(false).notNull(),
  peutScreenshot: boolean("peut_screenshot").default(false).notNull(),
  // Date de création et expiration du partage
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
  dateExpiration: timestamp("date_expiration"), // Optionnel, null = pas d'expiration
  // Statut du partage
  statut: mysqlEnum("statut", ["actif", "revoke", "expire"]).default("actif").notNull(),
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

