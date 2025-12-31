import { Request, Response } from "express";
import { PartageMedicalService } from "../../application/services/PartageMedicalService";
import { MedecinService } from "../../application/services/MedecinService";

/**
 * Contrôleur pour la gestion du partage de dossiers et documents médicaux
 */
export class PartageMedicalController {
  /**
   * Récupère tous les médecins validés pour le partage
   * GET /api/partages-medicaux/medecins
   */
  static async getMedecins(req: Request, res: Response): Promise<void> {
    try {
      const result = await MedecinService.getAllMedecinsValides();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans getMedecins:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Crée un nouveau partage
   * POST /api/partages-medicaux
   */
  static async createPartage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Vous devez être connecté pour partager",
        });
        return;
      }

      const { idMedecin, typeRessource, idRessource, peutTelecharger, peutScreenshot, dateExpiration } = req.body;

      if (!idMedecin || !typeRessource || !idRessource) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "Les champs idMedecin, typeRessource et idRessource sont requis",
        });
        return;
      }

      if (typeRessource !== "dossier" && typeRessource !== "document") {
        res.status(400).json({
          success: false,
          error: "Type invalide",
          message: "typeRessource doit être 'dossier' ou 'document'",
        });
        return;
      }

      const result = await PartageMedicalService.createPartage({
        idPatient: userId,
        idMedecin,
        typeRessource,
        idRessource,
        peutTelecharger: peutTelecharger === true || peutTelecharger === "true",
        peutScreenshot: peutScreenshot === true || peutScreenshot === "true",
        dateExpiration: dateExpiration ? new Date(dateExpiration) : undefined,
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans createPartage:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Récupère tous les partages d'un patient
   * GET /api/partages-medicaux
   */
  static async getPartages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
        });
        return;
      }

      const result = await PartageMedicalService.getPartagesByPatient(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans getPartages:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Révoque un partage
   * DELETE /api/partages-medicaux/:id
   */
  static async revoquerPartage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
        });
        return;
      }

      const { id } = req.params;

      const result = await PartageMedicalService.revoquerPartage(id, userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans revoquerPartage:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Vérifie l'accès d'un médecin à une ressource
   * GET /api/partages-medicaux/verifier-acces
   */
  static async verifierAcces(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
        });
        return;
      }

      const { typeRessource, idRessource } = req.query;

      if (!typeRessource || !idRessource) {
        res.status(400).json({
          success: false,
          error: "Paramètres manquants",
          message: "typeRessource et idRessource sont requis",
        });
        return;
      }

      const result = await PartageMedicalService.verifierAcces(
        userId,
        typeRessource as "dossier" | "document",
        idRessource as string
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Erreur dans verifierAcces:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }
}

