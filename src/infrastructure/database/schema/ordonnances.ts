import { mysqlTable, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { dossiersMedicaux } from "./dossiersMedicaux";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

/**
 * Table des ordonnances
 * Stocke les prescriptions médicales
 */
export const ordonnances = mysqlTable("ordonnances", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idDossierMedical: varchar("id_dossier_medical", { length: 255 }).references(
    () => dossiersMedicaux.id,
    { onDelete: "cascade" }
  ),
  idMedecin: varchar("id_medecin", { length: 255 }).references(() => medecins.id, {
    onDelete: "set null",
  }),
  medicament: varchar("medicament", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 255 }).notNull(),
  duree: varchar("duree", { length: 255 }).notNull(),
  dateEmission: timestamp("date_emission").defaultNow().notNull(),
});

/**
 * Relations pour la table ordonnances
 */
export const ordonnancesRelations = relations(ordonnances, ({ one }) => ({
  dossierMedical: one(dossiersMedicaux, {
    fields: [ordonnances.idDossierMedical],
    references: [dossiersMedicaux.id],
  }),
  medecin: one(medecins, {
    fields: [ordonnances.idMedecin],
    references: [medecins.id],
  }),
}));

