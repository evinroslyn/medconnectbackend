import { Request, Response } from "express";
import { RendezVousService } from "../../application/services/RendezVousService";

/**
 * Contrôleur de gestion des rendez-vous et disponibilités
 */
export class RendezVousController {
  /**
   * Récupère les disponibilités du médecin connecté
   * GET /api/rendez-vous/disponibilites
   */
  static async getDisponibilites(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      // Seuls les médecins peuvent voir leurs disponibilités
      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent accéder à leurs disponibilités",
        });
        return;
      }

      const result = await RendezVousService.getDisponibilitesByMedecin(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans getDisponibilites:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère toutes les disponibilités actives publiées (pour les patients)
   * GET /api/rendez-vous/disponibilites/public
   */
  static async getDisponibilitesPublic(req: Request, res: Response): Promise<void> {
    try {
      console.log("[RendezVousController] getDisponibilitesPublic - Début");
      if (!req.user) {
        console.log("[RendezVousController] getDisponibilitesPublic - Non authentifié");
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      console.log("[RendezVousController] getDisponibilitesPublic - Appel du service");
      const result = await RendezVousService.getAllDisponibilitesActives();
      console.log("[RendezVousController] getDisponibilitesPublic - Résultat:", result.success, result.data?.length || 0);

      if (result.success) {
        res.status(200).json(result);
      } else {
        console.error("[RendezVousController] getDisponibilitesPublic - Erreur:", result.error, result.message);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("[RendezVousController] Erreur dans getDisponibilitesPublic:", error);
      console.error("[RendezVousController] Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Crée une nouvelle disponibilité
   * POST /api/rendez-vous/disponibilites
   */
  static async createDisponibilite(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      // Seuls les médecins peuvent créer des disponibilités
      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent créer des disponibilités",
        });
        return;
      }

      const {
        jour,
        heureDebut,
        heureFin,
        lieu,
        centreMedical,
        typeConsultation,
        actif,
      } = req.body;

      if (!jour || !heureDebut || !heureFin || !typeConsultation) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "Le jour, l'heure de début, l'heure de fin et le type de consultation sont requis",
        });
        return;
      }

      const result = await RendezVousService.createDisponibilite({
        idMedecin: userId,
        jour,
        heureDebut,
        heureFin,
        lieu,
        centreMedical,
        typeConsultation,
        actif: actif !== undefined ? actif : true,
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans createDisponibilite:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Met à jour une disponibilité
   * PATCH /api/rendez-vous/disponibilites/:id
   */
  static async updateDisponibilite(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;
      const disponibiliteId = req.params.id;

      // Seuls les médecins peuvent mettre à jour leurs disponibilités
      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent mettre à jour leurs disponibilités",
        });
        return;
      }

      const {
        jour,
        heureDebut,
        heureFin,
        lieu,
        centreMedical,
        typeConsultation,
        actif,
      } = req.body;

      const result = await RendezVousService.updateDisponibilite(
        disponibiliteId,
        userId,
        {
          jour,
          heureDebut,
          heureFin,
          lieu,
          centreMedical,
          typeConsultation,
          actif,
        }
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans updateDisponibilite:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Supprime une disponibilité
   * DELETE /api/rendez-vous/disponibilites/:id
   */
  static async deleteDisponibilite(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;
      const disponibiliteId = req.params.id;

      // Seuls les médecins peuvent supprimer leurs disponibilités
      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent supprimer leurs disponibilités",
        });
        return;
      }

      const result = await RendezVousService.deleteDisponibilite(
        disponibiliteId,
        userId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans deleteDisponibilite:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère les rendez-vous du médecin connecté
   * GET /api/rendez-vous/medecin
   */
  static async getRendezVousMedecin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      // Seuls les médecins peuvent voir leurs rendez-vous
      if (userType !== "medecin") {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seuls les médecins peuvent accéder à leurs rendez-vous",
        });
        return;
      }

      const result = await RendezVousService.getRendezVousByMedecin(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans getRendezVousMedecin:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Crée un nouveau rendez-vous
   * POST /api/rendez-vous
   */
  static async createRendezVous(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;

      const { idPatient, idMedecin, date, type, notes, duree } = req.body;

      // Vérifier que l'utilisateur a le droit de créer ce rendez-vous
      if (userType === "patient" && idPatient !== userId) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Vous ne pouvez créer un rendez-vous que pour vous-même",
        });
        return;
      }

      if (userType === "medecin" && idMedecin !== userId) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Vous ne pouvez créer un rendez-vous que pour vous-même",
        });
        return;
      }

      if (!idPatient || !idMedecin || !date || !type) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "L'ID patient, l'ID médecin, la date et le type sont requis",
        });
        return;
      }

      const result = await RendezVousService.createRendezVous({
        idPatient,
        idMedecin,
        date,
        type,
        notes,
        duree,
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans createRendezVous:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Annule un rendez-vous
   * PATCH /api/rendez-vous/:id/annuler
   */
  static async annulerRendezVous(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      const userId = req.user.userId;
      const userType = req.user.typeUtilisateur;
      const rendezVousId = req.params.id;

      const result = await RendezVousService.annulerRendezVous(
        rendezVousId,
        userId,
        userType
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans annulerRendezVous:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }
}
