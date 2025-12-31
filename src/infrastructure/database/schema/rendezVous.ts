import { mysqlTable, varchar, timestamp, int, text, mysqlEnum } from "drizzle-orm/mysql-core";
import { patients } from "./patients";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

/**
 * Énumération pour le statut de rendez-vous
 */
/**
 * Table des rendez-vous
 * Gère les rendez-vous et téléconsultations
 */
export const rendezVous = mysqlTable("rendez_vous", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  type: mysqlEnum("type", ["Téléconsultation", "Présentiel"]).notNull(),
  statut: mysqlEnum("statut", ["Planifié", "Terminé", "Annulé"]).default("Planifié").notNull(),
  notes: text("notes"),
  duree: int("duree"), // Durée en minutes
});

/**
 * Relations pour la table rendezVous
 */
export const rendezVousRelations = relations(rendezVous, ({ one }) => ({
  patient: one(patients, {
    fields: [rendezVous.idPatient],
    references: [patients.id],
  }),
  medecin: one(medecins, {
    fields: [rendezVous.idMedecin],
    references: [medecins.id],
  }),
}));

