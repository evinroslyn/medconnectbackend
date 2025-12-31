import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Configuration de Drizzle ORM pour la génération des migrations
 * et la gestion du schéma de base de données MySQL
 */
export default {
  schema: "./src/infrastructure/database/schema/index.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "meedconnect",
  },
} satisfies Config;

