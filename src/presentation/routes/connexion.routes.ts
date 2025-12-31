import { Router } from "express";
import { ConnexionController } from "../controllers/ConnexionController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des connexions
 */
const router = Router();

/**
 * @route POST /api/connexions
 * @desc Envoie une demande de connexion d'un patient à un médecin
 * @access Private (patient uniquement)
 */
router.post("/", authenticateToken, ConnexionController.sendRequest);

/**
 * @route GET /api/connexions
 * @desc Récupère les connexions d'un patient
 * @access Private (patient uniquement)
 */
router.get("/", authenticateToken, ConnexionController.getConnexions);

/**
 * @route GET /api/connexions/pending
 * @desc Récupère les demandes en attente pour un médecin
 * @access Private (médecin uniquement)
 */
router.get("/pending", authenticateToken, ConnexionController.getPendingRequests);

/**
 * @route GET /api/connexions/medecin
 * @desc Récupère les patients connectés à un médecin
 * @access Private (médecin uniquement)
 */
router.get("/medecin", authenticateToken, ConnexionController.getPatientsByMedecin);

/**
 * @route PATCH /api/connexions/:id/accept
 * @desc Accepte une demande de connexion
 * @access Private (médecin uniquement)
 */
router.patch("/:id/accept", authenticateToken, ConnexionController.acceptRequest);

/**
 * @route PATCH /api/connexions/:id/reject
 * @desc Refuse ou révoque une connexion
 * @access Private (patient ou médecin)
 */
router.patch("/:id/reject", authenticateToken, ConnexionController.rejectRequest);

export default router;

