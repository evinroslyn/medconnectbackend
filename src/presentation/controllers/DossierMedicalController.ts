import { Request, Response } from "express";
import { DossierMedicalService } from "../../application/services/DossierMedicalService";
import { upload, FileStorageService } from "../../infrastructure/storage/fileStorage";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Contrôleur de gestion des dossiers médicaux
 */
export class DossierMedicalController {
  /**
   * Récupère tous les dossiers médicaux d'un patient
   * GET /api/dossiers-medicaux?patientId=xxx
   * Accessible par le patient ou un médecin avec accès
   */
  static async getDossiersByPatient(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.query.patientId as string;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.typeUtilisateur;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: "Paramètre manquant",
          message: "Le paramètre patientId est requis",
        });
        return;
      }

      // Si c'est le patient lui-même, accès direct
      if (userType === "patient" && userId === patientId) {
        const result = await DossierMedicalService.getDossiersByPatient(patientId);
        if (result.success) {
          res.status(200).json(result.data || []);
        } else {
          res.status(400).json({
            error: result.error || result.message || "Erreur lors de la récupération des dossiers",
          });
        }
        return;
      }

      // Si c'est un médecin, vérifier l'accès via PartageMedicalService
      if (userType === "medecin") {
        const { PartageMedicalService } = await import("../../application/services/PartageMedicalService");
        
        // Récupérer tous les dossiers du patient
        const result = await DossierMedicalService.getDossiersByPatient(patientId);
        
        if (!result.success || !result.data) {
          res.status(400).json({
            error: result.error || result.message || "Erreur lors de la récupération des dossiers",
          });
          return;
        }

        // Filtrer les dossiers auxquels le médecin a accès
        const dossiersAccessibles = [];
        for (const dossier of result.data) {
          const acces = await PartageMedicalService.verifierAcces(userId, "dossier", dossier.id);
          if (acces.hasAccess) {
            dossiersAccessibles.push(dossier);
          }
        }

        res.status(200).json(dossiersAccessibles);
        return;
      }

      // Accès refusé pour les autres types d'utilisateurs
      res.status(403).json({
        success: false,
        error: "Accès refusé",
        message: "Vous n'avez pas accès à ces dossiers médicaux",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Récupère un dossier médical par son ID
   * GET /api/dossiers-medicaux/:id
   * Accessible par le patient ou un médecin avec accès
   */
  static async getDossierById(req: Request, res: Response): Promise<void> {
    try {
      const dossierId = req.params.id;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.typeUtilisateur;
      
      const result = await DossierMedicalService.getDossierById(dossierId);

      if (!result.success || !result.data) {
        res.status(404).json({
          error: result.error || "Dossier non trouvé",
          message: result.message,
        });
        return;
      }

      // Si c'est le patient lui-même, accès direct
      if (userType === "patient" && userId === result.data.idPatient) {
        res.status(200).json(result.data);
        return;
      }

      // Si c'est un médecin, vérifier l'accès via PartageMedicalService
      if (userType === "medecin") {
        const { PartageMedicalService } = await import("../../application/services/PartageMedicalService");
        const acces = await PartageMedicalService.verifierAcces(userId, "dossier", dossierId);
        
        if (acces.hasAccess) {
          res.status(200).json(result.data);
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
        message: "Vous n'avez pas accès à ce dossier médical",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Crée un nouveau dossier médical
   * POST /api/dossiers-medicaux
   */
  static async createDossier(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Vous devez être connecté pour créer un dossier",
        });
        return;
      }

      // Les données sont envoyées en JSON (pas de fichier pour les dossiers)
      const titre = req.body?.titre;
      const date = req.body?.date;
      const description = req.body?.description;
      const type = req.body?.type;
      const idPatient = req.body?.idPatient || userId; // Utiliser userId si idPatient n'est pas fourni
      
      // Log pour debug
      console.log("[DossierMedicalController] createDossier - Full request:", {
        body: req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        titre,
        date,
        description,
        type,
        idPatient,
        contentType: req.headers["content-type"],
        rawBody: JSON.stringify(req.body),
      });

      // Vérifier que l'utilisateur crée un dossier pour lui-même
      if (idPatient !== userId) {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous ne pouvez créer un dossier que pour vous-même",
        });
        return;
      }

      // Validation améliorée : vérifier que titre et date sont des chaînes non vides
      if (!titre || typeof titre !== "string" || titre.trim().length === 0) {
        res.status(400).json({
          error: "Données manquantes",
          message: "Le champ titre est requis et ne peut pas être vide",
        });
        return;
      }

      if (!date || typeof date !== "string" || date.trim().length === 0) {
        res.status(400).json({
          error: "Données manquantes",
          message: "Le champ date est requis et ne peut pas être vide",
        });
        return;
      }

      // Créer le dossier (sans fichier - les fichiers vont dans DocumentMedical)
      const result = await DossierMedicalService.createDossier({
        idPatient,
        titre,
        date,
        description,
        type, // Optionnel
      });

      if (result.success && result.data) {
        res.status(201).json(result.data);
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de la création du dossier",
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Catégorise un dossier médical (change son type)
   * PATCH /api/dossiers-medicaux/:id/categoriser
   * Correspond à Patient.categoriserDossier() du diagramme
   */
  static async categoriserDossier(req: Request, res: Response): Promise<void> {
    try {
      const dossierId = req.params.id;
      const userId = (req as any).user?.userId;
      const { type } = req.body;

      if (!type) {
        res.status(400).json({
          error: "Données manquantes",
          message: "Le champ type est requis",
        });
        return;
      }

      // Vérifier que le dossier existe et appartient à l'utilisateur
      const dossier = await DossierMedicalService.getDossierById(dossierId);
      if (!dossier.success || !dossier.data) {
        res.status(404).json(dossier);
        return;
      }

      if (dossier.data.idPatient !== userId) {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce dossier médical",
        });
        return;
      }

      const result = await DossierMedicalService.categoriserDossier(dossierId, type);

      if (result.success && result.data) {
        res.status(200).json(result.data);
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de la catégorisation du dossier",
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
   * Ajoute ou met à jour la description d'un dossier médical
   * PATCH /api/dossiers-medicaux/:id/description
   * Correspond à Patient.ajouterDescriptionDossier() du diagramme
   */
  static async ajouterDescriptionDossier(req: Request, res: Response): Promise<void> {
    try {
      const dossierId = req.params.id;
      const userId = (req as any).user?.userId;
      const { description } = req.body;

      if (description === undefined) {
        res.status(400).json({
          error: "Données manquantes",
          message: "Le champ description est requis",
        });
        return;
      }

      // Vérifier que le dossier existe et appartient à l'utilisateur
      const dossier = await DossierMedicalService.getDossierById(dossierId);
      if (!dossier.success || !dossier.data) {
        res.status(404).json(dossier);
        return;
      }

      if (dossier.data.idPatient !== userId) {
        res.status(403).json({
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce dossier médical",
        });
        return;
      }

      const result = await DossierMedicalService.ajouterDescriptionDossier(dossierId, description);

      if (result.success && result.data) {
        res.status(200).json(result.data);
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de l'ajout de la description",
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
   * Met à jour un dossier médical
   * PATCH /api/dossiers-medicaux/:id
   */
  static async updateDossier(req: Request, res: Response): Promise<void> {
    try {
      const dossierId = req.params.id;
      const userId = (req as any).user?.userId;

      // Vérifier que le dossier existe et appartient à l'utilisateur
      const dossier = await DossierMedicalService.getDossierById(dossierId);
      if (!dossier.success || !dossier.data) {
        res.status(404).json(dossier);
        return;
      }

      if (dossier.data.idPatient !== userId) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce dossier médical",
        });
        return;
      }

      const updates = req.body;
      const result = await DossierMedicalService.updateDossier(dossierId, updates);

      if (result.success && result.data) {
        res.status(200).json(result.data);
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de la mise à jour du dossier",
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }

  /**
   * Supprime un dossier médical
   * DELETE /api/dossiers-medicaux/:id
   */
  static async deleteDossier(req: Request, res: Response): Promise<void> {
    try {
      const dossierId = req.params.id;
      const userId = (req as any).user?.userId;

      // Vérifier que le dossier existe et appartient à l'utilisateur
      const dossier = await DossierMedicalService.getDossierById(dossierId);
      if (!dossier.success || !dossier.data) {
        res.status(404).json(dossier);
        return;
      }

      if (dossier.data.idPatient !== userId) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Vous n'avez pas accès à ce dossier médical",
        });
        return;
      }

      const result = await DossierMedicalService.deleteDossier(dossierId);

      if (result.success) {
        res.status(200).json({ message: result.message || "Dossier supprimé avec succès" });
      } else {
        res.status(400).json({
          error: result.error || "Erreur lors de la suppression du dossier",
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message,
      });
    }
  }
}

