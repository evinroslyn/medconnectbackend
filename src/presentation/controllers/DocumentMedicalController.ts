import { Request, Response } from "express";
import { DocumentMedicalService } from "../../application/services/DocumentMedicalService";
import { FileStorageService } from "../../infrastructure/storage/fileStorage";
import { TypeEnregistrement } from "../../domain/enums";

/**
 * Contrôleur pour la gestion des documents médicaux
 */
export class DocumentMedicalController {
  /**
   * Récupère tous les documents d'un dossier médical
   * GET /api/documents-medicaux?dossierId=xxx
   * Accessible par le patient ou un médecin avec accès au dossier
   */
  static async getDocumentsByDossier(req: Request, res: Response): Promise<void> {
    try {
      const dossierId = req.query.dossierId as string;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.typeUtilisateur;

      if (!dossierId) {
        res.status(400).json({
          error: "Données manquantes",
          message: "L'ID du dossier médical est requis",
        });
        return;
      }

      // Vérifier l'accès au dossier d'abord
      const { DossierMedicalService } = await import("../../application/services/DossierMedicalService");
      const dossierResult = await DossierMedicalService.getDossierById(dossierId);
      
      if (!dossierResult.success || !dossierResult.data) {
        res.status(404).json({
          error: "Dossier non trouvé",
          message: "Le dossier médical spécifié n'existe pas",
        });
        return;
      }

      // Si c'est le patient lui-même, accès direct
      if (userType === "patient" && userId === dossierResult.data.idPatient) {
        const result = await DocumentMedicalService.getDocumentsByDossier(dossierId);
        if (result.success) {
          res.status(200).json(result.data || []);
        } else {
          res.status(500).json({
            error: result.error || "Erreur lors de la récupération des documents",
            message: result.message,
          });
        }
        return;
      }

      // Si c'est un médecin, vérifier l'accès au dossier via PartageMedicalService
      if (userType === "medecin") {
        const { PartageMedicalService } = await import("../../application/services/PartageMedicalService");
        const acces = await PartageMedicalService.verifierAcces(userId, "dossier", dossierId);
        
        if (acces.hasAccess) {
          const result = await DocumentMedicalService.getDocumentsByDossier(dossierId);
          if (result.success) {
            res.status(200).json(result.data || []);
          } else {
            res.status(500).json({
              error: result.error || "Erreur lors de la récupération des documents",
              message: result.message,
            });
          }
        } else {
          res.status(403).json({
            error: "Accès refusé",
            message: "Vous n'avez pas accès à ce dossier médical",
          });
        }
        return;
      }

      // Accès refusé pour les autres types d'utilisateurs
      res.status(403).json({
        error: "Accès refusé",
        message: "Vous n'avez pas accès à ces documents",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Récupère tous les documents d'un patient
   * GET /api/documents-medicaux?patientId=xxx
   */
  static async getDocumentsByPatient(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string;
      const userId = (req as any).user?.userId;

      if (!patientId) {
        res.status(400).json({
          error: "Données manquantes",
          message: "L'ID du patient est requis",
        });
        return;
      }

      // Vérifier que le patientId correspond à l'utilisateur authentifié
      if (userId !== patientId && (req as any).user?.typeUtilisateur !== "administrateur") {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ces documents",
        });
        return;
      }

      const result = await DocumentMedicalService.getDocumentsByPatient(patientId);
      if (result.success) {
        // Toujours retourner un tableau, même si vide
        res.status(200).json(result.data || []);
      } else {
        console.error("[DocumentMedicalController] Erreur getDocumentsByPatient:", result.error, result.message);
        res.status(500).json({
          error: result.error || "Erreur lors de la récupération des documents",
          message: result.message || "Une erreur est survenue lors du chargement des documents",
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Récupère un document médical par son ID
   * GET /api/documents-medicaux/:id
   * Accessible par le patient ou un médecin avec accès
   */
  static async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.typeUtilisateur;

      const result = await DocumentMedicalService.getDocumentById(documentId);
      if (!result.success || !result.data) {
        res.status(404).json({
          error: result.error,
          message: result.message,
        });
        return;
      }

      // Si c'est le patient lui-même, accès direct
      if (userType === "patient" && userId === result.data.idPatient) {
        res.status(200).json(result.data);
        return;
      }

      // Si c'est un médecin, vérifier l'accès via PartageMedicalService au niveau du DOSSIER parent
      // car le partage est créé au niveau du dossier, pas du document
      if (userType === "medecin") {
        const { PartageMedicalService } = await import("../../application/services/PartageMedicalService");
        const dossierId = result.data.idDossierMedical;
        const acces = await PartageMedicalService.verifierAcces(userId, "dossier", dossierId);
        
        if (acces.hasAccess) {
          res.status(200).json(result.data);
        } else {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce document",
        });
        }
        return;
      }

      // Si c'est un administrateur, accès direct
      if (userType === "administrateur") {
      res.status(200).json(result.data);
        return;
      }

      // Accès refusé pour les autres types d'utilisateurs
      res.status(403).json({
        error: "Accès refusé",
        message: "Vous n'avez pas accès à ce document",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Crée un nouveau document médical
   * POST /api/documents-medicaux
   */
  static async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          error: "Non authentifié",
          message: "Vous devez être connecté pour créer un document",
        });
        return;
      }

      const { idDossierMedical, idPatient, nom, type, description } = req.body;
      const file = req.file;

      if (!idDossierMedical || !idPatient || !nom || !type) {
        res.status(400).json({
          error: "Données manquantes",
          message: "Les champs idDossierMedical, idPatient, nom et type sont requis",
        });
        return;
      }

      // Vérifier que l'utilisateur crée un document pour lui-même
      if (idPatient !== userId && (req as any).user?.typeUtilisateur !== "administrateur") {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous ne pouvez créer un document que pour vous-même",
        });
        return;
      }

      // Gérer le fichier uploadé si présent
      let fichierPath: string | undefined;
      if (file) {
        fichierPath = FileStorageService.getFileUrl(file.filename);
      }

      const result = await DocumentMedicalService.createDocument(
        {
          idDossierMedical,
          idPatient,
          nom,
          type: type as TypeEnregistrement,
          description,
        },
        fichierPath
      );

      if (result.success && result.data) {
        res.status(201).json(result.data);
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de la création du document",
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de la création du document médical:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Met à jour un document médical
   * PATCH /api/documents-medicaux/:id
   */
  static async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      const userId = (req as any).user?.userId;

      // Vérifier que le document existe et appartient à l'utilisateur
      const document = await DocumentMedicalService.getDocumentById(documentId);
      if (!document.success || !document.data) {
        res.status(404).json(document);
        return;
      }

      if (document.data.idPatient !== userId && (req as any).user?.typeUtilisateur !== "administrateur") {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce document",
        });
        return;
      }

      const updates = req.body;
      const result = await DocumentMedicalService.updateDocument(documentId, updates);

      if (result.success && result.data) {
        res.status(200).json(result.data);
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de la mise à jour du document",
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Supprime un document médical
   * DELETE /api/documents-medicaux/:id
   */
  static async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      const userId = (req as any).user?.userId;

      // Vérifier que le document existe et appartient à l'utilisateur
      const document = await DocumentMedicalService.getDocumentById(documentId);
      if (!document.success || !document.data) {
        res.status(404).json(document);
        return;
      }

      if (document.data.idPatient !== userId && (req as any).user?.typeUtilisateur !== "administrateur") {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce document",
        });
        return;
      }

      const result = await DocumentMedicalService.deleteDocument(documentId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de la suppression du document",
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Télécharge un fichier de document médical
   * GET /api/documents-medicaux/:id/download
   */
  static async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.id;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.typeUtilisateur;

      const result = await DocumentMedicalService.getDocumentById(documentId);
      if (!result.success || !result.data) {
        res.status(404).json({
          error: result.error,
          message: result.message,
        });
        return;
      }

      // Si c'est le patient lui-même, accès direct
      if (userType === "patient" && userId === result.data.idPatient) {
        // Le patient peut toujours télécharger ses propres documents
      } else if (userType === "medecin") {
        // Pour les médecins, vérifier les permissions de partage au niveau du DOSSIER parent
        // car le partage est créé au niveau du dossier, pas du document
        const { PartageMedicalService } = await import("../../application/services/PartageMedicalService");
        const dossierId = result.data.idDossierMedical;
        const acces = await PartageMedicalService.verifierAcces(userId, "dossier", dossierId);
        
        if (!acces.hasAccess) {
          res.status(403).json({
            error: "Accès refusé",
            message: "Vous n'avez pas accès à ce document",
          });
          return;
        }

        // Vérifier si le téléchargement est autorisé
        if (!acces.peutTelecharger) {
          res.status(403).json({
            error: "Téléchargement non autorisé",
            message: "Vous n'avez pas la permission de télécharger ce document. Vous pouvez uniquement le consulter.",
          });
          return;
        }
      } else if (userType !== "administrateur") {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce document",
        });
        return;
      }

      // Vérifier que le fichier existe
      if (!result.data.cheminFichier) {
        res.status(404).json({
          error: "Fichier introuvable",
          message: "Aucun fichier associé à ce document",
        });
        return;
      }

      // Extraire le nom du fichier depuis le chemin
      // Le chemin peut être soit une URL complète (http://...) soit juste un nom de fichier
      let filename: string;
      if (result.data.cheminFichier.includes("/")) {
        // Si c'est une URL, extraire le nom du fichier
        filename = result.data.cheminFichier.split("/").pop() || "document";
      } else {
        // Sinon, c'est déjà un nom de fichier
        filename = result.data.cheminFichier;
      }
      const filePath = FileStorageService.getFilePath(filename);

      // Vérifier que le fichier existe physiquement
      const fileExists = await FileStorageService.fileExists(filename);
      if (!fileExists) {
        res.status(404).json({
          error: "Fichier introuvable",
          message: "Le fichier n'existe pas sur le serveur",
        });
        return;
      }

      // Déterminer le type MIME du fichier
      const fileExtension = filename.toLowerCase().split(".").pop();
      let contentType = "application/octet-stream";
      
      if (fileExtension === "pdf") {
        contentType = "application/pdf";
      } else if (["jpg", "jpeg"].includes(fileExtension || "")) {
        contentType = "image/jpeg";
      } else if (fileExtension === "png") {
        contentType = "image/png";
      } else if (fileExtension === "gif") {
        contentType = "image/gif";
      } else if (fileExtension === "webp") {
        contentType = "image/webp";
      }

      // Définir les headers CORS pour permettre l'accès depuis le mobile
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`); // inline pour permettre la prévisualisation
      
      // Envoyer le fichier
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Erreur lors du téléchargement du fichier:", err);
          if (!res.headersSent) {
            res.status(500).json({
              error: "Erreur serveur",
              message: "Impossible de télécharger le fichier",
            });
          }
        }
      });
    } catch (error: any) {
      console.error("Erreur lors du téléchargement du document:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Visualise un fichier de document médical (sans téléchargement)
   * GET /api/documents-medicaux/:id/view
   * Permet la visualisation même si le téléchargement n'est pas autorisé
   */
  static async viewDocument(req: Request, res: Response): Promise<void> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:490',message:'viewDocument method called',data:{documentId:req.params.id,userId:(req as any).user?.userId,userType:(req as any).user?.typeUtilisateur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    try {
      const documentId = req.params.id;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.typeUtilisateur;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:496',message:'Before getDocumentById call',data:{documentId,userId,userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      const result = await DocumentMedicalService.getDocumentById(documentId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:497',message:'After getDocumentById call',data:{documentId,success:result.success,hasData:!!result.data,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      if (!result.success || !result.data) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:498',message:'Document not found, returning 404',data:{documentId,error:result.error,message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        res.status(404).json({
          error: result.error,
          message: result.message,
        });
        return;
      }

      // Si c'est le patient lui-même, accès direct
      if (userType === "patient" && userId === result.data.idPatient) {
        // Le patient peut toujours visualiser ses propres documents
      } else if (userType === "medecin") {
        // Pour les médecins, vérifier l'accès au DOSSIER parent (pas au document directement)
        // car le partage est créé au niveau du dossier, pas du document
        const { PartageMedicalService } = await import("../../application/services/PartageMedicalService");
        const dossierId = result.data.idDossierMedical;
        const acces = await PartageMedicalService.verifierAcces(userId, "dossier", dossierId);
        
        if (!acces.hasAccess) {
          res.status(403).json({
            error: "Accès refusé",
            message: "Vous n'avez pas accès à ce document",
          });
          return;
        }
      } else if (userType !== "administrateur") {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce document",
        });
        return;
      }

      // Vérifier que le fichier existe
      if (!result.data.cheminFichier) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:531',message:'Document has no cheminFichier, returning 404',data:{documentId,hasCheminFichier:!!result.data.cheminFichier},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        res.status(404).json({
          error: "Fichier introuvable",
          message: "Aucun fichier associé à ce document",
        });
        return;
      }

      // Extraire le nom du fichier depuis le chemin (peut être une URL ou un chemin relatif)
      let filename: string;
      const cheminFichier = result.data.cheminFichier;
      
      // Si c'est une URL, extraire le nom de fichier après le dernier "/"
      if (cheminFichier.includes("http://") || cheminFichier.includes("https://")) {
        // URL complète : extraire le nom de fichier après le dernier "/"
        const urlParts = cheminFichier.split("/");
        filename = urlParts[urlParts.length - 1];
      } else if (cheminFichier.includes("/")) {
        // Chemin relatif : extraire le nom de fichier après le dernier "/"
        filename = cheminFichier.split("/").pop() || "document";
      } else {
        // Nom de fichier direct
        filename = cheminFichier;
      }
      
      const filePath = FileStorageService.getFilePath(filename);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:560',message:'File path constructed',data:{documentId,cheminFichier,filename,filePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion

      // Vérifier que le fichier existe physiquement
      const fileExists = await FileStorageService.fileExists(filename);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:567',message:'File existence check',data:{documentId,filename,filePath,fileExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      if (!fileExists) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentMedicalController.ts:571',message:'File does not exist on disk, returning 404',data:{documentId,filename,filePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        res.status(404).json({
          error: "Fichier introuvable",
          message: `Le fichier "${filename}" n'existe pas sur le serveur`,
        });
        return;
      }

      // Déterminer le type MIME du fichier
      const fileExtension = filename.toLowerCase().split(".").pop();
      let contentType = "application/octet-stream";
      
      if (fileExtension === "pdf") {
        contentType = "application/pdf";
      } else if (["jpg", "jpeg"].includes(fileExtension || "")) {
        contentType = "image/jpeg";
      } else if (fileExtension === "png") {
        contentType = "image/png";
      } else if (fileExtension === "gif") {
        contentType = "image/gif";
      } else if (fileExtension === "webp") {
        contentType = "image/webp";
      }

      // Définir les headers pour la visualisation (sans téléchargement)
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`); // inline pour la prévisualisation
      res.setHeader("X-Content-Type-Options", "nosniff"); // Empêcher le navigateur de deviner le type
      
      // Empêcher le téléchargement via JavaScript (protection basique)
      res.setHeader("X-Frame-Options", "SAMEORIGIN"); // Empêcher l'embedding dans des iframes externes
      
      // Envoyer le fichier en streaming
      const fs = await import("fs");
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error("Erreur lors de la visualisation du document:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }
}

