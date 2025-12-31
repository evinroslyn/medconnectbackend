import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { dossiersMedicaux } from "../../infrastructure/database/schema";
import { randomUUID } from "crypto";
import { FileStorageService } from "../../infrastructure/storage/fileStorage";
import type { TypeEnregistrement } from "../../domain/enums/TypeEnregistrement";

/**
 * Interface pour créer un dossier médical
 */
export interface CreateDossierMedicalData {
  idPatient: string;
  titre: string;
  date: string;
  description?: string;
  type?: TypeEnregistrement; // Optionnel car un dossier peut contenir différents types de documents
}

/**
 * Service de gestion des dossiers médicaux
 */
export class DossierMedicalService {
  /**
   * Récupère tous les dossiers médicaux d'un patient
   */
  static async getDossiersByPatient(patientId: string) {
    try {
      const dossiers = await db
        .select()
        .from(dossiersMedicaux)
        .where(eq(dossiersMedicaux.idPatient, patientId))
        .orderBy(dossiersMedicaux.date);

      return {
        success: true,
        data: dossiers.map((d) => ({
          id: d.id,
          idPatient: d.idPatient,
          titre: d.titre,
          date: d.date.toISOString(),
          description: d.description || undefined,
          type: d.type || undefined,
          version: d.version,
          dernierModification: d.dernierModification.toISOString(),
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la récupération des dossiers",
        message: error.message,
      };
    }
  }

  /**
   * Récupère un dossier médical par son ID
   */
  static async getDossierById(dossierId: string) {
    try {
      const dossier = await db
        .select()
        .from(dossiersMedicaux)
        .where(eq(dossiersMedicaux.id, dossierId))
        .limit(1);

      if (dossier.length === 0) {
        return {
          success: false,
          error: "Dossier non trouvé",
          message: "Le dossier médical demandé n'existe pas",
        };
      }

      const d = dossier[0];
      return {
        success: true,
        data: {
          id: d.id,
          idPatient: d.idPatient,
          titre: d.titre,
          date: d.date.toISOString(),
          description: d.description || undefined,
          type: d.type || undefined,
          version: d.version,
          dernierModification: d.dernierModification.toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la récupération du dossier",
        message: error.message,
      };
    }
  }

  /**
   * Crée un nouveau dossier médical (conteneur pour documents)
   */
  static async createDossier(data: CreateDossierMedicalData) {
    try {
      const id = randomUUID();
      const maintenant = new Date();
      const dateDossier = new Date(data.date);

      // Construire l'objet dossier sans inclure les champs undefined
      // Drizzle ORM gère mieux undefined que null pour les champs optionnels
      const nouveauDossier: any = {
        id,
        idPatient: data.idPatient,
        titre: data.titre,
        date: dateDossier,
        version: 1,
        dernierModification: maintenant,
      };
      
      // Ajouter description seulement si elle existe
      if (data.description !== undefined && data.description !== null && data.description.trim() !== "") {
        nouveauDossier.description = data.description;
      }
      
      // Ajouter type seulement s'il existe (ne pas inclure si undefined)
      if (data.type !== undefined && data.type !== null) {
        nouveauDossier.type = data.type;
      }

      // Log pour debug
      console.log("[DossierMedicalService] Inserting dossier:", {
        keys: Object.keys(nouveauDossier),
        hasType: 'type' in nouveauDossier,
        typeValue: nouveauDossier.type,
      });

      await db.insert(dossiersMedicaux).values(nouveauDossier);

      return {
        success: true,
        data: {
          id: nouveauDossier.id,
          idPatient: nouveauDossier.idPatient,
          titre: nouveauDossier.titre,
          date: nouveauDossier.date.toISOString(),
          description: nouveauDossier.description || undefined,
          type: nouveauDossier.type || undefined,
          version: nouveauDossier.version,
          dernierModification: nouveauDossier.dernierModification.toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la création du dossier",
        message: error.message,
      };
    }
  }

  /**
   * Met à jour un dossier médical
   */
  static async updateDossier(dossierId: string, updates: Partial<CreateDossierMedicalData>) {
    try {
      const dossier = await db
        .select()
        .from(dossiersMedicaux)
        .where(eq(dossiersMedicaux.id, dossierId))
        .limit(1);

      if (dossier.length === 0) {
        return {
          success: false,
          error: "Dossier non trouvé",
          message: "Le dossier médical demandé n'existe pas",
        };
      }

      const updateData: any = {
        dernierModification: new Date(),
      };

      if (updates.titre !== undefined) updateData.titre = updates.titre;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.date !== undefined) updateData.date = new Date(updates.date);

      await db
        .update(dossiersMedicaux)
        .set(updateData)
        .where(eq(dossiersMedicaux.id, dossierId));

      const dossierMisAJour = await db
        .select()
        .from(dossiersMedicaux)
        .where(eq(dossiersMedicaux.id, dossierId))
        .limit(1);

      const d = dossierMisAJour[0];
      return {
        success: true,
        data: {
          id: d.id,
          idPatient: d.idPatient,
          titre: d.titre,
          date: d.date.toISOString(),
          description: d.description || undefined,
          type: d.type || undefined,
          version: d.version,
          dernierModification: d.dernierModification.toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la mise à jour du dossier",
        message: error.message,
      };
    }
  }

  /**
   * Catégorise un dossier médical (change son type)
   * Correspond à Patient.categoriserDossier() du diagramme
   */
  static async categoriserDossier(dossierId: string, type: TypeEnregistrement) {
    return this.updateDossier(dossierId, { type });
  }

  /**
   * Ajoute ou met à jour la description d'un dossier médical
   * Correspond à Patient.ajouterDescriptionDossier() du diagramme
   */
  static async ajouterDescriptionDossier(dossierId: string, description: string) {
    return this.updateDossier(dossierId, { description });
  }

  /**
   * Supprime un dossier médical
   */
  static async deleteDossier(dossierId: string) {
    try {
      const dossier = await db
        .select()
        .from(dossiersMedicaux)
        .where(eq(dossiersMedicaux.id, dossierId))
        .limit(1);

      if (dossier.length === 0) {
        return {
          success: false,
          error: "Dossier non trouvé",
          message: "Le dossier médical demandé n'existe pas",
        };
      }

      // Note: Les fichiers sont maintenant gérés par DocumentMedicalService
      // Pas besoin de supprimer de fichier ici car un dossier est juste un conteneur

      await db.delete(dossiersMedicaux).where(eq(dossiersMedicaux.id, dossierId));

      return {
        success: true,
        message: "Dossier médical supprimé avec succès",
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la suppression du dossier",
        message: error.message,
      };
    }
  }
}

