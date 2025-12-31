import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { documentsMedicaux } from "../../infrastructure/database/schema";
import { randomUUID } from "crypto";
import { FileStorageService } from "../../infrastructure/storage/fileStorage";
import type { TypeEnregistrement } from "../../domain/enums/TypeEnregistrement";

/**
 * Interface pour créer un document médical
 */
export interface CreateDocumentMedicalData {
  idDossierMedical: string;
  idPatient: string;
  nom: string;
  type: TypeEnregistrement;
  description?: string;
  cheminFichier?: string;
}

/**
 * Service de gestion des documents médicaux
 */
export class DocumentMedicalService {
  /**
   * Récupère tous les documents médicaux d'un dossier
   */
  static async getDocumentsByDossier(dossierId: string) {
    try {
      const documents = await db
        .select()
        .from(documentsMedicaux)
        .where(eq(documentsMedicaux.idDossierMedical, dossierId))
        .orderBy(documentsMedicaux.dateCreation);

      return {
        success: true,
        data: documents.map((d) => ({
          id: d.id,
          idDossierMedical: d.idDossierMedical,
          idPatient: d.idPatient,
          nom: d.nom,
          type: d.type,
          description: d.description || undefined,
          cheminFichier: d.cheminFichier || undefined,
          dateCreation: d.dateCreation.toISOString(),
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la récupération des documents",
        message: error.message,
      };
    }
  }

  /**
   * Récupère tous les documents médicaux d'un patient
   */
  static async getDocumentsByPatient(patientId: string) {
    try {
      const documents = await db
        .select()
        .from(documentsMedicaux)
        .where(eq(documentsMedicaux.idPatient, patientId))
        .orderBy(documentsMedicaux.dateCreation);

      return {
        success: true,
        data: documents.map((d) => ({
          id: d.id,
          idDossierMedical: d.idDossierMedical,
          idPatient: d.idPatient,
          nom: d.nom,
          type: d.type,
          description: d.description || undefined,
          cheminFichier: d.cheminFichier || undefined,
          dateCreation: d.dateCreation.toISOString(),
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la récupération des documents",
        message: error.message,
      };
    }
  }

  /**
   * Récupère un document médical par son ID
   */
  static async getDocumentById(documentId: string) {
    try {
      const document = await db
        .select()
        .from(documentsMedicaux)
        .where(eq(documentsMedicaux.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return {
          success: false,
          error: "Document non trouvé",
          message: "Le document médical demandé n'existe pas",
        };
      }

      const d = document[0];
      return {
        success: true,
        data: {
          id: d.id,
          idDossierMedical: d.idDossierMedical,
          idPatient: d.idPatient,
          nom: d.nom,
          type: d.type,
          description: d.description || undefined,
          cheminFichier: d.cheminFichier || undefined,
          dateCreation: d.dateCreation.toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la récupération du document",
        message: error.message,
      };
    }
  }

  /**
   * Crée un nouveau document médical
   */
  static async createDocument(data: CreateDocumentMedicalData, fichierPath?: string) {
    try {
      const newDocument = {
        id: randomUUID(),
        idDossierMedical: data.idDossierMedical,
        idPatient: data.idPatient,
        nom: data.nom,
        type: data.type,
        description: data.description || null,
        cheminFichier: fichierPath || null,
        dateCreation: new Date(),
      };

      await db.insert(documentsMedicaux).values(newDocument);

      return {
        success: true,
        data: {
          id: newDocument.id,
          idDossierMedical: newDocument.idDossierMedical,
          idPatient: newDocument.idPatient,
          nom: newDocument.nom,
          type: newDocument.type,
          description: newDocument.description || undefined,
          cheminFichier: newDocument.cheminFichier || undefined,
          dateCreation: newDocument.dateCreation.toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la création du document",
        message: error.message,
      };
    }
  }

  /**
   * Met à jour un document médical
   */
  static async updateDocument(documentId: string, updates: Partial<CreateDocumentMedicalData>) {
    try {
      const document = await db
        .select()
        .from(documentsMedicaux)
        .where(eq(documentsMedicaux.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return {
          success: false,
          error: "Document non trouvé",
          message: "Le document médical demandé n'existe pas",
        };
      }

      const updateData: any = {};

      if (updates.nom !== undefined) updateData.nom = updates.nom;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.cheminFichier !== undefined) updateData.cheminFichier = updates.cheminFichier;

      await db
        .update(documentsMedicaux)
        .set(updateData)
        .where(eq(documentsMedicaux.id, documentId));

      const documentMisAJour = await db
        .select()
        .from(documentsMedicaux)
        .where(eq(documentsMedicaux.id, documentId))
        .limit(1);

      const d = documentMisAJour[0];
      return {
        success: true,
        data: {
          id: d.id,
          idDossierMedical: d.idDossierMedical,
          idPatient: d.idPatient,
          nom: d.nom,
          type: d.type,
          description: d.description || undefined,
          cheminFichier: d.cheminFichier || undefined,
          dateCreation: d.dateCreation.toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la mise à jour du document",
        message: error.message,
      };
    }
  }

  /**
   * Supprime un document médical
   */
  static async deleteDocument(documentId: string) {
    try {
      const document = await db
        .select()
        .from(documentsMedicaux)
        .where(eq(documentsMedicaux.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return {
          success: false,
          error: "Document non trouvé",
          message: "Le document médical demandé n'existe pas",
        };
      }

      // Supprimer le fichier physique si existant
      if (document[0].cheminFichier) {
        await FileStorageService.deleteFile(document[0].cheminFichier);
      }

      await db.delete(documentsMedicaux).where(eq(documentsMedicaux.id, documentId));

      return {
        success: true,
        message: "Document supprimé avec succès",
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la suppression du document",
        message: error.message,
      };
    }
  }
}

