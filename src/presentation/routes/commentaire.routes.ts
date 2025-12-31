import { Router } from "express";
import { CommentaireController } from "../controllers/CommentaireController";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des commentaires
 */
const router = Router();

/**
 * @route POST /api/commentaires
 * @desc Crée un commentaire sur un document ou dossier médical
 * @access Private (médecin uniquement)
 */
router.post("/", authenticateToken, CommentaireController.createCommentaire);

/**
 * @route GET /api/commentaires/document/:documentId
 * @desc Récupère les commentaires d'un document médical
 * @access Private (médecin avec accès au dossier)
 */
router.get("/document/:documentId", authenticateToken, CommentaireController.getCommentairesByDocument);

/**
 * @route GET /api/commentaires/dossier/:dossierId
 * @desc Récupère les commentaires d'un dossier médical
 * @access Private (médecin avec accès au dossier)
 */
router.get("/dossier/:dossierId", authenticateToken, CommentaireController.getCommentairesByDossier);

/**
 * @route DELETE /api/commentaires/:id
 * @desc Supprime un commentaire
 * @access Private (médecin auteur uniquement)
 */
router.delete("/:id", authenticateToken, CommentaireController.deleteCommentaire);

export default router;

