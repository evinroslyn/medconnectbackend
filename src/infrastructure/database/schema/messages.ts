import { mysqlTable, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core";
import { utilisateurs } from "./utilisateurs";
import { relations } from "drizzle-orm";

/**
 * Table des messages
 * Stocke les messages sécurisés entre utilisateurs
 */
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  idExpediteur: varchar("id_expediteur", { length: 255 })
    .notNull()
    .references(() => utilisateurs.id, { onDelete: "cascade" }),
  idDestinataire: varchar("id_destinataire", { length: 255 })
    .notNull()
    .references(() => utilisateurs.id, { onDelete: "cascade" }),
  contenu: text("contenu").notNull(), // Contenu chiffré
  dateEnvoi: timestamp("date_envoi").defaultNow().notNull(),
  confirmationDeLecture: boolean("lu").default(false).notNull(),
});

/**
 * Relations pour la table messages
 */
export const messagesRelations = relations(messages, ({ one }) => ({
  expediteur: one(utilisateurs, {
    fields: [messages.idExpediteur],
    references: [utilisateurs.id],
  }),
  destinataire: one(utilisateurs, {
    fields: [messages.idDestinataire],
    references: [utilisateurs.id],
  }),
}));

