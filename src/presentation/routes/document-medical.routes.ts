import { Router, Request, Response } from "express";
import { DocumentMedicalController } from "../controllers/DocumentMedicalController";
import { upload } from "../../infrastructure/storage/fileStorage";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Routes de gestion des documents médicaux
 */
const router = Router();

// Middleware de logging pour toutes les requêtes vers ce router
router.use((req: Request, res: Response, next: NextFunction) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-medical.routes.ts:12',message:'Router middleware - request received',data:{path:req.path,url:req.url,method:req.method,originalUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  next();
});

/**
 * @route GET /api/documents-medicaux
 * @desc Récupère les documents médicaux (par dossierId ou patientId)
 * @access Private (patient uniquement)
 */
router.get("/", authenticateToken, (req: Request, res: Response) => {
  // Si dossierId est fourni, récupérer les documents du dossier
  if (req.query.dossierId) {
    return DocumentMedicalController.getDocumentsByDossier(req, res);
  }
  // Sinon, récupérer les documents du patient
  return DocumentMedicalController.getDocumentsByPatient(req, res);
});

/**
 * @route POST /api/documents-medicaux
 * @desc Crée un nouveau document médical (avec fichier optionnel)
 * @access Private (patient uniquement)
 */
router.post(
  "/",
  authenticateToken,
  (req, res, next) => {
    console.log(`[UPLOAD] POST /api/documents-medicaux - Content-Type: ${req.headers["content-type"]}`);
    next();
  },
  upload.single("fichier"),
  (err: any, req: any, res: any, next: any) => {
    // Gestion des erreurs multer
    if (err) {
      console.error("[UPLOAD] Multer error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "Fichier trop volumineux",
          message: "Le fichier dépasse la taille maximale autorisée (10MB)",
        });
      }
      if (err.message === "Type de fichier non autorisé") {
        return res.status(400).json({
          error: "Type de fichier invalide",
          message: err.message,
        });
      }
      return res.status(400).json({
        error: "Erreur lors de l'upload",
        message: err.message,
      });
    }
    next();
  },
  DocumentMedicalController.createDocument
);

// Routes spécifiques AVANT la route générale /:id (important pour Express)
/**
 * @route GET /api/documents-medicaux/:id/view
 * @desc Visualise un document médical (sans téléchargement, même si les droits de téléchargement ne sont pas autorisés)
 * @access Private (patient ou médecin avec accès)
 */
router.get("/:id/view", authenticateToken, (req: Request, res: Response) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'document-medical.routes.ts:70',message:'Route /:id/view matched',data:{documentId:req.params.id,url:req.url,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  DocumentMedicalController.viewDocument(req, res);
});

/**
 * @route GET /api/documents-medicaux/:id/download
 * @desc Télécharge le fichier d'un document médical (nécessite la permission de téléchargement)
 * @access Private (patient ou médecin avec permission de téléchargement)
 */
router.get("/:id/download", authenticateToken, DocumentMedicalController.downloadDocument);

/**
 * @route GET /api/documents-medicaux/:id
 * @desc Récupère un document médical par son ID
 * @access Private (patient uniquement)
 */
router.get("/:id", authenticateToken, DocumentMedicalController.getDocumentById);

/**
 * @route PATCH /api/documents-medicaux/:id
 * @desc Met à jour un document médical
 * @access Private (patient uniquement)
 */
router.patch("/:id", authenticateToken, DocumentMedicalController.updateDocument);

/**
 * @route DELETE /api/documents-medicaux/:id
 * @desc Supprime un document médical
 * @access Private (patient uniquement)
 */
router.delete("/:id", authenticateToken, DocumentMedicalController.deleteDocument);

export default router;

