import { mysqlTable, varchar, timestamp, time, mysqlEnum, boolean, text } from "drizzle-orm/mysql-core";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

/**
 * Table des disponibilités des médecins
 * Gère les créneaux horaires disponibles pour les rendez-vous
 */
export const disponibilites = mysqlTable("disponibilites", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idMedecin: varchar("id_medecin", { length: 255 })
    .notNull()
    .references(() => medecins.id, { onDelete: "cascade" }),
  jour: timestamp("jour").notNull(), // Date du jour de disponibilité
  heureDebut: time("heure_debut").notNull(), // Heure de début (format HH:mm:ss)
  heureFin: time("heure_fin").notNull(), // Heure de fin (format HH:mm:ss)
  lieu: varchar("lieu", { length: 255 }), // Lieu de consultation
  centreMedical: varchar("centre_medical", { length: 255 }), // Centre médical
  typeConsultation: mysqlEnum("type_consultation", ["Téléconsultation", "Présentiel"]).notNull(),
  actif: boolean("actif").default(true).notNull(), // Disponibilité active ou non
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
});

/**
 * Relations pour la table disponibilites
 */
export const disponibilitesRelations = relations(disponibilites, ({ one }) => ({
  medecin: one(medecins, {
    fields: [disponibilites.idMedecin],
    references: [medecins.id],
  }),
}));
