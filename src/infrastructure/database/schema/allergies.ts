import { mysqlTable, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { dossiersMedicaux } from "./dossiersMedicaux";
import { patients } from "./patients";
import { relations } from "drizzle-orm";

/**
 * Table des allergies
 * Stocke les allergies des patients
 */
export const allergies = mysqlTable("allergies", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idDossierMedical: varchar("id_dossier_medical", { length: 255 }).references(
    () => dossiersMedicaux.id,
    { onDelete: "cascade" }
  ),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  nom: varchar("nom", { length: 255 }).notNull(),
  description: text("description"),
  dateDecouverte: timestamp("date_decouverte"),
});

/**
 * Relations pour la table allergies
 */
export const allergiesRelations = relations(allergies, ({ one }) => ({
  dossierMedical: one(dossiersMedicaux, {
    fields: [allergies.idDossierMedical],
    references: [dossiersMedicaux.id],
  }),
  patient: one(patients, {
    fields: [allergies.idPatient],
    references: [patients.id],
  }),
}));

