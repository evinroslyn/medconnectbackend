import { db } from "../../infrastructure/database/db";
import { commentaires } from "../../infrastructure/database/schema/commentaires";
import { dossiersMedicaux } from "../../infrastructure/database/schema/dossiersMedicaux";
import { documentsMedicaux } from "../../infrastructure/database/schema/documentsMedicaux";
import { medecins } from "../../infrastructure/database/schema/medecins";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { PartageMedicalService } from "./PartageMedicalService";

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateCommentaireData {
  idDossierMedical?: string;
  idDocumentMedical?: string;
  contenu: string;
}

/**
 * Service de gestion des commentaires sur les dossiers et documents médicaux
 */
export class CommentaireService {
  /**
   * Crée un commentaire sur un document médical ou un dossier médical
   * Vérifie que le médecin a accès au dossier via un partage médical
   */
  static async createCommentaire(
    medecinId: string,
    data: CreateCommentaireData
  ): Promise<ServiceResponse<any>> {
    try {
      // Vérifier que le médecin existe
      const medecin = await db
        .select()
        .from(medecins)
        .where(eq(medecins.id, medecinId))
        .limit(1);

      if (medecin.length === 0) {
        return {
          success: false,
          error: "Médecin non trouvé",
          message: "Le médecin spécifié n'existe pas",
        };
      }

      let dossierId: string;

      // Si un document médical est spécifié, récupérer le dossier parent
      if (data.idDocumentMedical) {
        const document = await db
          .select()
          .from(documentsMedicaux)
          .where(eq(documentsMedicaux.id, data.idDocumentMedical))
          .limit(1);

        if (document.length === 0) {
          return {
            success: false,
            error: "Document non trouvé",
            message: "Le document médical spécifié n'existe pas",
          };
        }

        dossierId = document[0].idDossierMedical;
      } else if (data.idDossierMedical) {
        dossierId = data.idDossierMedical;
      } else {
        return {
          success: false,
          error: "Données manquantes",
          message: "L'ID du dossier médical ou de l'ID du document médical est requis",
        };
      }

      // Vérifier que le dossier médical existe
      const dossier = await db
        .select()
        .from(dossiersMedicaux)
        .where(eq(dossiersMedicaux.id, dossierId))
        .limit(1);

      if (dossier.length === 0) {
        return {
          success: false,
          error: "Dossier non trouvé",
          message: "Le dossier médical spécifié n'existe pas",
        };
      }

      // Vérifier que le médecin a accès au dossier via un partage médical
      const accessCheck = await PartageMedicalService.verifierAcces(
        medecinId,
        "dossier",
        dossierId
      );

      if (!accessCheck.hasAccess) {
        return {
          success: false,
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce dossier médical",
        };
      }

      // Créer le commentaire
      const commentaireId = randomUUID();
      await db.insert(commentaires).values({
        id: commentaireId,
        idDossierMedical: dossierId,
        idDocumentMedical: data.idDocumentMedical || null,
        idMedecin: medecinId,
        contenu: data.contenu.trim(),
        dateCreation: new Date(),
      });

      // Récupérer le commentaire créé avec les informations du médecin
      const created = await db
        .select({
          id: commentaires.id,
          contenu: commentaires.contenu,
          dateCreation: commentaires.dateCreation,
          idDossierMedical: commentaires.idDossierMedical,
          idDocumentMedical: commentaires.idDocumentMedical,
          idMedecin: commentaires.idMedecin,
          medecinNom: medecins.nom,
          medecinSpecialite: medecins.specialite,
        })
        .from(commentaires)
        .innerJoin(medecins, eq(commentaires.idMedecin, medecins.id))
        .where(eq(commentaires.id, commentaireId))
        .limit(1);

      return {
        success: true,
        data: created[0],
        message: "Commentaire créé avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la création du commentaire:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de créer le commentaire",
      };
    }
  }

  /**
   * Récupère tous les commentaires d'un document médical
   */
  static async getCommentairesByDocument(
    documentId: string,
    medecinId: string
  ): Promise<ServiceResponse<any[]>> {
    try {
      // Vérifier que le document existe
      const document = await db
        .select()
        .from(documentsMedicaux)
        .where(eq(documentsMedicaux.id, documentId))
        .limit(1);

      if (document.length === 0) {
        return {
          success: false,
          error: "Document non trouvé",
          message: "Le document médical spécifié n'existe pas",
        };
      }

      // Vérifier que le médecin a accès au dossier
      const accessCheck = await PartageMedicalService.verifierAcces(
        medecinId,
        "dossier",
        document[0].idDossierMedical
      );

      if (!accessCheck.hasAccess) {
        return {
          success: false,
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce document médical",
        };
      }

      // Récupérer les commentaires du document
      const commentairesList = await db
        .select({
          id: commentaires.id,
          contenu: commentaires.contenu,
          dateCreation: commentaires.dateCreation,
          idDossierMedical: commentaires.idDossierMedical,
          idDocumentMedical: commentaires.idDocumentMedical,
          idMedecin: commentaires.idMedecin,
          medecinNom: medecins.nom,
          medecinSpecialite: medecins.specialite,
        })
        .from(commentaires)
        .innerJoin(medecins, eq(commentaires.idMedecin, medecins.id))
        .where(
          and(
            eq(commentaires.idDocumentMedical, documentId),
            eq(commentaires.idDossierMedical, document[0].idDossierMedical)
          )
        )
        .orderBy(desc(commentaires.dateCreation));

      return {
        success: true,
        data: commentairesList,
        message: "Commentaires récupérés avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des commentaires:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de récupérer les commentaires",
      };
    }
  }

  /**
   * Récupère tous les commentaires d'un dossier médical
   */
  static async getCommentairesByDossier(
    dossierId: string,
    medecinId: string
  ): Promise<ServiceResponse<any[]>> {
    try {
      // Vérifier que le médecin a accès au dossier
      const accessCheck = await PartageMedicalService.verifierAcces(
        medecinId,
        "dossier",
        dossierId
      );

      if (!accessCheck.hasAccess) {
        return {
          success: false,
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce dossier médical",
        };
      }

      // Récupérer les commentaires du dossier
      const commentairesList = await db
        .select({
          id: commentaires.id,
          contenu: commentaires.contenu,
          dateCreation: commentaires.dateCreation,
          idDossierMedical: commentaires.idDossierMedical,
          idDocumentMedical: commentaires.idDocumentMedical,
          idMedecin: commentaires.idMedecin,
          medecinNom: medecins.nom,
          medecinSpecialite: medecins.specialite,
          documentNom: documentsMedicaux.nom,
        })
        .from(commentaires)
        .innerJoin(medecins, eq(commentaires.idMedecin, medecins.id))
        .leftJoin(
          documentsMedicaux,
          eq(commentaires.idDocumentMedical, documentsMedicaux.id)
        )
        .where(eq(commentaires.idDossierMedical, dossierId))
        .orderBy(desc(commentaires.dateCreation));

      return {
        success: true,
        data: commentairesList,
        message: "Commentaires récupérés avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des commentaires:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de récupérer les commentaires",
      };
    }
  }

  /**
   * Supprime un commentaire (seul l'auteur peut le supprimer)
   */
  static async deleteCommentaire(
    commentaireId: string,
    medecinId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Vérifier que le commentaire existe et appartient au médecin
      const commentaire = await db
        .select()
        .from(commentaires)
        .where(
          and(
            eq(commentaires.id, commentaireId),
            eq(commentaires.idMedecin, medecinId)
          )
        )
        .limit(1);

      if (commentaire.length === 0) {
        return {
          success: false,
          error: "Commentaire non trouvé",
          message: "Le commentaire n'existe pas ou vous n'êtes pas autorisé à le supprimer",
        };
      }

      // Supprimer le commentaire
      await db
        .delete(commentaires)
        .where(eq(commentaires.id, commentaireId));

      return {
        success: true,
        message: "Commentaire supprimé avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de supprimer le commentaire",
      };
    }
  }
}

