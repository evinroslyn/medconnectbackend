import { db } from "../../infrastructure/database/db";
import { messages } from "../../infrastructure/database/schema/messages";
import { medecins } from "../../infrastructure/database/schema/medecins";
import { patients } from "../../infrastructure/database/schema/patients";
import { utilisateurs } from "../../infrastructure/database/schema/utilisateurs";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ConnexionService } from "./ConnexionService";
import { encryptMessage, decryptMessage } from "../../infrastructure/auth/encryption";

export interface SendMessageData {
  destinataireId: string;
  contenu: string;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Service de gestion des messages
 * Les messages sont uniquement autorisés entre médecins et patients connectés
 */
export class MessageService {
  /**
   * Envoie un message
   * Vérifie que l'expéditeur et le destinataire sont un médecin et un patient connectés
   */
  static async sendMessage(
    expediteurId: string,
    destinataireId: string,
    contenu: string
  ): Promise<MessageResponse> {
    try {
      // Vérifier que les utilisateurs existent
      const expediteur = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, expediteurId))
        .limit(1);

      const destinataire = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, destinataireId))
        .limit(1);

      if (expediteur.length === 0 || destinataire.length === 0) {
        return {
          success: false,
          error: "Utilisateur non trouvé",
          message: "L'expéditeur ou le destinataire n'existe pas",
        };
      }

      const expediteurType = expediteur[0].typeUtilisateur;
      const destinataireType = destinataire[0].typeUtilisateur;

      // Vérifier que c'est une conversation médecin-patient
      const isMedecinPatient =
        (expediteurType === "medecin" && destinataireType === "patient") ||
        (expediteurType === "patient" && destinataireType === "medecin");

      if (!isMedecinPatient) {
        return {
          success: false,
          error: "Type de conversation invalide",
          message: "Les messages sont uniquement autorisés entre médecins et patients",
        };
      }

      // Déterminer qui est le patient et qui est le médecin
      const patientId = expediteurType === "patient" ? expediteurId : destinataireId;
      const medecinId = expediteurType === "medecin" ? expediteurId : destinataireId;

      // Vérifier que le patient et le médecin sont connectés
      const areConnected = await ConnexionService.areConnected(patientId, medecinId);

      console.log(`[MessageService] Vérification connexion: Patient ${patientId}, Médecin ${medecinId}, Connectés: ${areConnected}`);

      if (!areConnected) {
        return {
          success: false,
          error: "Connexion requise",
          message: "Vous devez être connecté à ce médecin/patient pour envoyer des messages",
        };
      }

      // Chiffrer le contenu du message avant de le stocker
      const contenuChiffre = await encryptMessage(contenu.trim());

      // Créer le message
      const messageId = randomUUID();
      await db.insert(messages).values({
        id: messageId,
        idExpediteur: expediteurId,
        idDestinataire: destinataireId,
        contenu: contenuChiffre, // Stocker le contenu chiffré
        dateEnvoi: new Date(),
        confirmationDeLecture: false,
      });

      console.log(`[MessageService] Message créé: ${messageId}, Expéditeur: ${expediteurId}, Destinataire: ${destinataireId}`);

      // Récupérer le message créé
      const newMessage = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (newMessage.length === 0) {
        return {
          success: false,
          error: "Erreur de création",
          message: "Le message n'a pas pu être créé",
        };
      }

      // Déchiffrer le contenu pour le retourner au client
      const contenuDechiffre = await decryptMessage(newMessage[0].contenu);

      return {
        success: true,
        data: {
          id: newMessage[0].id,
          contenu: contenuDechiffre, // Retourner le contenu déchiffré
          dateEnvoi: newMessage[0].dateEnvoi.toISOString(),
          emetteurId: newMessage[0].idExpediteur,
          destinataireId: newMessage[0].idDestinataire,
          lu: newMessage[0].confirmationDeLecture,
          confirmationDeLecture: newMessage[0].confirmationDeLecture,
        },
        message: "Message envoyé avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      return {
        success: false,
        error: "Erreur lors de l'envoi",
        message: error.message,
      };
    }
  }

  /**
   * Récupère une conversation entre deux utilisateurs
   */
  static async getConversation(
    userId: string,
    autreUtilisateurId: string
  ): Promise<MessageResponse> {
    try {
      console.log(`[MessageService] Récupération conversation entre ${userId} et ${autreUtilisateurId}`);
      
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.idExpediteur, userId),
              eq(messages.idDestinataire, autreUtilisateurId)
            ),
            and(
              eq(messages.idExpediteur, autreUtilisateurId),
              eq(messages.idDestinataire, userId)
            )
          )
        )
        .orderBy(asc(messages.dateEnvoi)); // Plus anciens en premier, plus récents en dernier

      console.log(`[MessageService] ${conversationMessages.length} messages trouvés`);

      // Déchiffrer tous les messages
      const formattedMessages = await Promise.all(
        conversationMessages.map(async (msg) => {
          try {
            const contenuDechiffre = await decryptMessage(msg.contenu);
            return {
              id: msg.id,
              contenu: contenuDechiffre,
              dateEnvoi: msg.dateEnvoi.toISOString(),
              emetteurId: msg.idExpediteur,
              destinataireId: msg.idDestinataire,
              lu: msg.confirmationDeLecture,
              confirmationDeLecture: msg.confirmationDeLecture,
            };
          } catch (error) {
            console.error(`[MessageService] Erreur déchiffrement message ${msg.id}:`, error);
            // En cas d'erreur de déchiffrement, retourner un message d'erreur
            return {
        id: msg.id,
              contenu: "[Message non déchiffrable]",
        dateEnvoi: msg.dateEnvoi.toISOString(),
        emetteurId: msg.idExpediteur,
        destinataireId: msg.idDestinataire,
        lu: msg.confirmationDeLecture,
        confirmationDeLecture: msg.confirmationDeLecture,
            };
          }
        })
      );

      return {
        success: true,
        data: formattedMessages,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération de la conversation:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération",
        message: error.message,
      };
    }
  }

  /**
   * Récupère toutes les conversations d'un utilisateur
   */
  static async getConversations(userId: string): Promise<MessageResponse> {
    try {
      // Récupérer tous les messages où l'utilisateur est expéditeur ou destinataire
      const allMessages = await db
        .select()
        .from(messages)
        .where(
          or(eq(messages.idExpediteur, userId), eq(messages.idDestinataire, userId))
        )
        .orderBy(desc(messages.dateEnvoi));

      // Grouper par utilisateur et récupérer le dernier message
      const conversationsMap = new Map<
        string,
        {
          utilisateurId: string;
          nom: string;
          dernierMessage: any;
          nonLu: number;
        }
      >();

      for (const msg of allMessages) {
        const autreUtilisateurId =
          msg.idExpediteur === userId ? msg.idDestinataire : msg.idExpediteur;

        // Déchiffrer le contenu du message
        let contenuDechiffre: string;
        try {
          contenuDechiffre = await decryptMessage(msg.contenu);
        } catch (error) {
          console.error(`[MessageService] Erreur déchiffrement message ${msg.id}:`, error);
          contenuDechiffre = "[Message non déchiffrable]";
        }

        if (!conversationsMap.has(autreUtilisateurId)) {
          // Récupérer le nom de l'autre utilisateur
          const autreUser = await db
            .select()
            .from(utilisateurs)
            .where(eq(utilisateurs.id, autreUtilisateurId))
            .limit(1);

          let nom = "Utilisateur";
          if (autreUser.length > 0) {
            const userType = autreUser[0].typeUtilisateur;
            if (userType === "medecin") {
              const medecin = await db
                .select({ nom: medecins.nom })
                .from(medecins)
                .where(eq(medecins.id, autreUtilisateurId))
                .limit(1);
              nom = medecin.length > 0 ? medecin[0].nom : nom;
            } else if (userType === "patient") {
              const patient = await db
                .select({ nom: patients.nom })
                .from(patients)
                .where(eq(patients.id, autreUtilisateurId))
                .limit(1);
              nom = patient.length > 0 ? patient[0].nom : nom;
            }
          }

          conversationsMap.set(autreUtilisateurId, {
            utilisateurId: autreUtilisateurId,
            nom,
            dernierMessage: {
              id: msg.id,
              contenu: contenuDechiffre,
              dateEnvoi: msg.dateEnvoi.toISOString(),
              emetteurId: msg.idExpediteur,
              destinataireId: msg.idDestinataire,
              lu: msg.confirmationDeLecture,
            },
            nonLu: msg.idDestinataire === userId && !msg.confirmationDeLecture ? 1 : 0,
          });
        } else {
          // Mettre à jour le dernier message si celui-ci est plus récent
          const existing = conversationsMap.get(autreUtilisateurId)!;
              if (new Date(msg.dateEnvoi) > new Date(existing.dernierMessage.dateEnvoi)) {
            existing.dernierMessage = {
              id: msg.id,
              contenu: contenuDechiffre,
              dateEnvoi: msg.dateEnvoi.toISOString(),
              emetteurId: msg.idExpediteur,
              destinataireId: msg.idDestinataire,
              lu: msg.confirmationDeLecture,
            };
          }
          // Compter les messages non lus
          if (msg.idDestinataire === userId && !msg.confirmationDeLecture) {
            existing.nonLu += 1;
          }
        }
      }

      const conversations = Array.from(conversationsMap.values());

      return {
        success: true,
        data: conversations,
      };
    } catch (error: any) {
      console.error("Erreur lors de la récupération des conversations:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération",
        message: error.message,
      };
    }
  }

  /**
   * Marque un message comme lu
   */
  static async markAsRead(messageId: string, userId: string): Promise<MessageResponse> {
    try {
      // Vérifier que le message existe et que l'utilisateur est le destinataire
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (message.length === 0) {
        console.log(`[MessageService] Message ${messageId} non trouvé`);
        return {
          success: false,
          error: "Message non trouvé",
          message: "Le message spécifié n'existe pas",
        };
      }

      const messageData = message[0];
      console.log(`[MessageService] Tentative de marquage: Message ${messageId}, Destinataire: ${messageData.idDestinataire}, User: ${userId}`);

      // Vérifier que l'utilisateur est bien le destinataire
      if (messageData.idDestinataire !== userId) {
        console.log(`[MessageService] Accès refusé: L'utilisateur ${userId} n'est pas le destinataire du message ${messageId}`);
        return {
          success: false,
          error: "Accès refusé",
          message: "Vous ne pouvez marquer comme lu que les messages qui vous sont destinés",
        };
      }

      // Si déjà lu, retourner succès sans erreur
      if (messageData.confirmationDeLecture) {
        return {
          success: true,
          message: "Message déjà marqué comme lu",
        };
      }

      // Marquer comme lu
      await db
        .update(messages)
        .set({ confirmationDeLecture: true })
        .where(eq(messages.id, messageId));

      console.log(`[MessageService] Message ${messageId} marqué comme lu avec succès`);

      return {
        success: true,
        message: "Message marqué comme lu",
      };
    } catch (error: any) {
      console.error("Erreur lors du marquage du message:", error);
      return {
        success: false,
        error: "Erreur lors du marquage",
        message: error.message,
      };
    }
  }
}

