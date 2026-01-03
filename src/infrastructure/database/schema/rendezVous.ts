import { pgTable, varchar, timestamp, integer, text, pgEnum } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

export const rvTypeEnum = pgEnum("rv_type", ["Téléconsultation", "Présentiel"]);
export const rvStatutEnum = pgEnum("rv_statut", ["Planifié", "Terminé", "Annulé"]);

/**
 * Table des rendez-vous
 * Gère les rendez-vous et téléconsultations
 */
export const rendezVous = pgTable("rendez_vous", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  type: rvTypeEnum("type").notNull(),
  statut: rvStatutEnum("statut").default("Planifié").notNull(),
  notes: text("notes"),
  duree: integer("duree"), // Durée en minutes
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

