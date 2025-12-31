import { Router } from "express";
import { MessageController } from "../controllers/MessageController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des messages
 */
const router = Router();

/**
 * @route POST /api/messages
 * @desc Envoie un message
 * @access Private (médecin ou patient)
 */
router.post("/", authenticateToken, MessageController.sendMessage);

/**
 * @route GET /api/messages/conversations
 * @desc Récupère toutes les conversations de l'utilisateur
 * @access Private
 */
router.get("/conversations", authenticateToken, MessageController.getConversations);

/**
 * @route GET /api/messages/conversation/:autreUtilisateurId
 * @desc Récupère une conversation avec un utilisateur spécifique
 * @access Private
 */
router.get("/conversation/:autreUtilisateurId", authenticateToken, MessageController.getConversation);

/**
 * @route PATCH /api/messages/:id/read
 * @desc Marque un message comme lu
 * @access Private
 */
router.patch("/:id/read", authenticateToken, MessageController.markAsRead);

export default router;

