import { Router } from "express";
import { PatientController } from "../controllers/PatientController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des patients
 */
const router = Router();

/**
 * @route GET /api/patients/:id
 * @desc Récupère un patient par son ID
 * @access Private (patient lui-même ou médecin avec connexion acceptée)
 */
router.get("/:id", authenticateToken, PatientController.getPatientById);

export default router;

