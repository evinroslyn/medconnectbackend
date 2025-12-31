import { Request, Response } from "express";
import { FileStorageService } from "../../infrastructure/storage/fileStorage";
import path from "path";

/**
 * Normalise un chemin de fichier pour qu'il soit relatif et utilise des slashes
 * @param filePath - Chemin complet du fichier
 * @returns Chemin normalisé (ex: /uploads/filename.jpg)
 */
function normalizeFilePath(filePath: string): string {
  // Extraire le nom du fichier depuis le chemin complet
  const filename = path.basename(filePath);
  // Retourner le chemin relatif avec des slashes
  return `/uploads/${filename}`;
}

/**
 * Contrôleur de gestion des fichiers
 * Gère l'upload et la gestion des fichiers (documents d'identité, documents médicaux, etc.)
 */
export class FileController {
  /**
   * Upload d'un document d'identité pour un médecin
   */
  static async uploadDocumentIdentite(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Fichier manquant",
          message: "Aucun fichier n'a été téléchargé"
        });
        return;
      }

      // Vérifier le type de fichier (images et PDF uniquement)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error: "Type de fichier invalide",
          message: "Seuls les fichiers JPEG, PNG, GIF et PDF sont autorisés"
        });
        return;
      }

      const fileUrl = FileStorageService.getFileUrl(req.file.filename);
      const normalizedPath = normalizeFilePath(req.file.path);

      res.status(200).json({
        success: true,
        message: "Document d'identité téléchargé avec succès",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          path: normalizedPath
        }
      });
    } catch (error) {
      console.error("Erreur lors de l'upload du document d'identité:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors du téléchargement du fichier"
      });
    }
  }

  /**
   * Upload d'un document médical
   */
  static async uploadDocumentMedical(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Fichier manquant",
          message: "Aucun fichier n'a été téléchargé"
        });
        return;
      }

      const fileUrl = FileStorageService.getFileUrl(req.file.filename);
      const normalizedPath = normalizeFilePath(req.file.path);

      res.status(200).json({
        success: true,
        message: "Document médical téléchargé avec succès",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          path: normalizedPath
        }
      });
    } catch (error) {
      console.error("Erreur lors de l'upload du document médical:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors du téléchargement du fichier"
      });
    }
  }

  /**
   * Upload d'un diplôme pour un médecin
   */
  static async uploadDiplome(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Fichier manquant",
          message: "Aucun fichier n'a été téléchargé"
        });
        return;
      }

      // Vérifier le type de fichier (PDF et images uniquement)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error: "Type de fichier invalide",
          message: "Seuls les fichiers PDF, JPEG, PNG et GIF sont autorisés"
        });
        return;
      }

      const fileUrl = FileStorageService.getFileUrl(req.file.filename);
      const normalizedPath = normalizeFilePath(req.file.path);

      res.status(200).json({
        success: true,
        message: "Diplôme téléchargé avec succès",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          path: normalizedPath
        }
      });
    } catch (error) {
      console.error("Erreur lors de l'upload du diplôme:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors du téléchargement du fichier"
      });
    }
  }

  /**
   * Upload d'une photo de profil pour un médecin
   */
  static async uploadPhotoProfil(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Fichier manquant",
          message: "Aucun fichier n'a été téléchargé"
        });
        return;
      }

      // Vérifier le type de fichier (images uniquement)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error: "Type de fichier invalide",
          message: "Seuls les fichiers JPEG, PNG, GIF et WEBP sont autorisés"
        });
        return;
      }

      const fileUrl = FileStorageService.getFileUrl(req.file.filename);
      const normalizedPath = normalizeFilePath(req.file.path);

      res.status(200).json({
        success: true,
        message: "Photo de profil téléchargée avec succès",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          path: normalizedPath
        }
      });
    } catch (error) {
      console.error("Erreur lors de l'upload de la photo de profil:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors du téléchargement du fichier"
      });
    }
  }

  /**
   * Supprimer un fichier
   */
  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          success: false,
          error: "Nom de fichier manquant",
          message: "Le nom du fichier est requis"
        });
        return;
      }

      // Vérifier si le fichier existe
      const fileExists = await FileStorageService.fileExists(filename);
      if (!fileExists) {
        res.status(404).json({
          success: false,
          error: "Fichier non trouvé",
          message: "Le fichier spécifié n'existe pas"
        });
        return;
      }

      await FileStorageService.deleteFile(filename);

      res.status(200).json({
        success: true,
        message: "Fichier supprimé avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la suppression du fichier"
      });
    }
  }

  /**
   * Récupérer les informations d'un fichier
   */
  static async getFileInfo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          success: false,
          error: "Nom de fichier manquant",
          message: "Le nom du fichier est requis"
        });
        return;
      }

      const fileExists = await FileStorageService.fileExists(filename);
      if (!fileExists) {
        res.status(404).json({
          success: false,
          error: "Fichier non trouvé",
          message: "Le fichier spécifié n'existe pas"
        });
        return;
      }

      const fileUrl = FileStorageService.getFileUrl(filename);
      const filePath = FileStorageService.getFilePath(filename);

      res.status(200).json({
        success: true,
        message: "Informations du fichier récupérées avec succès",
        data: {
          filename,
          url: fileUrl,
          path: filePath
        }
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des informations du fichier:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération des informations du fichier"
      });
    }
  }
}