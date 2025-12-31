import { db } from "../../infrastructure/database/db";
import { partagesMedicaux } from "../../infrastructure/database/schema/partagesMedicaux";
import { medecins } from "../../infrastructure/database/schema/medecins";
import { utilisateurs } from "../../infrastructure/database/schema/utilisateurs";
import { eq, and, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface CreatePartageData {
  idPatient: string;
  idMedecin: string;
  typeRessource: "dossier" | "document";
  idRessource: string;
  peutTelecharger: boolean;
  peutScreenshot: boolean;
  dateExpiration?: Date;
}

export interface PartageMedical {
  id: string;
  idPatient: string;
  idMedecin: string;
  typeRessource: "dossier" | "document";
  idRessource: string;
  peutTelecharger: boolean;
  peutScreenshot: boolean;
  dateCreation: Date;
  dateExpiration?: Date;
  statut: "actif" | "revoke" | "expire";
  medecin?: {
    id: string;
    nom: string;
    specialite: string;
    mail: string;
  };
}

export interface PartageResponse {
  success: boolean;
  data?: PartageMedical | PartageMedical[];
  error?: string;
  message?: string;
}

/**
 * Service de gestion du partage de dossiers et documents médicaux
 */
export class PartageMedicalService {
  /**
   * Crée un nouveau partage
   */
  static async createPartage(data: CreatePartageData): Promise<PartageResponse> {
    try {
      // Vérifier si un partage actif existe déjà
      const existingPartage = await db
        .select()
        .from(partagesMedicaux)
        .where(
          and(
            eq(partagesMedicaux.idPatient, data.idPatient),
            eq(partagesMedicaux.idMedecin, data.idMedecin),
            eq(partagesMedicaux.typeRessource, data.typeRessource),
            eq(partagesMedicaux.idRessource, data.idRessource),
            eq(partagesMedicaux.statut, "actif")
          )
        )
        .limit(1);

      if (existingPartage.length > 0) {
        // Mettre à jour le partage existant
        const updated = await db
          .update(partagesMedicaux)
          .set({
            peutTelecharger: data.peutTelecharger,
            peutScreenshot: data.peutScreenshot,
            dateExpiration: data.dateExpiration || null,
            statut: "actif",
          })
          .where(eq(partagesMedicaux.id, existingPartage[0].id));

        const partage = await db
          .select()
          .from(partagesMedicaux)
          .where(eq(partagesMedicaux.id, existingPartage[0].id))
          .limit(1);

        return {
          success: true,
          data: this.mapToPartageMedical(partage[0]),
          message: "Partage mis à jour avec succès",
        };
      }

      // Créer un nouveau partage
      const nouveauPartage = {
        id: uuidv4(),
        idPatient: data.idPatient,
        idMedecin: data.idMedecin,
        typeRessource: data.typeRessource,
        idRessource: data.idRessource,
        peutTelecharger: data.peutTelecharger,
        peutScreenshot: data.peutScreenshot,
        dateExpiration: data.dateExpiration || null,
        statut: "actif" as const,
      };

      await db.insert(partagesMedicaux).values(nouveauPartage);

      return {
        success: true,
        data: this.mapToPartageMedical(nouveauPartage),
        message: "Partage créé avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la création du partage:", error);
      return {
        success: false,
        error: "Erreur lors de la création du partage",
        message: error.message,
      };
    }
  }

  /**
   * Récupère tous les partages d'un patient
   */
  static async getPartagesByPatient(patientId: string): Promise<PartageResponse> {
    try {
      const partages = await db
        .select({
          partage: partagesMedicaux,
          medecin: {
            id: medecins.id,
            nom: medecins.nom,
            specialite: medecins.specialite,
            mail: utilisateurs.mail,
          },
        })
        .from(partagesMedicaux)
        .innerJoin(medecins, eq(partagesMedicaux.idMedecin, medecins.id))
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(
          and(
            eq(partagesMedicaux.idPatient, patientId),
            eq(partagesMedicaux.statut, "actif")
          )
        );

      const partagesWithMedecin = partages.map((p) => ({
        ...this.mapToPartageMedical(p.partage),
        medecin: p.medecin,
      }));

      return {
        success: true,
        data: partagesWithMedecin,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des partages:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des partages",
        message: error.message,
      };
    }
  }

  /**
   * Récupère tous les partages d'un médecin
   */
  static async getPartagesByMedecin(medecinId: string): Promise<PartageResponse> {
    try {
      const partages = await db
        .select()
        .from(partagesMedicaux)
        .where(
          and(
            eq(partagesMedicaux.idMedecin, medecinId),
            eq(partagesMedicaux.statut, "actif")
          )
        );

      return {
        success: true,
        data: partages.map((p) => this.mapToPartageMedical(p)),
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des partages:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des partages",
        message: error.message,
      };
    }
  }

  /**
   * Vérifie si un médecin a accès à une ressource
   */
  static async verifierAcces(
    medecinId: string,
    typeRessource: "dossier" | "document",
    idRessource: string
  ): Promise<{ hasAccess: boolean; peutTelecharger: boolean; peutScreenshot: boolean }> {
    try {
      const partage = await db
        .select()
        .from(partagesMedicaux)
        .where(
          and(
            eq(partagesMedicaux.idMedecin, medecinId),
            eq(partagesMedicaux.typeRessource, typeRessource),
            eq(partagesMedicaux.idRessource, idRessource),
            eq(partagesMedicaux.statut, "actif")
          )
        )
        .limit(1);

      if (partage.length === 0) {
        return { hasAccess: false, peutTelecharger: false, peutScreenshot: false };
      }

      const p = partage[0];
      // Vérifier l'expiration
      if (p.dateExpiration && new Date(p.dateExpiration) < new Date()) {
        // Marquer comme expiré
        await db
          .update(partagesMedicaux)
          .set({ statut: "expire" })
          .where(eq(partagesMedicaux.id, p.id));
        return { hasAccess: false, peutTelecharger: false, peutScreenshot: false };
      }

      return {
        hasAccess: true,
        peutTelecharger: p.peutTelecharger === 1 || p.peutTelecharger === true,
        peutScreenshot: p.peutScreenshot === 1 || p.peutScreenshot === true,
      };
    } catch (error: any) {
      console.error("Erreur lors de la vérification d'accès:", error);
      return { hasAccess: false, peutTelecharger: false, peutScreenshot: false };
    }
  }

  /**
   * Révoque un partage
   */
  static async revoquerPartage(partageId: string, patientId: string): Promise<PartageResponse> {
    try {
      // Vérifier que le partage appartient au patient
      const partage = await db
        .select()
        .from(partagesMedicaux)
        .where(
          and(
            eq(partagesMedicaux.id, partageId),
            eq(partagesMedicaux.idPatient, patientId)
          )
        )
        .limit(1);

      if (partage.length === 0) {
        return {
          success: false,
          error: "Partage non trouvé",
          message: "Le partage n'existe pas ou ne vous appartient pas",
        };
      }

      await db
        .update(partagesMedicaux)
        .set({ statut: "revoke" })
        .where(eq(partagesMedicaux.id, partageId));

      return {
        success: true,
        message: "Partage révoqué avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la révocation du partage:", error);
      return {
        success: false,
        error: "Erreur lors de la révocation du partage",
        message: error.message,
      };
    }
  }

  /**
   * Mappe un objet de base de données vers PartageMedical
   */
  private static mapToPartageMedical(partage: any): PartageMedical {
    return {
      id: partage.id,
      idPatient: partage.idPatient,
      idMedecin: partage.idMedecin,
      typeRessource: partage.typeRessource,
      idRessource: partage.idRessource,
      peutTelecharger: partage.peutTelecharger === 1 || partage.peutTelecharger === true,
      peutScreenshot: partage.peutScreenshot === 1 || partage.peutScreenshot === true,
      dateCreation: partage.dateCreation,
      dateExpiration: partage.dateExpiration || undefined,
      statut: partage.statut,
    };
  }
}

