import { db } from "../../infrastructure/database/db";
import { rendezVous, disponibilites, medecins } from "../../infrastructure/database/schema";
import { eq, and, gte, desc, asc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Interface pour créer une disponibilité
 */
export interface CreateDisponibiliteData {
  idMedecin: string;
  jour: string; // Format: "YYYY-MM-DD"
  heureDebut: string; // Format: "HH:mm"
  heureFin: string; // Format: "HH:mm"
  lieu?: string;
  centreMedical?: string;
  typeConsultation: "Téléconsultation" | "Présentiel";
  actif: boolean;
}

/**
 * Interface pour mettre à jour une disponibilité
 */
export interface UpdateDisponibiliteData {
  jour?: string;
  heureDebut?: string;
  heureFin?: string;
  lieu?: string;
  centreMedical?: string;
  typeConsultation?: "Téléconsultation" | "Présentiel";
  actif?: boolean;
}

/**
 * Interface pour créer un rendez-vous
 */
export interface CreateRendezVousData {
  idPatient: string;
  idMedecin: string;
  date: string | Date;
  type: "Téléconsultation" | "Présentiel";
  notes?: string;
  duree?: number;
}

/**
 * Interface de réponse générique
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Service de gestion des rendez-vous et disponibilités
 */
export class RendezVousService {
  /**
   * Récupère toutes les disponibilités d'un médecin
   */
  static async getDisponibilitesByMedecin(
    medecinId: string
  ): Promise<ServiceResponse<any[]>> {
    try {
      const result = await db
        .select()
        .from(disponibilites)
        .where(eq(disponibilites.idMedecin, medecinId))
        .orderBy(desc(disponibilites.jour));

      // Convertir les données pour le format attendu par le frontend
      const disponibilitesFormatted = result.map((d) => ({
        id: d.id,
        idMedecin: d.idMedecin,
        jour: d.jour instanceof Date 
          ? d.jour.toISOString().split("T")[0] 
          : new Date(d.jour).toISOString().split("T")[0],
        heureDebut: typeof d.heureDebut === "string" 
          ? d.heureDebut.substring(0, 5) 
          : d.heureDebut,
        heureFin: typeof d.heureFin === "string" 
          ? d.heureFin.substring(0, 5) 
          : d.heureFin,
        lieu: d.lieu || undefined,
        centreMedical: d.centreMedical || undefined,
        typeConsultation: d.typeConsultation,
        actif: d.actif,
      }));

      return {
        success: true,
        data: disponibilitesFormatted,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des disponibilités:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: "Impossible de récupérer les disponibilités",
      };
    }
  }

  /**
   * Récupère toutes les disponibilités actives publiées par tous les médecins (pour les patients)
   */
  static async getAllDisponibilitesActives(): Promise<ServiceResponse<any[]>> {
    try {
      const now = new Date();
      // Créer une date pour aujourd'hui à minuit
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayISO = today.toISOString().split('T')[0]; // Format YYYY-MM-DD

      console.log("[RendezVousService] getAllDisponibilitesActives - Date de référence:", todayISO);

      // Essayer d'abord sans filtre de date pour voir si le problème vient de là
      const result = await db
        .select({
          id: disponibilites.id,
          idMedecin: disponibilites.idMedecin,
          jour: disponibilites.jour,
          heureDebut: disponibilites.heureDebut,
          heureFin: disponibilites.heureFin,
          lieu: disponibilites.lieu,
          centreMedical: disponibilites.centreMedical,
          typeConsultation: disponibilites.typeConsultation,
          actif: disponibilites.actif,
          medecinNom: medecins.nom,
          medecinSpecialite: medecins.specialite,
        })
        .from(disponibilites)
        .innerJoin(medecins, eq(disponibilites.idMedecin, medecins.id))
        .where(eq(disponibilites.actif, true))
        .orderBy(asc(disponibilites.jour), asc(disponibilites.heureDebut));

      console.log("[RendezVousService] getAllDisponibilitesActives - Nombre de résultats:", result.length);

      // Filtrer les disponibilités passées après récupération
      const filtered = result.filter((d) => {
        const disponibiliteDate = d.jour instanceof Date 
          ? d.jour 
          : new Date(d.jour);
        return disponibiliteDate >= now;
      });

      console.log("[RendezVousService] getAllDisponibilitesActives - Après filtrage:", filtered.length);

      // Récupérer tous les rendez-vous futurs planifiés pour les médecins concernés
      const medecinIds = Array.from(new Set(filtered.map((d) => d.idMedecin)));

      let futureRendezVousList:
        { idMedecin: string; date: Date; statut: string }[] = [];

      if (medecinIds.length > 0) {
        futureRendezVousList = await db
          .select({
            idMedecin: rendezVous.idMedecin,
            date: rendezVous.date,
            statut: rendezVous.statut,
          })
          .from(rendezVous)
          .where(
            and(
              inArray(rendezVous.idMedecin, medecinIds),
              gte(rendezVous.date, now),
              eq(rendezVous.statut, "Planifié")
            )
          );
      }

      // Convertir les données pour le format attendu par le frontend
      const disponibilitesFormatted = filtered.map((d) => ({
        id: d.id,
        idMedecin: d.idMedecin,
        jour: d.jour instanceof Date
          ? d.jour.toISOString().split("T")[0]
          : new Date(d.jour).toISOString().split("T")[0],
        heureDebut: typeof d.heureDebut === "string"
          ? d.heureDebut.substring(0, 5)
          : d.heureDebut,
        heureFin: typeof d.heureFin === "string"
          ? d.heureFin.substring(0, 5)
          : d.heureFin,
        lieu: d.lieu || undefined,
        centreMedical: d.centreMedical || undefined,
        typeConsultation: d.typeConsultation,
        actif: d.actif,
        medecinNom: d.medecinNom,
        medecinSpecialite: d.medecinSpecialite,
        // Marqueur de disponibilité basé sur l'existence d'un rendez-vous planifié
        disponible: !futureRendezVousList.some((rv) => {
          if (rv.idMedecin !== d.idMedecin) return false;

          const rvDate = rv.date instanceof Date ? rv.date : new Date(rv.date as any);
          const slotDate = new Date(
            `${d.jour instanceof Date
              ? d.jour.toISOString().split("T")[0]
              : new Date(d.jour).toISOString().split("T")[0]
            }T${typeof d.heureDebut === "string" ? d.heureDebut.substring(0, 5) : d.heureDebut}`
          );

          // Considérer égalité à la minute près
          const diffMs = Math.abs(rvDate.getTime() - slotDate.getTime());
          return diffMs < 60 * 1000;
        }),
      }));

      return {
        success: true,
        data: disponibilitesFormatted,
      };
    } catch (error: any) {
      console.error("[RendezVousService] Erreur lors de la récupération des disponibilités actives:", error);
      console.error("[RendezVousService] Stack trace:", error.stack);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de récupérer les disponibilités",
      };
    }
  }

  /**
   * Crée une nouvelle disponibilité
   */
  static async createDisponibilite(
    data: CreateDisponibiliteData
  ): Promise<ServiceResponse<any>> {
    try {
      // Valider les données
      if (!data.jour || !data.heureDebut || !data.heureFin) {
        return {
          success: false,
          error: "Données invalides",
          message: "Le jour, l'heure de début et l'heure de fin sont requis",
        };
      }

      // Convertir le jour en Date
      const jourDate = new Date(data.jour);
      if (isNaN(jourDate.getTime())) {
        return {
          success: false,
          error: "Date invalide",
          message: "Le format de date est invalide",
        };
      }

      // Convertir les heures en format TIME (HH:mm:ss)
      const heureDebutTime = `${data.heureDebut}:00`;
      const heureFinTime = `${data.heureFin}:00`;

      const disponibiliteId = randomUUID();

      await db.insert(disponibilites).values({
        id: disponibiliteId,
        idMedecin: data.idMedecin,
        jour: jourDate,
        heureDebut: heureDebutTime,
        heureFin: heureFinTime,
        lieu: data.lieu || null,
        centreMedical: data.centreMedical || null,
        typeConsultation: data.typeConsultation,
        actif: data.actif ?? true,
      });

      // Récupérer la disponibilité créée
      const created = await db
        .select()
        .from(disponibilites)
        .where(eq(disponibilites.id, disponibiliteId))
        .limit(1);

      if (created.length === 0) {
        return {
          success: false,
          error: "Erreur de création",
          message: "La disponibilité n'a pas pu être créée",
        };
      }

      const disponibilite = created[0];
      return {
        success: true,
        data: {
          id: disponibilite.id,
          idMedecin: disponibilite.idMedecin,
          jour: disponibilite.jour instanceof Date 
            ? disponibilite.jour.toISOString().split("T")[0] 
            : new Date(disponibilite.jour).toISOString().split("T")[0],
          heureDebut: typeof disponibilite.heureDebut === "string" 
            ? disponibilite.heureDebut.substring(0, 5) 
            : disponibilite.heureDebut,
          heureFin: typeof disponibilite.heureFin === "string" 
            ? disponibilite.heureFin.substring(0, 5) 
            : disponibilite.heureFin,
          lieu: disponibilite.lieu || undefined,
          centreMedical: disponibilite.centreMedical || undefined,
          typeConsultation: disponibilite.typeConsultation,
          actif: disponibilite.actif,
        },
        message: "Disponibilité créée avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la création de la disponibilité:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de créer la disponibilité",
      };
    }
  }

  /**
   * Met à jour une disponibilité
   */
  static async updateDisponibilite(
    disponibiliteId: string,
    medecinId: string,
    data: UpdateDisponibiliteData
  ): Promise<ServiceResponse<any>> {
    try {
      // Vérifier que la disponibilité existe et appartient au médecin
      const existing = await db
        .select()
        .from(disponibilites)
        .where(
          and(
            eq(disponibilites.id, disponibiliteId),
            eq(disponibilites.idMedecin, medecinId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        return {
          success: false,
          error: "Disponibilité non trouvée",
          message: "Cette disponibilité n'existe pas ou ne vous appartient pas",
        };
      }

      // Préparer les données de mise à jour
      const updateData: any = {};
      if (data.jour) {
        const jourDate = new Date(data.jour);
        if (isNaN(jourDate.getTime())) {
          return {
            success: false,
            error: "Date invalide",
            message: "Le format de date est invalide",
          };
        }
        updateData.jour = jourDate;
      }
      if (data.heureDebut) {
        updateData.heureDebut = `${data.heureDebut}:00`;
      }
      if (data.heureFin) {
        updateData.heureFin = `${data.heureFin}:00`;
      }
      if (data.lieu !== undefined) {
        updateData.lieu = data.lieu || null;
      }
      if (data.centreMedical !== undefined) {
        updateData.centreMedical = data.centreMedical || null;
      }
      if (data.typeConsultation) {
        updateData.typeConsultation = data.typeConsultation;
      }
      if (data.actif !== undefined) {
        updateData.actif = data.actif;
      }

      await db
        .update(disponibilites)
        .set(updateData)
        .where(eq(disponibilites.id, disponibiliteId));

      // Récupérer la disponibilité mise à jour
      const updated = await db
        .select()
        .from(disponibilites)
        .where(eq(disponibilites.id, disponibiliteId))
        .limit(1);

      const disponibilite = updated[0];
      return {
        success: true,
        data: {
          id: disponibilite.id,
          idMedecin: disponibilite.idMedecin,
          jour: disponibilite.jour instanceof Date 
            ? disponibilite.jour.toISOString().split("T")[0] 
            : new Date(disponibilite.jour).toISOString().split("T")[0],
          heureDebut: typeof disponibilite.heureDebut === "string" 
            ? disponibilite.heureDebut.substring(0, 5) 
            : disponibilite.heureDebut,
          heureFin: typeof disponibilite.heureFin === "string" 
            ? disponibilite.heureFin.substring(0, 5) 
            : disponibilite.heureFin,
          lieu: disponibilite.lieu || undefined,
          centreMedical: disponibilite.centreMedical || undefined,
          typeConsultation: disponibilite.typeConsultation,
          actif: disponibilite.actif,
        },
        message: "Disponibilité mise à jour avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la disponibilité:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de mettre à jour la disponibilité",
      };
    }
  }

  /**
   * Supprime une disponibilité
   */
  static async deleteDisponibilite(
    disponibiliteId: string,
    medecinId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Vérifier que la disponibilité existe et appartient au médecin
      const existing = await db
        .select()
        .from(disponibilites)
        .where(
          and(
            eq(disponibilites.id, disponibiliteId),
            eq(disponibilites.idMedecin, medecinId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        return {
          success: false,
          error: "Disponibilité non trouvée",
          message: "Cette disponibilité n'existe pas ou ne vous appartient pas",
        };
      }

      await db
        .delete(disponibilites)
        .where(eq(disponibilites.id, disponibiliteId));

      return {
        success: true,
        message: "Disponibilité supprimée avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la disponibilité:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: "Impossible de supprimer la disponibilité",
      };
    }
  }

  /**
   * Récupère les rendez-vous d'un médecin
   */
  static async getRendezVousByMedecin(
    medecinId: string
  ): Promise<ServiceResponse<any[]>> {
    try {
      const result = await db
        .select()
        .from(rendezVous)
        .where(eq(rendezVous.idMedecin, medecinId))
        .orderBy(desc(rendezVous.date));

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des rendez-vous:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: "Impossible de récupérer les rendez-vous",
      };
    }
  }

  /**
   * Crée un nouveau rendez-vous
   */
  static async createRendezVous(
    data: CreateRendezVousData
  ): Promise<ServiceResponse<any>> {
    try {
      const rendezVousId = randomUUID();
      const dateRendezVous = data.date instanceof Date 
        ? data.date 
        : new Date(data.date);

      // Vérifier qu'il n'existe pas déjà un rendez-vous planifié
      // pour ce médecin exactement à cette date/heure
      const existing = await db
        .select()
        .from(rendezVous)
        .where(
          and(
            eq(rendezVous.idMedecin, data.idMedecin),
            eq(rendezVous.date, dateRendezVous),
            eq(rendezVous.statut, "Planifié")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          success: false,
          error: "Créneau indisponible",
          message:
            "Ce créneau de rendez-vous a déjà été réservé par un autre patient.",
        };
      }

      await db.insert(rendezVous).values({
        id: rendezVousId,
        idPatient: data.idPatient,
        idMedecin: data.idMedecin,
        date: dateRendezVous,
        type: data.type,
        statut: "Planifié",
        notes: data.notes || null,
        duree: data.duree || null,
      });

      // Récupérer le rendez-vous créé
      const created = await db
        .select()
        .from(rendezVous)
        .where(eq(rendezVous.id, rendezVousId))
        .limit(1);

      return {
        success: true,
        data: created[0],
        message: "Rendez-vous créé avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la création du rendez-vous:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: error.message || "Impossible de créer le rendez-vous",
      };
    }
  }

  /**
   * Annule un rendez-vous
   */
  static async annulerRendezVous(
    rendezVousId: string,
    userId: string,
    userType: string
  ): Promise<ServiceResponse<any>> {
    try {
      // Vérifier que le rendez-vous existe
      const existing = await db
        .select()
        .from(rendezVous)
        .where(eq(rendezVous.id, rendezVousId))
        .limit(1);

      if (existing.length === 0) {
        return {
          success: false,
          error: "Rendez-vous non trouvé",
          message: "Ce rendez-vous n'existe pas",
        };
      }

      const rendezVousData = existing[0];

      // Vérifier que l'utilisateur a le droit d'annuler (patient ou médecin concerné)
      if (
        userType !== "administrateur" &&
        rendezVousData.idPatient !== userId &&
        rendezVousData.idMedecin !== userId
      ) {
        return {
          success: false,
          error: "Accès refusé",
          message: "Vous n'avez pas le droit d'annuler ce rendez-vous",
        };
      }

      await db
        .update(rendezVous)
        .set({ statut: "Annulé" })
        .where(eq(rendezVous.id, rendezVousId));

      return {
        success: true,
        message: "Rendez-vous annulé avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de l'annulation du rendez-vous:", error);
      return {
        success: false,
        error: "Erreur serveur",
        message: "Impossible d'annuler le rendez-vous",
      };
    }
  }
}
