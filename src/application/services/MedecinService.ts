import { db } from "../../infrastructure/database/db";
import { medecins } from "../../infrastructure/database/schema/medecins";
import { utilisateurs } from "../../infrastructure/database/schema/utilisateurs";
import { eq, and, or, like } from "drizzle-orm";

export interface MedecinInfo {
  id: string;
  nom: string;
  specialite: string;
  mail: string;
  telephone?: string;
  adresse?: string;
  anneesExperience?: string;
}

export interface MedecinResponse {
  success: boolean;
  data?: MedecinInfo[];
  error?: string;
  message?: string;
}

export interface SearchMedecinsParams {
  nom?: string;
  specialite?: string;
  emplacement?: string; // Recherche par adresse
}

/**
 * Service pour récupérer les informations des médecins
 */
export class MedecinService {
  /**
   * Recherche des médecins validés par nom, spécialité ou emplacement
   */
  static async searchMedecins(params?: SearchMedecinsParams): Promise<MedecinResponse> {
    try {
      let query = db
        .select({
          id: medecins.id,
          nom: medecins.nom,
          specialite: medecins.specialite,
          mail: utilisateurs.mail,
          telephone: utilisateurs.telephone,
          adresse: utilisateurs.adresse,
          anneesExperience: medecins.anneesExperience,
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(medecins.statutVerification, "valide"));

      // Appliquer les filtres de recherche
      if (params) {
        const conditions = [];

        if (params.nom) {
          conditions.push(like(medecins.nom, `%${params.nom}%`));
        }

        if (params.specialite) {
          conditions.push(like(medecins.specialite, `%${params.specialite}%`));
        }

        if (params.emplacement && utilisateurs.adresse) {
          conditions.push(like(utilisateurs.adresse, `%${params.emplacement}%`));
        }

        if (conditions.length > 0) {
          query = query.where(and(eq(medecins.statutVerification, "valide"), or(...conditions)));
        }
      }

      const medecinsValides = await query;

      return {
        success: true,
        data: medecinsValides,
      };
    } catch (error: any) {
      console.error("Erreur lors de la recherche des médecins:", error);
      return {
        success: false,
        error: "Erreur lors de la recherche des médecins",
        message: error.message,
      };
    }
  }

  /**
   * Récupère tous les médecins validés
   */
  static async getAllMedecinsValides(): Promise<MedecinResponse> {
    return this.searchMedecins();
  }

  /**
   * Récupère un médecin par son ID
   */
  static async getMedecinById(medecinId: string): Promise<MedecinResponse> {
    try {
      const medecin = await db
        .select({
          id: medecins.id,
          nom: medecins.nom,
          specialite: medecins.specialite,
          mail: utilisateurs.mail,
          telephone: utilisateurs.telephone,
          adresse: utilisateurs.adresse,
          anneesExperience: medecins.anneesExperience,
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(and(eq(medecins.id, medecinId), eq(medecins.statutVerification, "valide")))
        .limit(1);

      if (medecin.length === 0) {
        return {
          success: false,
          error: "Médecin non trouvé",
          message: "Le médecin spécifié n'existe pas ou n'est pas validé",
        };
      }

      return {
        success: true,
        data: [medecin[0]],
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération du médecin:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération",
        message: error.message,
      };
    }
  }
}

