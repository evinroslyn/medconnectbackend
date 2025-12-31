import { mysqlTable, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { dossiersMedicaux } from "./dossiersMedicaux";
import { patients } from "./patients";
import { relations } from "drizzle-orm";

/**
 * Table des documents médicaux
 * Stocke les documents médicaux génériques (résultats de labo, radios, etc.)
 */
export const documentsMedicaux = mysqlTable("documents_medicaux", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idDossierMedical: varchar("id_dossier_medical", { length: 255 })
    .notNull()
    .references(() => dossiersMedicaux.id, { onDelete: "cascade" }),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  nom: varchar("nom", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "Resultat_Labo",
    "Radio", 
    "Ordonnance",
    "Notes",
    "Diagnostic",
    "Imagerie",
    "examen"
  ]).notNull(),
  cheminFichier: text("chemin_fichier"),
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
  description: text("description"), // Ajout d'une description pour le document
});

/**
 * Relations pour la table documentsMedicaux
 */
export const documentsMedicauxRelations = relations(documentsMedicaux, ({ one }) => ({
  dossierMedical: one(dossiersMedicaux, {
    fields: [documentsMedicaux.idDossierMedical],
    references: [dossiersMedicaux.id],
  }),
  patient: one(patients, {
    fields: [documentsMedicaux.idPatient],
    references: [patients.id],
  }),
}));

