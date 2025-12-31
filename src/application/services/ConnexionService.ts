import { db } from "../../infrastructure/database/db";
import { connexions } from "../../infrastructure/database/schema/connexions";
import { medecins } from "../../infrastructure/database/schema/medecins";
import { patients } from "../../infrastructure/database/schema/patients";
import { utilisateurs } from "../../infrastructure/database/schema/utilisateurs";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface CreateConnexionData {
  idPatient: string;
  idMedecin: string;
}

export interface ConnexionResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Service de gestion des connexions entre patients et médecins
 */
export class ConnexionService {
  /**
   * Envoie une demande de connexion d'un patient à un médecin
   */
  static async sendConnexionRequest(
    patientId: string,
    medecinId: string
  ): Promise<ConnexionResponse> {
    try {
      // Vérifier que le patient existe
      const patient = await db
        .select()
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      if (patient.length === 0) {
        return {
          success: false,
          error: "Patient non trouvé",
          message: "Le patient spécifié n'existe pas",
        };
      }

      // Vérifier que le médecin existe et est validé
      const medecin = await db
        .select()
        .from(medecins)
        .where(and(eq(medecins.id, medecinId), eq(medecins.statutVerification, "valide")))
        .limit(1);

      if (medecin.length === 0) {
        return {
          success: false,
          error: "Médecin non trouvé",
          message: "Le médecin spécifié n'existe pas ou n'est pas validé",
        };
      }

      // Vérifier si une connexion existe déjà
      const existingConnexion = await db
        .select()
        .from(connexions)
        .where(
          and(eq(connexions.idPatient, patientId), eq(connexions.idMedecin, medecinId))
        )
        .limit(1);

      if (existingConnexion.length > 0) {
        const existing = existingConnexion[0];
        if (existing.statut === "Accepté") {
          return {
            success: false,
            error: "Connexion déjà établie",
            message: "Vous êtes déjà connecté à ce médecin",
          };
        }
        if (existing.statut === "En_attente") {
          return {
            success: false,
            error: "Demande en attente",
            message: "Une demande de connexion est déjà en attente",
          };
        }
        // Si la connexion était révoquée, on peut créer une nouvelle demande
      }

      // Créer la nouvelle demande de connexion
      const connexionId = randomUUID();
      await db.insert(connexions).values({
        id: connexionId,
        idPatient: patientId,
        idMedecin: medecinId,
        statut: "En_attente",
        dateCreation: new Date(),
      });

      // Récupérer la connexion créée avec les informations du médecin
      const newConnexion = await db
        .select({
          id: connexions.id,
          idPatient: connexions.idPatient,
          idMedecin: connexions.idMedecin,
          statut: connexions.statut,
          dateCreation: connexions.dateCreation,
          dateAcceptation: connexions.dateAcceptation,
          medecinNom: medecins.nom,
          medecinSpecialite: medecins.specialite,
        })
        .from(connexions)
        .innerJoin(medecins, eq(connexions.idMedecin, medecins.id))
        .where(eq(connexions.id, connexionId))
        .limit(1);

      return {
        success: true,
        data: newConnexion[0],
        message: "Demande de connexion envoyée avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de la demande de connexion:", error);
      return {
        success: false,
        error: "Erreur lors de l'envoi de la demande",
        message: error.message,
      };
    }
  }

  /**
   * Accepte une demande de connexion (côté médecin)
   */
  static async acceptConnexion(
    connexionId: string,
    medecinId: string
  ): Promise<ConnexionResponse> {
    try {
      // Vérifier que la connexion existe et appartient au médecin
      const connexion = await db
        .select()
        .from(connexions)
        .where(and(eq(connexions.id, connexionId), eq(connexions.idMedecin, medecinId)))
        .limit(1);

      if (connexion.length === 0) {
        // Vérifier si la connexion existe mais n'appartient pas à ce médecin
        const connexionExists = await db
          .select()
          .from(connexions)
          .where(eq(connexions.id, connexionId))
          .limit(1);

        if (connexionExists.length > 0) {
          return {
            success: false,
            error: "Accès refusé",
            message: "Cette demande de connexion ne vous appartient pas",
          };
        }

        return {
          success: false,
          error: "Connexion non trouvée",
          message: "La demande de connexion spécifiée n'existe pas",
        };
      }

      const currentStatut = connexion[0].statut;
      console.log(`[AcceptConnexion] Connexion ${connexionId} - Statut actuel: ${currentStatut}`);

      if (currentStatut !== "En_attente") {
        let message = "Cette demande de connexion ne peut plus être acceptée";
        if (currentStatut === "Accepté") {
          message = "Cette demande de connexion a déjà été acceptée";
        } else if (currentStatut === "Revoqué") {
          message = "Cette demande de connexion a été révoquée";
        }

        return {
          success: false,
          error: "Statut invalide",
          message: message,
        };
      }

      // Accepter la connexion
      await db
        .update(connexions)
        .set({
          statut: "Accepté",
          dateAcceptation: new Date(),
        })
        .where(eq(connexions.id, connexionId));

      console.log(`[AcceptConnexion] Connexion ${connexionId} acceptée avec succès`);

      return {
        success: true,
        message: "Demande de connexion acceptée",
      };
    } catch (error: any) {
      console.error("Erreur lors de l'acceptation de la connexion:", error);
      return {
        success: false,
        error: "Erreur lors de l'acceptation",
        message: error.message,
      };
    }
  }

  /**
   * Refuse ou révoque une connexion
   */
  static async rejectConnexion(
    connexionId: string,
    userId: string,
    userType: string
  ): Promise<ConnexionResponse> {
    try {
      // Vérifier que la connexion existe
      const connexion = await db
        .select()
        .from(connexions)
        .where(eq(connexions.id, connexionId))
        .limit(1);

      if (connexion.length === 0) {
        return {
          success: false,
          error: "Connexion non trouvée",
          message: "La connexion spécifiée n'existe pas",
        };
      }

      // Vérifier que l'utilisateur a le droit de révoquer
      const canReject =
        (userType === "patient" && connexion[0].idPatient === userId) ||
        (userType === "medecin" && connexion[0].idMedecin === userId);

      if (!canReject) {
        return {
          success: false,
          error: "Accès refusé",
          message: "Vous n'avez pas le droit de révoquer cette connexion",
        };
      }

      // Révoquer la connexion
      await db
        .update(connexions)
        .set({
          statut: "Revoqué",
        })
        .where(eq(connexions.id, connexionId));

      return {
        success: true,
        message: "Connexion révoquée",
      };
    } catch (error: any) {
      console.error("Erreur lors de la révocation de la connexion:", error);
      return {
        success: false,
        error: "Erreur lors de la révocation",
        message: error.message,
      };
    }
  }

  /**
   * Récupère les connexions d'un patient
   */
  static async getConnexionsByPatient(patientId: string): Promise<ConnexionResponse> {
    try {
      const connexionsList = await db
        .select({
          id: connexions.id,
          idPatient: connexions.idPatient,
          idMedecin: connexions.idMedecin,
          statut: connexions.statut,
          dateCreation: connexions.dateCreation,
          dateAcceptation: connexions.dateAcceptation,
          medecinNom: medecins.nom,
          medecinSpecialite: medecins.specialite,
          medecinTelephone: utilisateurs.telephone,
          medecinMail: utilisateurs.mail,
        })
        .from(connexions)
        .innerJoin(medecins, eq(connexions.idMedecin, medecins.id))
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(connexions.idPatient, patientId))
        .orderBy(connexions.dateCreation);

      return {
        success: true,
        data: connexionsList,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des connexions:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération",
        message: error.message,
      };
    }
  }

  /**
   * Récupère les demandes de connexion en attente pour un médecin
   */
  static async getPendingRequestsByMedecin(medecinId: string): Promise<ConnexionResponse> {
    try {
      const requests = await db
        .select({
          id: connexions.id,
          idPatient: connexions.idPatient,
          idMedecin: connexions.idMedecin,
          statut: connexions.statut,
          dateCreation: connexions.dateCreation,
          patientNom: patients.nom,
          patientTelephone: utilisateurs.telephone,
          patientMail: utilisateurs.mail,
        })
        .from(connexions)
        .innerJoin(patients, eq(connexions.idPatient, patients.id))
        .innerJoin(utilisateurs, eq(patients.id, utilisateurs.id))
        .where(and(eq(connexions.idMedecin, medecinId), eq(connexions.statut, "En_attente")))
        .orderBy(connexions.dateCreation);

      return {
        success: true,
        data: requests,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des demandes:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération",
        message: error.message,
      };
    }
  }

  /**
   * Récupère les patients connectés (acceptés) à un médecin
   */
  static async getPatientsByMedecin(medecinId: string): Promise<ConnexionResponse> {
    try {
      const patientsList = await db
        .select({
          connexionId: connexions.id,
          idPatient: connexions.idPatient,
          idMedecin: connexions.idMedecin,
          statutConnexion: connexions.statut,
          niveauAcces: connexions.niveauAcces,
          dateConnexion: connexions.dateCreation,
          dateAcceptation: connexions.dateAcceptation,
          patientNom: patients.nom,
          patientDateNaissance: patients.dateNaissance,
          patientGenre: patients.genre,
          patientTelephone: utilisateurs.telephone,
          patientMail: utilisateurs.mail,
          patientAdresse: utilisateurs.adresse,
        })
        .from(connexions)
        .innerJoin(patients, eq(connexions.idPatient, patients.id))
        .innerJoin(utilisateurs, eq(patients.id, utilisateurs.id))
        .where(and(eq(connexions.idMedecin, medecinId), eq(connexions.statut, "Accepté")))
        .orderBy(connexions.dateAcceptation);

      return {
        success: true,
        data: patientsList,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des patients:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération",
        message: error.message,
      };
    }
  }

  /**
   * Vérifie si un patient et un médecin sont connectés
   */
  static async areConnected(patientId: string, medecinId: string): Promise<boolean> {
    try {
      const connexion = await db
        .select()
        .from(connexions)
        .where(
          and(
            eq(connexions.idPatient, patientId),
            eq(connexions.idMedecin, medecinId),
            eq(connexions.statut, "Accepté")
          )
        )
        .limit(1);

      return connexion.length > 0;
    } catch (error) {
      console.error("Erreur lors de la vérification de connexion:", error);
      return false;
    }
  }
}

