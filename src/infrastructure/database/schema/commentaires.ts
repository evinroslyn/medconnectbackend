import { mysqlTable, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { dossiersMedicaux } from "./dossiersMedicaux";
import { documentsMedicaux } from "./documentsMedicaux";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

/**
 * Table des commentaires
 * Stocke les commentaires des médecins sur les dossiers médicaux ou les documents médicaux
 * Un commentaire peut être associé soit à un dossier médical, soit à un document médical spécifique
 */
export const commentaires = mysqlTable("commentaires", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idDossierMedical: varchar("id_dossier_medical", { length: 255 })
    .notNull()
    .references(() => dossiersMedicaux.id, { onDelete: "cascade" }),
  idDocumentMedical: varchar("id_document_medical", { length: 255 })
    .references(() => documentsMedicaux.id, { onDelete: "cascade" }), // Optionnel : pour les notes sur documents
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  contenu: text("contenu").notNull(),
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
});

/**
 * Relations pour la table commentaires
 */
export const commentairesRelations = relations(commentaires, ({ one }) => ({
  dossierMedical: one(dossiersMedicaux, {
    fields: [commentaires.idDossierMedical],
    references: [dossiersMedicaux.id],
  }),
  documentMedical: one(documentsMedicaux, {
    fields: [commentaires.idDocumentMedical],
    references: [documentsMedicaux.id],
  }),
  medecin: one(medecins, {
    fields: [commentaires.idMedecin],
    references: [medecins.id],
  }),
}));

