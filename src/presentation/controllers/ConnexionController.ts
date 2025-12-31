import { Request, Response } from "express";
import { ConnexionService } from "../../application/services/ConnexionService";

/**
 * Contrôleur de gestion des connexions
 */
export class ConnexionController {
  /**
   * Envoie une demande de connexion
   * POST /api/connexions
   */
  static async sendRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      // Seuls les patients peuvent envoyer des demandes
      if (userType !== "patient") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les patients peuvent envoyer des demandes de connexion",
        });
        return;
      }

      const { idMedecin } = req.body;

      if (!idMedecin) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "L'ID du médecin est requis",
        });
        return;
      }

      const result = await ConnexionService.sendConnexionRequest(userId, idMedecin);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans sendRequest:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Accepte une demande de connexion
   * PATCH /api/connexions/:id/accept
   */
  static async acceptRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      // Seuls les médecins peuvent accepter
      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent accepter les demandes",
        });
        return;
      }

      const connexionId = req.params.id;
      const result = await ConnexionService.acceptConnexion(connexionId, userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans acceptRequest:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Refuse ou révoque une connexion
   * PATCH /api/connexions/:id/reject
   */
  static async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;
      const connexionId = req.params.id;

      const result = await ConnexionService.rejectConnexion(connexionId, userId, userType);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans rejectRequest:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère les connexions d'un patient
   * GET /api/connexions?patientId=xxx
   */
  static async getConnexions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;
      const patientId = req.query.patientId as string;

      // Vérifier que l'utilisateur peut accéder à ces connexions
      if (userType === "patient" && userId !== patientId) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Vous ne pouvez accéder qu'à vos propres connexions",
        });
        return;
      }

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: "Paramètre manquant",
          message: "Le paramètre patientId est requis",
        });
        return;
      }

      const result = await ConnexionService.getConnexionsByPatient(patientId);

      if (result.success) {
        res.status(200).json(result.data || []);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans getConnexions:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère les demandes en attente pour un médecin
   * GET /api/connexions/pending
   */
  static async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent voir les demandes en attente",
        });
        return;
      }

      const result = await ConnexionService.getPendingRequestsByMedecin(userId);

      if (result.success) {
        res.status(200).json(result.data || []);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans getPendingRequests:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère les patients connectés à un médecin
   * GET /api/connexions/medecin
   */
  static async getPatientsByMedecin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent voir leurs patients",
        });
        return;
      }

      const result = await ConnexionService.getPatientsByMedecin(userId);

      if (result.success) {
        res.status(200).json(result.data || []);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans getPatientsByMedecin:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }
}

