import { Router } from "express";
import { AuthController, registerValidators, loginValidators } from "../controllers/AuthController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes d'authentification
 */
const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post("/register", registerValidators, AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Connexion d'un utilisateur
 * @access Public
 */
router.post("/login", loginValidators, AuthController.login);

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion d'un utilisateur
 * @access Public
 */
router.post("/logout", AuthController.logout);

/**
 * @route GET /api/auth/profile
 * @desc Récupération du profil utilisateur
 * @access Private
 */
router.get("/profile", authenticateToken, AuthController.getProfile);

/**
 * @route PATCH /api/auth/profile
 * @desc Mise à jour du profil utilisateur
 * @access Private
 */
router.patch("/profile", authenticateToken, AuthController.updateProfile);

/**
 * @route POST /api/auth/2fa/enable
 * @desc Activation du 2FA
 * @access Private
 */
router.post("/2fa/enable", authenticateToken, AuthController.enable2FA);

/**
 * @route POST /api/auth/2fa/disable
 * @desc Désactivation du 2FA
 * @access Private
 */
router.post("/2fa/disable", authenticateToken, AuthController.disable2FA);

/**
 * @route DELETE /api/auth/account
 * @desc Suppression du compte utilisateur
 * @access Private
 */
router.delete("/account", authenticateToken, AuthController.deleteAccount);

/**
 * @route POST /api/auth/forgot-password
 * @desc Demande de réinitialisation du mot de passe
 * @access Public
 */
router.post("/forgot-password", AuthController.requestPasswordReset);

/**
 * @route POST /api/auth/reset-password
 * @desc Réinitialisation du mot de passe avec code de vérification
 * @access Public
 */
router.post("/reset-password", AuthController.resetPassword);

export default router;