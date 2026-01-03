import { pgTable, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

export const connexionsStatutEnum = pgEnum("connexions_statut", ["En_attente", "Accepté", "Revoqué"]);
export const niveauAccesTypeEnum = pgEnum("niveau_acces_type", ["Complet", "Partiel", "Lecture_Seule"]);

/**
 * Table des connexions
 * Gère les demandes de connexion et les permissions d'accès entre patients et médecins
 */
export const connexions = pgTable("connexions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  statut: connexionsStatutEnum("statut").default("En_attente").notNull(),
  niveauAcces: niveauAccesTypeEnum("niveau_acces"),
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
  dateAcceptation: timestamp("date_acceptation"),
});


/**
 * Relations pour la table connexions
 */
export const connexionsRelations = relations(connexions, ({ one }) => ({
  patient: one(patients, {
    fields: [connexions.idPatient],
    references: [patients.id],
  }),
  medecin: one(medecins, {
    fields: [connexions.idMedecin],
    references: [medecins.id],
  }),
}));

