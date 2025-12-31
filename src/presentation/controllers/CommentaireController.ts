import { Request, Response } from "express";
import { CommentaireService } from "../../application/services/CommentaireService";

/**
 * Contrôleur de gestion des commentaires
 */
export class CommentaireController {
  /**
   * Crée un commentaire sur un document médical ou un dossier médical
   * POST /api/commentaires
   */
  static async createCommentaire(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req as any).user.typeUtilisateur !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent créer des commentaires",
        });
        return;
      }

      const medecinId = (req as any).user.userId;
      const { idDossierMedical, idDocumentMedical, contenu } = req.body;

      // Vérifier que soit idDossierMedical soit idDocumentMedical est fourni
      if (!idDossierMedical && !idDocumentMedical) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "L'ID du dossier médical ou de l'ID du document médical est requis",
        });
        return;
      }

      if (!contenu || !contenu.trim()) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "Le contenu du commentaire est requis",
        });
        return;
      }

      const result = await CommentaireService.createCommentaire(medecinId, {
        idDossierMedical,
        idDocumentMedical,
        contenu,
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans createCommentaire:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère les commentaires d'un document médical
   * GET /api/commentaires/document/:documentId
   */
  static async getCommentairesByDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req as any).user.typeUtilisateur !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent voir les commentaires",
        });
        return;
      }

      const medecinId = (req as any).user.userId;
      const documentId = req.params.documentId;

      const result = await CommentaireService.getCommentairesByDocument(documentId, medecinId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans getCommentairesByDocument:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère les commentaires d'un dossier médical
   * GET /api/commentaires/dossier/:dossierId
   */
  static async getCommentairesByDossier(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req as any).user.typeUtilisateur !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent voir les commentaires",
        });
        return;
      }

      const medecinId = (req as any).user.userId;
      const dossierId = req.params.dossierId;

      const result = await CommentaireService.getCommentairesByDossier(dossierId, medecinId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans getCommentairesByDossier:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Supprime un commentaire
   * DELETE /api/commentaires/:id
   */
  static async deleteCommentaire(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req as any).user.typeUtilisateur !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent supprimer des commentaires",
        });
        return;
      }

      const medecinId = (req as any).user.userId;
      const commentaireId = req.params.id;

      const result = await CommentaireService.deleteCommentaire(commentaireId, medecinId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans deleteCommentaire:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }
}

