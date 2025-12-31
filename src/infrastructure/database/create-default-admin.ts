import { db } from "./db";
import { utilisateurs, administrateurs } from "./schema";
import { hashPassword } from "../auth/hash";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

/**
 * Crée un administrateur par défaut si aucun n'existe
 * Email: admin@medconnect.com
 * Password: Admin123!
 * Téléphone: +1234567890
 */
export async function createDefaultAdmin(): Promise<void> {
  try {
    // Vérifier si un administrateur existe déjà
    const existingAdmin = await db
      .select()
      .from(utilisateurs)
      .where(eq(utilisateurs.typeUtilisateur, "administrateur"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("ℹ️  Un administrateur existe déjà. Aucun administrateur par défaut créé.");
      return;
    }

    // Créer l'administrateur par défaut
    const adminId = randomUUID();
    const hashedPassword = await hashPassword("vaneck.dongmo");

    // Insérer dans utilisateurs
    await db.insert(utilisateurs).values({
      id: adminId,
      mail: "vaneck.dongmo@saintjeaningenieur.org",
      motDePasse: hashedPassword,
      telephone: "+23712345678",
      typeUtilisateur: "administrateur",
      dateCreation: new Date(),
    });

    // Insérer dans administrateurs
    await db.insert(administrateurs).values({
      id: adminId,
      nom: "Administrateur Principal",
    });

    console.log("✅ Administrateur par défaut créé avec succès!");
    console.log("📧 Email: vaneck.dongmo@saintjeaningenieur.org");
    console.log("🔑 Password: vaneck.dongmo");
    console.log("⚠️  Veuillez changer le mot de passe après la première connexion!");
  } catch (error: any) {
    console.error("❌ Erreur lors de la création de l'administrateur par défaut:", error);
    throw error;
  }
}

