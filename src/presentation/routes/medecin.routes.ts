import { Router } from "express";
import { MedecinController } from "../controllers/MedecinController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des médecins
 */
const router = Router();

/**
 * @route GET /api/medecins
 * @desc Recherche des médecins par nom, spécialité ou emplacement
 * @access Private
 */
router.get("/", authenticateToken, MedecinController.searchMedecins);

/**
 * @route GET /api/medecins/:id
 * @desc Récupère un médecin par son ID
 * @access Private
 */
router.get("/:id", authenticateToken, MedecinController.getMedecinById);

export default router;

