import * as dotenv from "dotenv";
import * as schema from "./schema";

// MySQL
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Postgres
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

import fs from "fs";
import path from "path";

dotenv.config();

/**
 * Parse DATABASE_URL si disponible, sinon utilise les variables individuelles
 */
function parseDatabaseUrl(): {
  protocol: string | null;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        protocol: url.protocol ? url.protocol.replace(":", "") : null,
        host: url.hostname,
        port: parseInt(url.port || (url.protocol && url.protocol.startsWith("postgres") ? "5432" : "3306")),
        user: url.username,
        password: url.password,
        database: url.pathname.replace(/^\//, ""),
      };
    } catch (error) {
      console.error("❌ Erreur lors du parsing de DATABASE_URL:", error);
      console.log("⚠️  Utilisation des variables individuelles à la place");
    }
  }

  // Fallback (MySQL defaults)
  return {
    protocol: null,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "meedconnect",
  };
}

const parsed = parseDatabaseUrl();
const isPostgres = parsed.protocol === "postgres" || parsed.protocol === "postgresql";

let db: any;
let dbClient: any;

if (isPostgres) {
  const pool = new PgPool({ connectionString: process.env.DATABASE_URL, max: 10 });
  dbClient = pool;
  db = drizzlePg(pool, { schema });
  console.log("🔌 Utilisation de PostgreSQL pour la base de données");
} else {
  const connectionConfig = {
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    password: parsed.password,
    database: parsed.database,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
  const pool = mysql.createPool(connectionConfig);
  dbClient = pool;
  db = drizzleMysql(pool, { schema, mode: "default" });
  console.log("🔌 Utilisation de MySQL pour la base de données");
}

export { db };


/**
 * Fonction pour tester la connexion à la base de données
 */
export async function testConnection(): Promise<void> {
  try {
    if (isPostgres) {
      const client = await dbClient.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("✅ Connexion PostgreSQL établie avec succès");
    } else {
      const connection = await dbClient.getConnection();
      try {
        await connection.query("SELECT 1");
      } finally {
        connection.release();
      }
      console.log("✅ Connexion MySQL établie avec succès");
    }
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données:", error);
    throw error;
  }
}

/**
 * Fonction pour créer automatiquement les tables si elles n'existent pas
 */
export async function createTablesIfNotExists(): Promise<void> {
  try {
    if (isPostgres) {
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

      return;
    }

    // === MySQL path (existing logic) ===
    const connection = await dbClient.getConnection();
    
    console.log("📊 Création des tables si nécessaire...");
    
    // Tables dans l'ordre des dépendances
    const createTableQueries = [
      // Table utilisateurs (base)
      `CREATE TABLE IF NOT EXISTS utilisateurs (
        id VARCHAR(255) PRIMARY KEY,
        mail VARCHAR(255) NOT NULL UNIQUE,
        mot_de_passe VARCHAR(255) NOT NULL,
        secret_deux_facteur VARCHAR(255),
        code_sms VARCHAR(4),
        code_sms_expiration TIMESTAMP NULL,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        derniere_connexion TIMESTAMP NULL,
        adresse TEXT,
        telephone VARCHAR(20),
        type_utilisateur ENUM('patient', 'medecin', 'administrateur') NOT NULL,
        code_reset_password VARCHAR(10),
        code_reset_password_expires TIMESTAMP NULL
      )`,
      
      // Table patients
      `      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(255) PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        date_naissance DATE NOT NULL,
        genre ENUM('Homme', 'Femme', 'Autre') NOT NULL,
        photo_profil VARCHAR(500) NULL,
        FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
      )`,
      
      // Table medecins
      `CREATE TABLE IF NOT EXISTS medecins (
        id VARCHAR(255) PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        specialite VARCHAR(255) NOT NULL,
        numero_licence VARCHAR(255) NOT NULL UNIQUE,
        statut_verification VARCHAR(50) DEFAULT 'en_attente' NOT NULL,
        document_identite VARCHAR(500),
        diplome VARCHAR(500),
        photo_profil VARCHAR(500),
        FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
      )`,
      
      // Table administrateurs
      `CREATE TABLE IF NOT EXISTS administrateurs (
        id VARCHAR(255) PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
      )`,
      
      // Table dossiers_medicaux
      // Note: type est optionnel car un dossier peut contenir différents types de documents
      // chemin_fichier supprimé - les fichiers sont dans documents_medicaux
      `CREATE TABLE IF NOT EXISTS dossiers_medicaux (
        id VARCHAR(255) PRIMARY KEY,
        id_patient VARCHAR(255) NOT NULL,
        titre VARCHAR(255) NOT NULL,
        date TIMESTAMP NOT NULL,
        description TEXT,
        type ENUM('Resultat_Labo', 'Radio', 'Ordonnance', 'Notes', 'Diagnostic', 'Imagerie', 'examen') NULL,
        version INT DEFAULT 1 NOT NULL,
        dernier_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE
      )`,
      
      // Table connexions
      `CREATE TABLE IF NOT EXISTS connexions (
        id VARCHAR(255) PRIMARY KEY,
        id_patient VARCHAR(255) NOT NULL,
        id_medecin VARCHAR(255) NOT NULL,
        statut ENUM('En_attente', 'Accepté', 'Revoqué') DEFAULT 'En_attente' NOT NULL,
        niveau_acces ENUM('Complet', 'Partiel', 'Lecture_Seule'),
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        date_acceptation TIMESTAMP NULL,
        FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE
      )`,
      
      // Table rendez_vous
      `CREATE TABLE IF NOT EXISTS rendez_vous (
        id VARCHAR(255) PRIMARY KEY,
        id_patient VARCHAR(255) NOT NULL,
        id_medecin VARCHAR(255) NOT NULL,
        date TIMESTAMP NOT NULL,
        type ENUM('Téléconsultation', 'Présentiel') NOT NULL,
        statut ENUM('Planifié', 'Terminé', 'Annulé') DEFAULT 'Planifié' NOT NULL,
        notes TEXT,
        duree INT,
        FOREIGN KEY (id_patient) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE
      )`,
      
      // Table disponibilites
      `CREATE TABLE IF NOT EXISTS disponibilites (
        id VARCHAR(255) PRIMARY KEY,
        id_medecin VARCHAR(255) NOT NULL,
        jour TIMESTAMP NOT NULL,
        heure_debut TIME NOT NULL,
        heure_fin TIME NOT NULL,
        lieu VARCHAR(255),
        centre_medical VARCHAR(255),
        type_consultation ENUM('Téléconsultation', 'Présentiel') NOT NULL,
        actif BOOLEAN DEFAULT TRUE NOT NULL,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (id_medecin) REFERENCES medecins(id) ON DELETE CASCADE
      )`,
    ];
    
    for (const query of createTableQueries) {
      await connection.query(query);
    }
    
    // Migrations pour modifier les tables existantes si nécessaire
    try {
      // Vérifier si la table existe
      const [tables]: any = await connection.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dossiers_medicaux'`
      );
      
      if (tables.length > 0) {
        // Vérifier si la colonne type existe et si elle est NOT NULL
        const [columns]: any = await connection.query(
          `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE 
           FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'dossiers_medicaux' 
           AND COLUMN_NAME = 'type'`
        );
        
        if (columns.length > 0 && columns[0].IS_NULLABLE === 'NO') {
          // Migration: Rendre la colonne 'type' nullable dans dossiers_medicaux
          await connection.query(
            `ALTER TABLE dossiers_medicaux 
             MODIFY COLUMN type ENUM('Resultat_Labo', 'Radio', 'Ordonnance', 'Notes', 'Diagnostic', 'Imagerie', 'examen') NULL`
          );
          console.log("✅ Migration 'type' appliquée avec succès (colonne rendue nullable)");
        } else if (columns.length > 0 && columns[0].IS_NULLABLE === 'YES') {
          console.log("ℹ️  Migration 'type' non nécessaire (colonne déjà nullable)");
        }
      }
    } catch (error: any) {
      // Logger l'erreur pour debug
      console.error(`❌ Erreur lors de la migration 'type': ${error.message}`);
    }
    
    try {
      // Migration: Supprimer la colonne chemin_fichier si elle existe
      await connection.query(`ALTER TABLE dossiers_medicaux DROP COLUMN chemin_fichier`);
    } catch (error: any) {
      // Ignorer l'erreur si la colonne n'existe pas (c'est normal après la migration)
      if (process.env.NODE_ENV === "development") {
        console.log(`ℹ️  Migration 'chemin_fichier' ignorée: ${error.message}`);
      }
    }
    
    // Migrations pour documents_medicaux
    try {
      // Vérifier si la colonne description existe
      const [docColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'documents_medicaux' 
         AND COLUMN_NAME = 'description'`
      );
      
      if (docColumns.length === 0) {
        // Ajouter la colonne description
        await connection.query(
          `ALTER TABLE documents_medicaux ADD COLUMN description TEXT`
        );
        console.log("✅ Migration 'description' ajoutée à documents_medicaux");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'description': ${error.message}`);
    }
    
    try {
      // Vérifier si id_dossier_medical est NOT NULL
      const [docIdColumns]: any = await connection.query(
        `SELECT IS_NULLABLE FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'documents_medicaux' 
         AND COLUMN_NAME = 'id_dossier_medical'`
      );
      
      if (docIdColumns.length > 0 && docIdColumns[0].IS_NULLABLE === 'YES') {
        // Rendre id_dossier_medical NOT NULL
        await connection.query(
          `ALTER TABLE documents_medicaux MODIFY COLUMN id_dossier_medical VARCHAR(255) NOT NULL`
        );
        console.log("✅ Migration 'id_dossier_medical' rendue NOT NULL");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'id_dossier_medical': ${error.message}`);
    }
    
    // Migration pour ajouter les colonnes diplome et photo_profil à medecins
    try {
      const [medecinsTable]: any = await connection.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medecins'`
      );
      
      if (medecinsTable.length > 0) {
        const [medecinsColumns]: any = await connection.query(
          `SELECT COLUMN_NAME 
           FROM information_schema.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'medecins' 
           AND COLUMN_NAME IN ('diplome', 'photo_profil')`
        );
        
        const existingColumns = medecinsColumns.map((col: any) => col.COLUMN_NAME);
        
        if (!existingColumns.includes('diplome')) {
          await connection.query(
            `ALTER TABLE medecins ADD COLUMN diplome VARCHAR(500)`
          );
          console.log("✅ Migration 'diplome' effectuée avec succès");
        } else {
          console.log("ℹ️  Migration 'diplome' non nécessaire (colonne déjà présente)");
        }
        
        if (!existingColumns.includes('photo_profil')) {
          await connection.query(
            `ALTER TABLE medecins ADD COLUMN photo_profil VARCHAR(500)`
          );
          console.log("✅ Migration 'photo_profil' effectuée avec succès");
        } else {
          console.log("ℹ️  Migration 'photo_profil' non nécessaire (colonne déjà présente)");
        }
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'diplome/photo_profil': ${error.message}`);
    }
    
    // Migration pour ajouter les colonnes de réinitialisation de mot de passe
    try {
      // Vérifier si la colonne code_reset_password existe
      const [resetColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'utilisateurs' 
         AND COLUMN_NAME = 'code_reset_password'`
      );
      
      if (resetColumns.length === 0) {
        // Ajouter les colonnes pour la réinitialisation de mot de passe
        await connection.query(
          `ALTER TABLE utilisateurs 
           ADD COLUMN code_reset_password VARCHAR(10) NULL,
           ADD COLUMN code_reset_password_expires TIMESTAMP NULL`
        );
        console.log("✅ Migration 'code_reset_password' ajoutée à utilisateurs");
      } else {
        console.log("ℹ️  Migration 'code_reset_password' non nécessaire (colonnes déjà présentes)");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'code_reset_password': ${error.message}`);
    }

    // Migration pour ajouter la colonne photo_profil à patients
    try {
      const [columns]: any = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'photo_profil'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE patients ADD COLUMN photo_profil VARCHAR(500) NULL
        `);
        console.log("✅ Migration 'photo_profil' ajoutée à patients");
      } else {
        console.log("ℹ️  Migration 'photo_profil' non nécessaire (colonne déjà présente)");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'photo_profil' pour patients: ${error.message}`);
    }

    // Migration pour ajouter la colonne id_document_medical à commentaires si elle n'existe pas
    try {
      const [columns]: any = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'commentaires' 
        AND COLUMN_NAME = 'id_document_medical'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE commentaires ADD COLUMN id_document_medical VARCHAR(255) NULL
        `);
        console.log("✅ Migration 'id_document_medical' ajoutée à commentaires");
        
        // Ajouter la contrainte de clé étrangère
        try {
          await connection.query(`
            ALTER TABLE commentaires 
            ADD CONSTRAINT fk_commentaire_document 
            FOREIGN KEY (id_document_medical) 
            REFERENCES documents_medicaux(id) 
            ON DELETE CASCADE
          `);
          console.log("✅ Contrainte de clé étrangère ajoutée pour id_document_medical");
        } catch (fkError: any) {
          // Ignorer si la contrainte existe déjà
          if (!fkError.message.includes("Duplicate key name")) {
            console.error(`⚠️  Erreur lors de l'ajout de la contrainte: ${fkError.message}`);
          }
        }
      } else {
        console.log("ℹ️  Migration 'id_document_medical' non nécessaire (colonne déjà présente)");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'id_document_medical' pour commentaires: ${error.message}`);
    }

    // Migration pour ajouter la colonne annees_experience à medecins si elle n'existe pas
    try {
      const [columns]: any = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'medecins' 
        AND COLUMN_NAME = 'annees_experience'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE medecins ADD COLUMN annees_experience VARCHAR(10) NULL
        `);
        console.log("✅ Migration 'annees_experience' ajoutée à medecins");
      } else {
        console.log("ℹ️  Migration 'annees_experience' non nécessaire (colonne déjà présente)");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'annees_experience' pour medecins: ${error.message}`);
    }

    // Migration pour ajouter la colonne date_decouverte à allergies si elle n'existe pas
    try {
      const [columns]: any = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'allergies' 
        AND COLUMN_NAME = 'date_decouverte'
      `);
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE allergies ADD COLUMN date_decouverte TIMESTAMP NULL
        `);
        console.log("✅ Migration 'date_decouverte' ajoutée à allergies");
      } else {
        console.log("ℹ️  Migration 'date_decouverte' non nécessaire (colonne déjà présente)");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'date_decouverte' pour allergies: ${error.message}`);
    }
    
    // Migration pour ajouter les colonnes description, education, specialisations à medecins
    try {
      const [medecinsDescColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'medecins' 
         AND COLUMN_NAME = 'description'`
      );
      
      if (medecinsDescColumns.length === 0) {
        await connection.query(
          `ALTER TABLE medecins ADD COLUMN description TEXT NULL`
        );
        console.log("✅ Migration 'description' ajoutée à medecins");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'description' medecins: ${error.message}`);
    }
    
    try {
      const [medecinsEduColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'medecins' 
         AND COLUMN_NAME = 'education'`
      );
      
      if (medecinsEduColumns.length === 0) {
        await connection.query(
          `ALTER TABLE medecins ADD COLUMN education TEXT NULL`
        );
        console.log("✅ Migration 'education' ajoutée à medecins");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'education' medecins: ${error.message}`);
    }
    
    try {
      const [medecinsSpecColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'medecins' 
         AND COLUMN_NAME = 'specialisations'`
      );
      
      if (medecinsSpecColumns.length === 0) {
        await connection.query(
          `ALTER TABLE medecins ADD COLUMN specialisations TEXT NULL`
        );
        console.log("✅ Migration 'specialisations' ajoutée à medecins");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'specialisations' medecins: ${error.message}`);
    }
    
    // Migration pour ajouter la colonne date_validation à medecins
    try {
      const [dateValidationColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'medecins' 
         AND COLUMN_NAME = 'date_validation'`
      );
      
      if (dateValidationColumns.length === 0) {
        await connection.query(
          `ALTER TABLE medecins ADD COLUMN date_validation TIMESTAMP NULL`
        );
        console.log("✅ Migration 'date_validation' ajoutée à medecins");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'date_validation' medecins: ${error.message}`);
    }
    
    // Migration pour ajouter la colonne motif_rejet à medecins
    try {
      const [motifRejetColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'medecins' 
         AND COLUMN_NAME = 'motif_rejet'`
      );
      
      if (motifRejetColumns.length === 0) {
        await connection.query(
          `ALTER TABLE medecins ADD COLUMN motif_rejet TEXT NULL`
        );
        console.log("✅ Migration 'motif_rejet' ajoutée à medecins");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'motif_rejet' medecins: ${error.message}`);
    }
    
    // Migration pour ajouter la colonne admin_validateur_id à medecins
    try {
      const [adminValidateurColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'medecins' 
         AND COLUMN_NAME = 'admin_validateur_id'`
      );
      
      if (adminValidateurColumns.length === 0) {
        await connection.query(
          `ALTER TABLE medecins ADD COLUMN admin_validateur_id VARCHAR(255) NULL,
           ADD CONSTRAINT fk_admin_validateur FOREIGN KEY (admin_validateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL`
        );
        console.log("✅ Migration 'admin_validateur_id' ajoutée à medecins");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'admin_validateur_id' medecins: ${error.message}`);
    }
    
    // Migration pour ajouter la colonne historique_actions à medecins
    try {
      const [historiqueActionsColumns]: any = await connection.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'medecins' 
         AND COLUMN_NAME = 'historique_actions'`
      );
      
      if (historiqueActionsColumns.length === 0) {
        await connection.query(
          `ALTER TABLE medecins ADD COLUMN historique_actions TEXT NULL`
        );
        console.log("✅ Migration 'historique_actions' ajoutée à medecins");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la migration 'historique_actions' medecins: ${error.message}`);
    }
    
    // Migration pour créer la table historique_validations si elle n'existe pas
    try {
      const [tables]: any = await connection.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'historique_validations'`
      );
      
      if (tables.length === 0) {
        await connection.query(
          `CREATE TABLE historique_validations (
            id VARCHAR(255) PRIMARY KEY,
            medecin_id VARCHAR(255) NOT NULL,
            admin_id VARCHAR(255) NOT NULL,
            action ENUM('validation', 'rejet', 'mise_en_attente') NOT NULL,
            statut_avant VARCHAR(50) NOT NULL,
            statut_apres VARCHAR(50) NOT NULL,
            motif TEXT NULL,
            date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            commentaire_admin TEXT NULL,
            adresse_ip VARCHAR(45) NULL,
            FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE,
            FOREIGN KEY (admin_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
            INDEX idx_medecin_id (medecin_id),
            INDEX idx_admin_id (admin_id),
            INDEX idx_date_action (date_action)
          )`
        );
        console.log("✅ Table 'historique_validations' créée");
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de la création de la table 'historique_validations': ${error.message}`);
    }
    
    connection.release();
    console.log("✅ Tables créées avec succès");
    
    // Créer l'administrateur par défaut si nécessaire
    try {
      const { createDefaultAdmin } = await import("./create-default-admin");
      await createDefaultAdmin();
    } catch (error: any) {
      console.error("❌ Erreur lors de la création de l'administrateur par défaut:", error.message);
      // Ne pas faire échouer la création des tables si l'admin ne peut pas être créé
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
  if (isPostgres) {
    await dbClient.end();
    console.log("🔌 Connexions PostgreSQL fermées");
  } else {
    await dbClient.end();
    console.log("🔌 Connexions MySQL fermées");
  }
}

