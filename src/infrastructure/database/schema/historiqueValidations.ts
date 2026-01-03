import { pgTable, varchar, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { utilisateurs } from "./utilisateurs";
import { medecins } from "./medecins";
import { relations } from "drizzle-orm";

export const historiqueActionEnum = pgEnum("historique_action", ["validation", "rejet", "mise_en_attente"]);

/**
 * Table de l'historique des validations
 * Stocke toutes les actions effectuées par les administrateurs sur les demandes
 */
export const historiqueValidations = pgTable("historique_validations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  medecinId: varchar("medecin_id", { length: 255 }).notNull().references(() => medecins.id, {
    onDelete: "cascade",
  }),
  adminId: varchar("admin_id", { length: 255 }).notNull().references(() => utilisateurs.id, {
    onDelete: "cascade",
  }),
  action: historiqueActionEnum("action").notNull(),
  statutAvant: varchar("statut_avant", { length: 50 }).notNull(),
  statutApres: varchar("statut_apres", { length: 50 }).notNull(),
  motif: text("motif"), // Motif du rejet ou commentaire
  dateAction: timestamp("date_action").defaultNow().notNull(),
  commentaireAdmin: text("commentaire_admin"), // Commentaire interne de l'admin
  adresseIP: varchar("adresse_ip", { length: 45 }), // Pour la traçabilité
});


/**
 * Relations pour la table historiqueValidations
 */
export const historiqueValidationsRelations = relations(historiqueValidations, ({ one }) => ({
  medecin: one(medecins, {
    fields: [historiqueValidations.medecinId],
    references: [medecins.id],
  }),
  administrateur: one(utilisateurs, {
    fields: [historiqueValidations.adminId],
    references: [utilisateurs.id],
  }),
}));