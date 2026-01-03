import { pgTable, varchar, timestamp, text, pgEnum } from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum("user_type", ["patient", "medecin", "administrateur"]);

/**
 * Table des utilisateurs (classe de base)
 * Stocke les informations communes à tous les types d'utilisateurs
 */
export const utilisateurs = pgTable("utilisateurs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  mail: varchar("mail", { length: 255 }).notNull().unique(),
  motDePasse: varchar("mot_de_passe", { length: 255 }).notNull(),
  secretDeuxFacteur: varchar("secret_deux_facteur", { length: 255 }),
  codeSMS: varchar("code_sms", { length: 4 }),
  codeSMSExpiration: timestamp("code_sms_expiration"),
  dateCreation: timestamp("date_creation").defaultNow().notNull(),
  derniereConnexion: timestamp("derniere_connexion"),
  adresse: text("adresse"),
  telephone: varchar("telephone", { length: 20 }),
  typeUtilisateur: userTypeEnum("type_utilisateur").notNull(),
  codeResetPassword: varchar("code_reset_password", { length: 10 }),
  codeResetPasswordExpires: timestamp("code_reset_password_expires"),
});


