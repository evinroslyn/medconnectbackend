import { pgTable, varchar, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { relations } from "drizzle-orm";

export const dossierTypeEnum = pgEnum("dossier_type", [
  "Resultat_Labo",
  "Radio",
  "Ordonnance",
  "Notes",
  "Diagnostic",
  "Imagerie",
  "examen"
]);

/**
 * Table des dossiers médicaux
 * Stocke les informations sur les dossiers médicaux des patients
 */
export const dossiersMedicaux = pgTable("dossiers_medicaux", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  titre: varchar("titre", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  // Le type est maintenant optionnel car un dossier peut contenir différents types de documents
  type: dossierTypeEnum("type"),
  // cheminFichier supprimé - les fichiers sont dans DocumentMedical
  version: integer("version").default(1).notNull(),
  dernierModification: timestamp("dernier_modification").defaultNow().notNull(),
});


/**
 * Relations pour la table dossiersMedicaux
 */
export const dossiersMedicauxRelations = relations(dossiersMedicaux, ({ one }) => ({
  patient: one(patients, {
    fields: [dossiersMedicaux.idPatient],
    references: [patients.id],
  }),
}));

