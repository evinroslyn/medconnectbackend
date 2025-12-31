import { db } from "../../infrastructure/database/db";
import { patients } from "../../infrastructure/database/schema/patients";
import { utilisateurs } from "../../infrastructure/database/schema/utilisateurs";
import { eq } from "drizzle-orm";

export interface PatientInfo {
  id: string;
  nom: string;
  mail: string;
  telephone: string;
  dateNaissance?: string;
  genre?: "Homme" | "Femme" | "Autre";
  adresse?: string;
  dateCreation: string;
  derniereConnexion?: string;
}

export interface PatientResponse {
  success: boolean;
  data?: PatientInfo;
  error?: string;
  message?: string;
}

/**
 * Service pour récupérer les informations des patients
 */
export class PatientService {
  /**
   * Récupère un patient par son ID
   */
  static async getPatientById(patientId: string): Promise<PatientResponse> {
    try {
      const patient = await db
        .select({
          id: patients.id,
          nom: patients.nom,
          mail: utilisateurs.mail,
          telephone: utilisateurs.telephone,
          dateNaissance: patients.dateNaissance,
          genre: patients.genre,
          adresse: utilisateurs.adresse,
          dateCreation: utilisateurs.dateCreation,
          derniereConnexion: utilisateurs.derniereConnexion,
        })
        .from(patients)
        .innerJoin(utilisateurs, eq(patients.id, utilisateurs.id))
        .where(eq(patients.id, patientId))
        .limit(1);

      if (patient.length === 0) {
        return {
          success: false,
          error: "Patient non trouvé",
          message: "Le patient spécifié n'existe pas",
        };
      }

      const p = patient[0];
      return {
        success: true,
        data: {
          id: p.id,
          nom: p.nom,
          mail: p.mail,
          telephone: p.telephone,
          dateNaissance: p.dateNaissance ? new Date(p.dateNaissance).toISOString().split('T')[0] : undefined,
          genre: p.genre as "Homme" | "Femme" | "Autre" | undefined,
          adresse: p.adresse || undefined,
          dateCreation: p.dateCreation.toISOString(),
          derniereConnexion: p.derniereConnexion ? p.derniereConnexion.toISOString() : undefined,
        },
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération du patient:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération",
        message: error.message,
      };
    }
  }
}

