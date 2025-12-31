import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AdminService } from "../../application/services/AdminService";

/**
 * Contrôleur d'administration
 * Gère les routes d'administration (validation des médecins, statistiques, etc.)
 */
export class AdminController {
  /**
   * Récupérer tous les médecins en attente de validation
   */
  static async getMedecinsEnAttente(req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.getMedecinsEnAttente();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans getMedecinsEnAttente:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération des médecins en attente"
      });
    }
  }

  /**
   * Valider un médecin
   */
  static async validerMedecin(req: Request, res: Response): Promise<void> {
    try {
      const { medecinId } = req.params;

      if (!medecinId) {
        res.status(400).json({
          success: false,
          error: "ID manquant",
          message: "L'ID du médecin est requis"
        });
        return;
      }

      const result = await AdminService.validerMedecin(medecinId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans validerMedecin:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la validation du médecin"
      });
    }
  }

  /**
   * Rejeter un médecin
   */
  static async rejeterMedecin(req: Request, res: Response): Promise<void> {
    try {
      const { medecinId } = req.params;
      const { motif } = req.body;

      if (!medecinId) {
        res.status(400).json({
          success: false,
          error: "ID manquant",
          message: "L'ID du médecin est requis"
        });
        return;
      }

      const result = await AdminService.rejeterMedecin(medecinId, motif);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans rejeterMedecin:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors du rejet du médecin"
      });
    }
  }

  /**
   * Récupérer les statistiques d'administration
   */
  static async getStatistiques(req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.getStatistiques();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans getStatistiques:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération des statistiques"
      });
    }
  }

  /**
   * Récupérer tous les patients
   */
  static async getAllPatients(req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.getAllPatients();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans getAllPatients:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération des patients"
      });
    }
  }

  /**
   * Récupérer tous les utilisateurs
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.getAllUsers();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans getAllUsers:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération des utilisateurs"
      });
    }
  }
}

/**
 * Validateurs pour le rejet d'un médecin
 */
export const rejeterMedecinValidators = [
  body("motif")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Le motif ne peut pas dépasser 500 caractères"),
];