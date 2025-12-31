import { mysqlTable, varchar, text, timestamp, date } from "drizzle-orm/mysql-core";
import { patients } from "./patients";
import { relations } from "drizzle-orm";

/**
 * Table des traitements
 * Stocke les traitements médicaux des patients
 */
export const traitements = mysqlTable("traitements", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  nom: varchar("nom", { length: 255 }).notNull(),
  description: text("description"),
  dateDebut: date("date_debut").notNull(),
  dateFin: date("date_fin"),
  posologie: text("posologie"), // Ex: "1 comprimé matin et soir"
  medecinPrescripteur: varchar("medecin_prescripteur", { length: 255 }), // Nom du médecin qui a prescrit
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
});

/**
 * Relations pour la table traitements
 */
export const traitementsRelations = relations(traitements, ({ one }) => ({
  patient: one(patients, {
    fields: [traitements.idPatient],
    references: [patients.id],
  }),
}));

