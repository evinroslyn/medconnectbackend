import { Router } from "express";
import { AllergieTraitementController } from "../controllers/AllergieTraitementController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes pour gérer les allergies et traitements des patients
 */
const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * @route GET /api/patients/:id/allergies
 * @desc Récupère toutes les allergies d'un patient
 * @access Private (Médecin)
 */
router.get("/patients/:id/allergies", AllergieTraitementController.getAllergies);

/**
 * @route POST /api/patients/:id/allergies
 * @desc Ajoute une allergie à un patient
 * @access Private (Médecin)
 */
router.post("/patients/:id/allergies", AllergieTraitementController.addAllergie);

/**
 * @route PUT /api/allergies/:id
 * @desc Met à jour une allergie
 * @access Private (Médecin)
 */
router.put("/allergies/:id", AllergieTraitementController.updateAllergie);

/**
 * @route DELETE /api/allergies/:id
 * @desc Supprime une allergie
 * @access Private (Médecin)
 */
router.delete("/allergies/:id", AllergieTraitementController.deleteAllergie);

/**
 * @route GET /api/patients/:id/traitements
 * @desc Récupère tous les traitements d'un patient
 * @access Private (Médecin)
 */
router.get("/patients/:id/traitements", AllergieTraitementController.getTraitements);

/**
 * @route POST /api/patients/:id/traitements
 * @desc Ajoute un traitement à un patient
 * @access Private (Médecin)
 */
router.post("/patients/:id/traitements", AllergieTraitementController.addTraitement);

/**
 * @route PUT /api/traitements/:id
 * @desc Met à jour un traitement
 * @access Private (Médecin)
 */
router.put("/traitements/:id", AllergieTraitementController.updateTraitement);

/**
 * @route DELETE /api/traitements/:id
 * @desc Supprime un traitement
 * @access Private (Médecin)
 */
router.delete("/traitements/:id", AllergieTraitementController.deleteTraitement);

export default router;

