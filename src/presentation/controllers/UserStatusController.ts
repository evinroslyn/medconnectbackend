import { Request, Response } from "express";
import { UserStatusService } from "../../application/services/UserStatusService";

/**
 * Contrôleur pour la gestion du statut des utilisateurs
 */
export class UserStatusController {
  /**
   * Heartbeat - Met à jour la dernière connexion de l'utilisateur
   */
  static async heartbeat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Utilisateur non authentifié",
        });
        return;
      }

      const result = await UserStatusService.updateLastSeen(userId);

      if (result.success) {
        res.json({
          success: true,
          message: "Statut mis à jour",
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans heartbeat:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }

  /**
   * Récupère le statut d'un utilisateur spécifique
   */
  static async getUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: "ID utilisateur requis",
        });
        return;
      }

      const status = await UserStatusService.getUserStatus(userId);

      if (status) {
        res.json(status);
      } else {
        res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération du statut:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }

  /**
   * Récupère le statut de plusieurs utilisateurs
   */
  static async getMultipleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds)) {
        res.status(400).json({
          success: false,
          error: "Liste d'IDs utilisateurs requise",
        });
        return;
      }

      const statuses = await UserStatusService.getMultipleUserStatus(userIds);
      res.json(statuses);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des statuts:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
      });
    }
  }
}