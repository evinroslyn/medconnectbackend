import { Router } from "express";
import { PartageMedicalController } from "../controllers/PartageMedicalController";
import { authenticateToken } from "../../infrastructure/auth/middleware";
import { requireUserType } from "../../infrastructure/auth/middleware";

const router = Router();

/**
 * Routes pour la gestion du partage de dossiers et documents médicaux
 * Toutes les routes nécessitent une authentification
 */

// Récupérer tous les médecins validés (pour la sélection lors du partage)
router.get(
  "/medecins",
  authenticateToken,
  requireUserType("patient"),
  PartageMedicalController.getMedecins
);

// Récupérer tous les partages d'un patient
router.get(
  "/",
  authenticateToken,
  requireUserType("patient"),
  PartageMedicalController.getPartages
);

// Créer un nouveau partage
router.post(
  "/",
  authenticateToken,
  requireUserType("patient"),
  PartageMedicalController.createPartage
);

// Révoquer un partage
router.delete(
  "/:id",
  authenticateToken,
  requireUserType("patient"),
  PartageMedicalController.revoquerPartage
);

// Vérifier l'accès (pour les médecins)
router.get(
  "/verifier-acces",
  authenticateToken,
  requireUserType("medecin"),
  PartageMedicalController.verifierAcces
);

export default router;

