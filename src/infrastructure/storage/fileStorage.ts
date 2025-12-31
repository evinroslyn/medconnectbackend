import multer from "multer";
import path from "path";
import fs from "fs/promises";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Configuration du stockage de fichiers local
 */
const uploadDir = process.env.UPLOAD_DIR || "uploads";
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB par défaut

/**
 * Configuration de Multer pour le stockage des fichiers
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), uploadDir);
    
    // Créer le dossier s'il n'existe pas
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

/**
 * Filtre pour les types de fichiers autorisés
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Types de fichiers médicaux autorisés
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'));
  }
};

/**
 * Configuration Multer
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize
  }
});

/**
 * Service de gestion des fichiers
 */
export class FileStorageService {
  /**
   * Supprime un fichier du système de fichiers
   * @param filename - Nom du fichier à supprimer
   */
  static async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), uploadDir, filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw new Error('Impossible de supprimer le fichier');
    }
  }

  /**
   * Vérifie si un fichier existe
   * @param filename - Nom du fichier à vérifier
   * @returns true si le fichier existe
   */
  static async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(process.cwd(), uploadDir, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtient le chemin complet d'un fichier
   * @param filename - Nom du fichier
   * @returns Chemin complet du fichier
   */
  static getFilePath(filename: string): string {
    return path.join(process.cwd(), uploadDir, filename);
  }

  /**
   * Obtient l'URL publique d'un fichier
   * @param filename - Nom du fichier
   * @returns URL publique du fichier
   */
  static getFileUrl(filename: string): string {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return `${baseUrl}/uploads/${filename}`;
  }
}