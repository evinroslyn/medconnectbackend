import { Router } from "express";
import { DossierMedicalController } from "../controllers/DossierMedicalController";
import { upload } from "../../infrastructure/storage/fileStorage";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des dossiers médicaux
 */
const router = Router();

/**
 * @route GET /api/dossiers-medicaux?patientId=xxx
 * @desc Récupère tous les dossiers médicaux d'un patient
 * @access Private (patient uniquement)
 */
router.get("/", authenticateToken, DossierMedicalController.getDossiersByPatient);

/**
 * @route POST /api/dossiers-medicaux
 * @desc Crée un nouveau dossier médical
 * @access Private (patient uniquement)
 */
/**
 * @route POST /api/dossiers-medicaux
 * @desc Crée un nouveau dossier médical (conteneur)
 * @access Private (patient uniquement)
 * Note: Les fichiers sont ajoutés via /api/documents-medicaux
 */
router.post(
  "/",
  authenticateToken,
  DossierMedicalController.createDossier
);

/**
 * @route PATCH /api/dossiers-medicaux/:id/categoriser
 * @desc Catégorise un dossier médical (change son type)
 * @access Private (patient uniquement)
 * Correspond à Patient.categoriserDossier() du diagramme
 * IMPORTANT: Cette route doit être définie AVANT /:id pour éviter les conflits
 */
router.patch(
  "/:id/categoriser",
  authenticateToken,
  DossierMedicalController.categoriserDossier
);

/**
 * @route PATCH /api/dossiers-medicaux/:id/description
 * @desc Ajoute ou met à jour la description d'un dossier médical
 * @access Private (patient uniquement)
 * Correspond à Patient.ajouterDescriptionDossier() du diagramme
 * IMPORTANT: Cette route doit être définie AVANT /:id pour éviter les conflits
 */
router.patch(
  "/:id/description",
  authenticateToken,
  DossierMedicalController.ajouterDescriptionDossier
);

/**
 * @route GET /api/dossiers-medicaux/:id
 * @desc Récupère un dossier médical par son ID
 * @access Private (patient uniquement)
 */
router.get("/:id", authenticateToken, DossierMedicalController.getDossierById);

/**
 * @route PATCH /api/dossiers-medicaux/:id
 * @desc Met à jour un dossier médical
 * @access Private (patient uniquement)
 */
router.patch("/:id", authenticateToken, DossierMedicalController.updateDossier);

/**
 * @route DELETE /api/dossiers-medicaux/:id
 * @desc Supprime un dossier médical
 * @access Private (patient uniquement)
 */
router.delete("/:id", authenticateToken, DossierMedicalController.deleteDossier);

export default router;

