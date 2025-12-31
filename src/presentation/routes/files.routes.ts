import { Router } from "express";
import { FileController } from "../controllers/FileController";
import { upload } from "../../infrastructure/storage/fileStorage";
import { authenticateToken, optionalAuth } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des fichiers
 */
const router = Router();

/**
 * @route POST /api/files/upload/document-identite
 * @desc Upload d'un document d'identité (CNI/Passeport) pour les médecins
 * @access Public (pour l'inscription)
 */
router.post(
  "/upload/document-identite",
  optionalAuth,
  upload.single("documentIdentite"),
  FileController.uploadDocumentIdentite
);

/**
 * @route POST /api/files/upload/document-medical
 * @desc Upload d'un document médical
 * @access Private
 */
router.post(
  "/upload/document-medical",
  authenticateToken,
  upload.single("documentMedical"),
  FileController.uploadDocumentMedical
);

/**
 * @route POST /api/files/upload/diplome
 * @desc Upload d'un diplôme pour les médecins
 * @access Public (pour l'inscription)
 */
router.post(
  "/upload/diplome",
  optionalAuth,
  upload.single("diplome"),
  FileController.uploadDiplome
);

/**
 * @route POST /api/files/upload/photo-profil
 * @desc Upload d'une photo de profil pour les médecins
 * @access Public (pour l'inscription)
 */
router.post(
  "/upload/photo-profil",
  optionalAuth,
  upload.single("photoProfil"),
  FileController.uploadPhotoProfil
);

/**
 * @route DELETE /api/files/:filename
 * @desc Supprimer un fichier
 * @access Private
 */
router.delete("/:filename", authenticateToken, FileController.deleteFile);

/**
 * @route GET /api/files/:filename/info
 * @desc Récupérer les informations d'un fichier
 * @access Private
 */
router.get("/:filename/info", authenticateToken, FileController.getFileInfo);

export default router;