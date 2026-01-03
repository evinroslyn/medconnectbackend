import { pgTable, varchar, date, pgEnum } from "drizzle-orm/pg-core";
import { utilisateurs } from "./utilisateurs";
import { relations } from "drizzle-orm";

export const genreTypeEnum = pgEnum("genre_type", ["Homme", "Femme", "Autre"]);

/**
 * Table des patients
 * Étend les informations de l'utilisateur avec des données spécifiques aux patients
 */
export const patients = pgTable("patients", {
  id: varchar("id", { length: 255 }).primaryKey().references(() => utilisateurs.id, {
    onDelete: "cascade",
  }),
  nom: varchar("nom", { length: 255 }).notNull(),
  dateNaissance: date("date_naissance").notNull(),
  genre: genreTypeEnum("genre").notNull(),
  photoProfil: varchar("photo_profil", { length: 500 }), // Chemin vers la photo de profil
});


/**
 * Relations pour la table patients
 */
export const patientsRelations = relations(patients, ({ one }) => ({
  utilisateur: one(utilisateurs, {
    fields: [patients.id],
    references: [utilisateurs.id],
  }),
}));

