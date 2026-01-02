import { db } from "../../infrastructure/database/db";
import { utilisateurs } from "../../infrastructure/database/schema/utilisateurs";
import { eq } from "drizzle-orm";

export interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

/**
 * Service de gestion du statut en ligne des utilisateurs
 */
export class UserStatusService {
  /**
   * Met à jour la dernière connexion d'un utilisateur (heartbeat)
   */
  static async updateLastSeen(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await db
        .update(utilisateurs)
        .set({
          derniereConnexion: new Date(),
        })
        .where(eq(utilisateurs.id, userId));

      return { success: true };
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la dernière connexion:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du statut",
      };
    }
  }

  /**
   * Récupère le statut d'un utilisateur
   */
  static async getUserStatus(userId: string): Promise<UserStatus | null> {
    try {
      const user = await db
        .select({
          id: utilisateurs.id,
          derniereConnexion: utilisateurs.derniereConnexion,
        })
        .from(utilisateurs)
        .where(eq(utilisateurs.id, userId))
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      const userData = user[0];
      const lastSeen = userData.derniereConnexion || new Date();
      const isOnline = UserStatusService.isUserOnline(lastSeen);

      return {
        userId: userData.id,
        isOnline,
        lastSeen: lastSeen.toISOString(),
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération du statut utilisateur:", error);
      return null;
    }
  }

  /**
   * Récupère le statut de plusieurs utilisateurs
   */
  static async getMultipleUserStatus(userIds: string[]): Promise<UserStatus[]> {
    try {
      // Pour l'instant, faire une requête par utilisateur (à optimiser plus tard)
      const statuses: UserStatus[] = [];
      
      for (const userId of userIds) {
        const userResult = await db
          .select({
            id: utilisateurs.id,
            derniereConnexion: utilisateurs.derniereConnexion,
          })
          .from(utilisateurs)
          .where(eq(utilisateurs.id, userId))
          .limit(1);

        if (userResult.length > 0) {
          const userData = userResult[0];
          const lastSeen = userData.derniereConnexion || new Date();
          const isOnline = UserStatusService.isUserOnline(lastSeen);

          statuses.push({
            userId: userData.id,
            isOnline,
            lastSeen: lastSeen.toISOString(),
          });
        } else {
          // Utilisateur non trouvé, considérer comme hors ligne
          statuses.push({
            userId,
            isOnline: false,
            lastSeen: new Date().toISOString(),
          });
        }
      }

      return statuses;
    } catch (error: any) {
      console.error("Erreur lors de la récupération des statuts utilisateurs:", error);
      return userIds.map(userId => ({
        userId,
        isOnline: false,
        lastSeen: new Date().toISOString(),
      }));
    }
  }

  /**
   * Détermine si un utilisateur est en ligne basé sur sa dernière connexion
   * Un utilisateur est considéré en ligne s'il s'est connecté dans les 5 dernières minutes
   */
  private static isUserOnline(lastSeen: Date): boolean {
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    return diffInMinutes <= 5; // En ligne si vu dans les 5 dernières minutes
  }
}