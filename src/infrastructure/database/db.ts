import * as dotenv from "dotenv";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Postgres
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

dotenv.config();

// Vérifier que DATABASE_URL est défini
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL n'est pas défini dans les variables d'environnement");
}

// Configuration du pool PostgreSQL (IPv6 support)
const poolConfig: any = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // family: 0 (ou undefined) = Auto, 4 = IPv4, 6 = IPv6
  family: process.env.DB_IP_FAMILY ? parseInt(process.env.DB_IP_FAMILY) : undefined,
};

// Ajouter SSL si demandé dans la chaîne de connexion (important pour le pooler)
if (process.env.DATABASE_URL.includes("sslmode=require") || process.env.DATABASE_URL.includes("ssl=true")) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new PgPool(poolConfig);
const dbClient = pool;
const db = drizzlePg(pool, { schema });

console.log(`🔌 Connexion à Supabase PostgreSQL (${process.env.DB_IP_FAMILY === '6' ? 'IPv6' : (process.env.DB_IP_FAMILY === '4' ? 'IPv4' : 'Auto')})`);

export { db };

/**
 * Fonction pour tester la connexion à la base de données
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await dbClient.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Connexion Supabase établie avec succès");
  } catch (error) {
    console.error("❌ Erreur de connexion à Supabase:", error);
    throw error;
  }
}

/**
 * Fonction pour tester la connexion à la base de données (IPv4 forced)
 * Cette fonction crée un pool temporaire pour tester la connexion
 */
export async function testConnection1(): Promise<void> {
  try {
    const config: any = {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      family: process.env.DB_IP_FAMILY ? parseInt(process.env.DB_IP_FAMILY) : undefined,
    };

    const tempPool = new PgPool(config);
    const client = await tempPool.connect();
    await client.query("SELECT 1");
    client.release();
    await tempPool.end();
    console.log("✅ Connexion Supabase (test IPv4) établie avec succès");
  } catch (error) {
    console.error("❌ Erreur de connexion (testConnection1):", error);
    throw error;
  }
}

/**
 * Fonction pour créer automatiquement les tables si elles n'existent pas
 */
export async function createTablesIfNotExists(): Promise<void> {
  try {
    console.log("📊 Initialisation PostgreSQL via init_all_pg.sql...");
    const sqlFile = path.join(__dirname, "../../../drizzle/init_all_pg.sql");

    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Fichier SQL d'initialisation introuvable: ${sqlFile}`);
    }

    const sql = fs.readFileSync(sqlFile, "utf-8");

    const client = await dbClient.connect();
    try {
      await client.query(sql);
      console.log("✅ Schéma PostgreSQL exécuté avec succès");
    } finally {
      client.release();
    }

    // Créer l'administrateur par défaut si nécessaire
    try {
      const { createDefaultAdmin } = await import("./create-default-admin");
      await createDefaultAdmin();
    } catch (error: any) {
      console.error("❌ Erreur lors de la création de l'administrateur par défaut:", error.message);
    }

    // Migration spécifique pour Postgres: Ajouter la colonne annees_experience si elle n'existe pas
    try {
      const client2 = await dbClient.connect();
      try {
        const checkColumnQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'medecins' 
          AND column_name = 'annees_experience'
        `;
        const { rows } = await client2.query(checkColumnQuery);

        if (rows.length === 0) {
          console.log("📊 Ajout de la colonne 'annees_experience' à la table 'medecins'...");
          await client2.query('ALTER TABLE medecins ADD COLUMN annees_experience VARCHAR(10)');
          console.log("✅ Colonne 'annees_experience' ajoutée avec succès");
        }
      } finally {
        client2.release();
      }
    } catch (error: any) {
      console.error("⚠️ Erreur lors de la migration 'annees_experience':", error.message);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création des tables:", error);
    throw error;
  }
}

/**
 * Fonction pour fermer proprement les connexions
 */
export async function closeDatabase(): Promise<void> {
  await dbClient.end();
  console.log("🔌 Connexions Supabase fermées");
}
