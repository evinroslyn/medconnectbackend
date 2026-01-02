import { Router } from "express";
import { AdminController, rejeterMedecinValidators } from "../controllers/AdminController";
import { authenticateToken, requireAdmin } from "../../infrastructure/auth/middleware";

/**
 * Routes d'administration
 */
const router = Router();

// Toutes les routes d'administration nécessitent une authentification et le rôle administrateur
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route GET /api/admin/statistiques
 * @desc Récupérer les statistiques d'administration
 * @access Admin
 */
router.get("/statistiques", AdminController.getStatistiques);

/**
 * @route GET /api/admin/patients
 * @desc Récupérer tous les patients
 * @access Admin
 */
router.get("/patients", AdminController.getAllPatients);

/**
 * @route GET /api/admin/utilisateurs
 * @desc Récupérer tous les utilisateurs
 * @access Admin
 */
router.get("/utilisateurs", AdminController.getAllUsers);

/**
 * @route GET /api/admin/medecins/en-attente
 * @desc Récupérer tous les médecins en attente de validation
 * @access Admin
 */
router.get("/medecins/en-attente", AdminController.getMedecinsEnAttente);

/**
 * @route GET /api/admin/medecins/valides
 * @desc Récupérer tous les médecins validés
 * @access Admin
 */
router.get("/medecins/valides", AdminController.getMedecinsValides);

/**
 * @route GET /api/admin/medecins/rejetes
 * @desc Récupérer tous les médecins rejetés
 * @access Admin
 */
router.get("/medecins/rejetes", AdminController.getMedecinsRejetes);

/**
 * @route PATCH /api/admin/medecins/:medecinId/valider
 * @desc Valider un médecin
 * @access Admin
 */
router.patch("/medecins/:medecinId/valider", AdminController.validerMedecin);

/**
 * @route PATCH /api/admin/medecins/:medecinId/rejeter
 * @desc Rejeter un médecin
 * @access Admin
 */
router.patch("/medecins/:medecinId/rejeter", rejeterMedecinValidators, AdminController.rejeterMedecin);

/**
 * @route GET /api/admin/medecins/:medecinId/historique
 * @desc Récupérer l'historique d'un médecin
 * @access Admin
 */
router.get("/medecins/:medecinId/historique", AdminController.getHistoriqueMedecin);

/**
 * @route GET /api/admin/medecins/rechercher
 * @desc Rechercher des médecins avec filtres
 * @access Admin
 */
router.get("/medecins/rechercher", AdminController.rechercherMedecins);

export default router;