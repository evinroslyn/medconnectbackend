import { Request, Response } from "express";
import { PatientService } from "../../application/services/PatientService";
import { authenticateToken } from "../../infrastructure/auth/middleware";
import { requireUserType } from "../../infrastructure/auth/middleware";

/**
 * Contrôleur de gestion des patients
 */
export class PatientController {
  /**
   * Récupère un patient par son ID
   * GET /api/patients/:id
   * Accessible par les médecins avec connexion acceptée ou le patient lui-même
   */
  static async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.params.id;
      const userId = (req as any).user?.userId;
      const userType = (req as any).user?.typeUtilisateur;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: "Paramètre manquant",
          message: "L'ID du patient est requis",
        });
        return;
      }

      // Si c'est le patient lui-même, accès direct
      if (userType === "patient" && userId === patientId) {
        const result = await PatientService.getPatientById(patientId);
        if (result.success && result.data) {
          res.status(200).json(result.data);
        } else {
          res.status(404).json({
            success: false,
            error: result.error || "Patient non trouvé",
            message: result.message,
          });
        }
        return;
      }

      // Si c'est un médecin, vérifier qu'il a une connexion acceptée avec le patient
      if (userType === "medecin") {
        const { ConnexionService } = await import("../../application/services/ConnexionService");
        const areConnected = await ConnexionService.areConnected(patientId, userId);
        
        if (areConnected) {
          const result = await PatientService.getPatientById(patientId);
          if (result.success && result.data) {
            res.status(200).json(result.data);
          } else {
            res.status(404).json({
              success: false,
              error: result.error || "Patient non trouvé",
              message: result.message,
            });
          }
        } else {
          res.status(403).json({
            success: false,
            error: "Accès refusé",
            message: "Vous n'avez pas accès à ce patient",
          });
        }
        return;
      }

      // Accès refusé pour les autres types d'utilisateurs
      res.status(403).json({
        success: false,
        error: "Accès refusé",
        message: "Vous n'avez pas accès à ce patient",
      });
    } catch (error: any) {
      console.error("Erreur dans getPatientById:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue",
      });
    }
  }
}

