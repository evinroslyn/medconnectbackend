import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script de migration pour appliquer les migrations Drizzle à la base de données MySQL
 * Usage: npm run db:migrate
 */
async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "meedconnect",
    multipleStatements: true,
  });

  const db = drizzle(connection);

  console.log("🚀 Démarrage des migrations MySQL...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migrations terminées avec succès!");

  await connection.end();
}

main().catch((err) => {
  console.error("Erreur lors des migrations:", err);
  process.exit(1);
});

