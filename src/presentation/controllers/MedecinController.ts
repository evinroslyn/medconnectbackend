import { Request, Response } from "express";
import { MedecinService } from "../../application/services/MedecinService";

/**
 * Contrôleur de gestion des médecins
 */
export class MedecinController {
  /**
   * Recherche des médecins
   * GET /api/medecins?nom=xxx&specialite=xxx&emplacement=xxx
   */
  static async searchMedecins(req: Request, res: Response): Promise<void> {
    try {
      const { nom, specialite, emplacement } = req.query;

      const params = {
        nom: nom as string | undefined,
        specialite: specialite as string | undefined,
        emplacement: emplacement as string | undefined,
      };

      const result = await MedecinService.searchMedecins(params);

      if (result.success) {
        res.status(200).json(result.data || []);
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans searchMedecins:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère un médecin par son ID
   * GET /api/medecins/:id
   */
  static async getMedecinById(req: Request, res: Response): Promise<void> {
    try {
      const medecinId = req.params.id;

      if (!medecinId) {
        res.status(400).json({
          success: false,
          error: "Paramètre manquant",
          message: "L'ID du médecin est requis",
        });
        return;
      }

      const result = await MedecinService.getMedecinById(medecinId);

      if (result.success && result.data && result.data.length > 0) {
        res.status(200).json(result.data[0]);
      } else {
        res.status(404).json({
          success: false,
          error: result.error || "Médecin non trouvé",
          message: result.message || "Le médecin spécifié n'existe pas",
        });
      }
    } catch (error: any) {
      console.error("Erreur dans getMedecinById:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }
}

