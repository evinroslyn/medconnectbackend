import { Request, Response } from "express";
import { AllergieTraitementService } from "../../application/services/AllergieTraitementService";
import { authenticateToken } from "../../infrastructure/auth/middleware";

/**
 * Contrôleur pour gérer les allergies et traitements des patients
 */
export class AllergieTraitementController {
  /**
   * Récupère toutes les allergies d'un patient
   * GET /api/patients/:id/allergies
   */
  static async getAllergies(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "L'identifiant du patient est requis",
        });
        return;
      }

      const allergies = await AllergieTraitementService.getAllergiesByPatient(id);

      res.status(200).json({
        success: true,
        data: allergies,
      });
    } catch (error: any) {
      console.error("Erreur dans getAllergies:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Ajoute une allergie à un patient
   * POST /api/patients/:id/allergies
   * Seul le patient peut ajouter ses propres allergies
   */
  static async addAllergie(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, description, dateDecouverte } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      // Vérifier que seul le patient peut ajouter ses propres allergies
      if (req.user.typeUtilisateur !== "patient" || req.user.userId !== id) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seul le patient peut ajouter ses propres allergies",
        });
        return;
      }

      if (!id || !nom) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "L'identifiant du patient et le nom de l'allergie sont requis",
        });
        return;
      }

      const allergie = await AllergieTraitementService.addAllergie(
        id,
        nom,
        description,
        dateDecouverte ? new Date(dateDecouverte) : undefined
      );

      res.status(201).json({
        success: true,
        data: allergie,
      });
    } catch (error: any) {
      console.error("Erreur dans addAllergie:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Met à jour une allergie
   * PUT /api/allergies/:id
   * Seul le patient peut modifier ses propres allergies
   */
  static async updateAllergie(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, description, dateDecouverte } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      // Récupérer l'allergie pour vérifier le propriétaire
      const existingAllergie = await AllergieTraitementService.getAllergieById(id);
      if (!existingAllergie) {
        res.status(404).json({
          success: false,
          error: "Non trouvé",
          message: "Allergie non trouvée",
        });
        return;
      }

      // Vérifier que seul le patient peut modifier ses propres allergies
      if (req.user.typeUtilisateur !== "patient" || req.user.userId !== existingAllergie.idPatient) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seul le patient peut modifier ses propres allergies",
        });
        return;
      }

      if (!nom) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Le nom de l'allergie est requis",
        });
        return;
      }

      const allergie = await AllergieTraitementService.updateAllergie(
        id,
        nom,
        description,
        dateDecouverte ? new Date(dateDecouverte) : undefined
      );

      res.status(200).json({
        success: true,
        data: allergie,
      });
    } catch (error: any) {
      console.error("Erreur dans updateAllergie:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Supprime une allergie
   * DELETE /api/allergies/:id
   * Seul le patient peut supprimer ses propres allergies
   */
  static async deleteAllergie(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "L'identifiant de l'allergie est requis",
        });
        return;
      }

      // Récupérer l'allergie pour vérifier le propriétaire
      const existingAllergie = await AllergieTraitementService.getAllergieById(id);
      if (!existingAllergie) {
        res.status(404).json({
          success: false,
          error: "Non trouvé",
          message: "Allergie non trouvée",
        });
        return;
      }

      // Vérifier que seul le patient peut supprimer ses propres allergies
      if (req.user.typeUtilisateur !== "patient" || req.user.userId !== existingAllergie.idPatient) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seul le patient peut supprimer ses propres allergies",
        });
        return;
      }

      await AllergieTraitementService.deleteAllergie(id);

      res.status(200).json({
        success: true,
        message: "Allergie supprimée avec succès",
      });
    } catch (error: any) {
      console.error("Erreur dans deleteAllergie:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Récupère tous les traitements d'un patient
   * GET /api/patients/:id/traitements
   */
  static async getTraitements(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "L'identifiant du patient est requis",
        });
        return;
      }

      const traitements = await AllergieTraitementService.getTraitementsByPatient(id);

      res.status(200).json({
        success: true,
        data: traitements,
      });
    } catch (error: any) {
      console.error("Erreur dans getTraitements:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Ajoute un traitement à un patient
   * POST /api/patients/:id/traitements
   * Seul le patient peut ajouter ses propres traitements
   */
  static async addTraitement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, dateDebut, description, dateFin, posologie, medecinPrescripteur } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      // Vérifier que seul le patient peut ajouter ses propres traitements
      if (req.user.typeUtilisateur !== "patient" || req.user.userId !== id) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seul le patient peut ajouter ses propres traitements",
        });
        return;
      }

      if (!id || !nom || !dateDebut) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "L'identifiant du patient, le nom et la date de début sont requis",
        });
        return;
      }

      const traitement = await AllergieTraitementService.addTraitement(
        id,
        nom,
        new Date(dateDebut),
        description,
        dateFin ? new Date(dateFin) : undefined,
        posologie,
        medecinPrescripteur
      );

      res.status(201).json({
        success: true,
        data: traitement,
      });
    } catch (error: any) {
      console.error("Erreur dans addTraitement:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Met à jour un traitement
   * PUT /api/traitements/:id
   */
  static async updateTraitement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, dateDebut, description, dateFin, posologie, medecinPrescripteur } = req.body;

      if (!id || !nom || !dateDebut) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "L'identifiant, le nom et la date de début sont requis",
        });
        return;
      }

      const traitement = await AllergieTraitementService.updateTraitement(
        id,
        nom,
        new Date(dateDebut),
        description,
        dateFin ? new Date(dateFin) : undefined,
        posologie,
        medecinPrescripteur
      );

      if (!traitement) {
        res.status(404).json({
          success: false,
          error: "Non trouvé",
          message: "Traitement non trouvé",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: traitement,
      });
    } catch (error: any) {
      console.error("Erreur dans updateTraitement:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }

  /**
   * Supprime un traitement
   * DELETE /api/traitements/:id
   * Seul le patient peut supprimer ses propres traitements
   */
  static async deleteTraitement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "L'identifiant du traitement est requis",
        });
        return;
      }

      // Récupérer le traitement pour vérifier le propriétaire
      const existingTraitement = await AllergieTraitementService.getTraitementById(id);
      if (!existingTraitement) {
        res.status(404).json({
          success: false,
          error: "Non trouvé",
          message: "Traitement non trouvé",
        });
        return;
      }

      // Vérifier que seul le patient peut supprimer ses propres traitements
      if (req.user.typeUtilisateur !== "patient" || req.user.userId !== existingTraitement.idPatient) {
        res.status(403).json({
          success: false,
          error: "Accès refusé",
          message: "Seul le patient peut supprimer ses propres traitements",
        });
        return;
      }

      await AllergieTraitementService.deleteTraitement(id);

      res.status(200).json({
        success: true,
        message: "Traitement supprimé avec succès",
      });
    } catch (error: any) {
      console.error("Erreur dans deleteTraitement:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }
}

