import { Request, Response } from "express";
import { MessageService } from "../../application/services/MessageService";

/**
 * Contrôleur de gestion des messages
 */
export class MessageController {
  /**
   * Envoie un message
   * POST /api/messages
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const expediteurId = req.user.userId;
      const userType = req.user.typeUtilisateur;
      const { destinataireId, contenu } = req.body;

      console.log(`[MessageController] Envoi message: Expéditeur ${expediteurId} (${userType}) -> Destinataire ${destinataireId}`);

      if (!destinataireId || !contenu) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "Le destinataire et le contenu sont requis",
        });
        return;
      }

      const result = await MessageService.sendMessage(expediteurId, destinataireId, contenu);

      if (result.success) {
        console.log(`[MessageController] Message envoyé avec succès: ${result.data?.id}`);
        res.status(201).json(result.data);
      } else {
        console.error(`[MessageController] Erreur envoi message: ${result.error} - ${result.message}`);
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans sendMessage:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère une conversation
   * GET /api/messages/conversation/:autreUtilisateurId
   */
  static async getConversation(req: Request, res: Response): Promise<void> {
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
      const autreUtilisateurId = req.params.autreUtilisateurId;

      console.log(`[MessageController] Récupération conversation: User ${userId} (${userType}) <-> ${autreUtilisateurId}`);
      console.log(`[MessageController] Requête depuis: ${req.headers.origin || 'unknown'}`);

      if (!autreUtilisateurId) {
        res.status(400).json({
          success: false,
          error: "Paramètre manquant",
          message: "L'ID de l'autre utilisateur est requis",
        });
        return;
      }

      const result = await MessageService.getConversation(userId, autreUtilisateurId);

      if (result.success) {
        console.log(`[MessageController] ${result.data?.length || 0} messages récupérés pour ${userType} ${userId}`);
        if (result.data && result.data.length > 0) {
          console.log(`[MessageController] Premier message: Expéditeur ${result.data[0].emetteurId}, Destinataire ${result.data[0].destinataireId}`);
        }
        res.status(200).json(result.data || []);
      } else {
        console.error(`[MessageController] Erreur récupération conversation: ${result.error} - ${result.message}`);
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur dans getConversation:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère toutes les conversations
   * GET /api/messages/conversations
   */
  static async getConversations(req: Request, res: Response): Promise<void> {
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
      const result = await MessageService.getConversations(userId);

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
      console.error("Erreur dans getConversations:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Marque un message comme lu
   * PATCH /api/messages/:id/read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
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
      const messageId = req.params.id;

      const result = await MessageService.markAsRead(messageId, userId);

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
      console.error("Erreur dans markAsRead:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }
}

