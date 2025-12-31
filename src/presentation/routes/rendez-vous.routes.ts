import { Router } from "express";
import { RendezVousController } from "../controllers/RendezVousController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des rendez-vous et disponibilités
 */
const router = Router();

/**
 * @route GET /api/rendez-vous/disponibilites/public
 * @desc Récupère toutes les disponibilités actives publiées (pour les patients)
 * @access Private (patient ou médecin)
 */
router.get("/disponibilites/public", authenticateToken, RendezVousController.getDisponibilitesPublic);

/**
 * @route GET /api/rendez-vous/disponibilites
 * @desc Récupère les disponibilités du médecin connecté
 * @access Private (médecin uniquement)
 */
router.get("/disponibilites", authenticateToken, RendezVousController.getDisponibilites);

/**
 * @route POST /api/rendez-vous/disponibilites
 * @desc Crée une nouvelle disponibilité
 * @access Private (médecin uniquement)
 */
router.post("/disponibilites", authenticateToken, RendezVousController.createDisponibilite);

/**
 * @route PATCH /api/rendez-vous/disponibilites/:id
 * @desc Met à jour une disponibilité
 * @access Private (médecin uniquement)
 */
router.patch("/disponibilites/:id", authenticateToken, RendezVousController.updateDisponibilite);

/**
 * @route DELETE /api/rendez-vous/disponibilites/:id
 * @desc Supprime une disponibilité
 * @access Private (médecin uniquement)
 */
router.delete("/disponibilites/:id", authenticateToken, RendezVousController.deleteDisponibilite);

/**
 * @route GET /api/rendez-vous/medecin
 * @desc Récupère les rendez-vous du médecin connecté
 * @access Private (médecin uniquement)
 */
router.get("/medecin", authenticateToken, RendezVousController.getRendezVousMedecin);

/**
 * @route POST /api/rendez-vous
 * @desc Crée un nouveau rendez-vous
 * @access Private (patient ou médecin)
 */
router.post("/", authenticateToken, RendezVousController.createRendezVous);

/**
 * @route PATCH /api/rendez-vous/:id/annuler
 * @desc Annule un rendez-vous
 * @access Private (patient ou médecin concerné)
 */
router.patch("/:id/annuler", authenticateToken, RendezVousController.annulerRendezVous);

export default router;
