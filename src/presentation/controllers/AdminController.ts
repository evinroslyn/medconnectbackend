import { Request, Response } from "express";
import { body } from "express-validator";
import { AdminService } from "../../application/services/AdminService";

/**
 * Contrôleur d'administration
 * Gère les routes d'administration (validation des médecins, statistiques, etc.)
 */
export class AdminController {
  /**
   * Récupérer tous les médecins en attente de validation
   */
  static async getMedecinsEnAttente(_req: Request, res: Response): Promise<void> {
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
   * Récupérer tous les médecins validés
   */
  static async getMedecinsValides(_req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.getMedecinsValides();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans getMedecinsValides:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération des médecins validés"
      });
    }
  }

  /**
   * Récupérer tous les médecins rejetés
   */
  static async getMedecinsRejetes(_req: Request, res: Response): Promise<void> {
    try {
      const result = await AdminService.getMedecinsRejetes();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans getMedecinsRejetes:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération des médecins rejetés"
      });
    }
  }

  /**
   * Valider un médecin
   */
  static async validerMedecin(req: Request, res: Response): Promise<void> {
    try {
      const { medecinId } = req.params;
      const adminId = (req as any).user?.id; // ID de l'admin connecté
      const adresseIP = req.ip || req.connection.remoteAddress;

      if (!medecinId) {
        res.status(400).json({
          success: false,
          error: "ID manquant",
          message: "L'ID du médecin est requis"
        });
        return;
      }

      const result = await AdminService.validerMedecin(medecinId, adminId, adresseIP);

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
      const adminId = (req as any).user?.id; // ID de l'admin connecté
      const adresseIP = req.ip || req.connection.remoteAddress;

      if (!medecinId) {
        res.status(400).json({
          success: false,
          error: "ID manquant",
          message: "L'ID du médecin est requis"
        });
        return;
      }

      const result = await AdminService.rejeterMedecin(medecinId, motif, adminId, adresseIP);

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
   * Récupérer l'historique d'un médecin
   */
  static async getHistoriqueMedecin(req: Request, res: Response): Promise<void> {
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

      const result = await AdminService.getHistoriqueMedecin(medecinId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans getHistoriqueMedecin:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération de l'historique"
      });
    }
  }

  /**
   * Rechercher des médecins avec filtres
   */
  static async rechercherMedecins(req: Request, res: Response): Promise<void> {
    try {
      const { 
        statut, 
        nom, 
        specialite, 
        numeroLicence, 
        dateDebut, 
        dateFin,
        page = 1,
        limit = 10
      } = req.query;

      const result = await AdminService.rechercherMedecins({
        statut: statut as string,
        nom: nom as string,
        specialite: specialite as string,
        numeroLicence: numeroLicence as string,
        dateDebut: dateDebut as string,
        dateFin: dateFin as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans rechercherMedecins:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la recherche"
      });
    }
  }
  static async getStatistiques(_req: Request, res: Response): Promise<void> {
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
  static async getAllPatients(_req: Request, res: Response): Promise<void> {
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
  static async getAllUsers(_req: Request, res: Response): Promise<void> {
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