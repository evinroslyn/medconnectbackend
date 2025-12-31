import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { utilisateurs } from "./utilisateurs";
import { relations } from "drizzle-orm";

/**
 * Table des administrateurs
 * Étend les informations de l'utilisateur avec des données spécifiques aux administrateurs
 */
export const administrateurs = mysqlTable("administrateurs", {
  id: varchar("id", { length: 255 }).primaryKey().references(() => utilisateurs.id, {
    onDelete: "cascade",
  }),
  nom: varchar("nom", { length: 255 }).notNull(),
});

/**
 * Relations pour la table administrateurs
 */
export const administrateursRelations = relations(administrateurs, ({ one }) => ({
  utilisateur: one(utilisateurs, {
    fields: [administrateurs.id],
    references: [utilisateurs.id],
  }),
}));

