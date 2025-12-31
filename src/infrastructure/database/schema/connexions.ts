import { mysqlTable, varchar, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { patients } from "./patients";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

/**
 * Table des connexions
 * Gère les demandes de connexion et les permissions d'accès entre patients et médecins
 */
export const connexions = mysqlTable("connexions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idPatient: varchar("id_patient", { length: 255 })
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  statut: mysqlEnum("statut", ["En_attente", "Accepté", "Revoqué"]).default("En_attente").notNull(),
  niveauAcces: mysqlEnum("niveau_acces", ["Complet", "Partiel", "Lecture_Seule"]),
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

