import { Router } from "express";
import { UserStatusController } from "../controllers/UserStatusController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

const router = Router();

/**
 * Routes pour la gestion du statut des utilisateurs
 */

// POST /api/user-status/heartbeat - Heartbeat pour maintenir le statut en ligne
router.post("/heartbeat", authenticateToken, UserStatusController.heartbeat);

// GET /api/user-status/:userId - Récupérer le statut d'un utilisateur
router.get("/:userId", authenticateToken, UserStatusController.getUserStatus);

// POST /api/user-status/multiple - Récupérer le statut de plusieurs utilisateurs
router.post("/multiple", authenticateToken, UserStatusController.getMultipleUserStatus);

export { router as userStatusRoutes };