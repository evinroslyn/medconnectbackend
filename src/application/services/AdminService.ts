import { eq } from "drizzle-orm";
import { v4 as randomUUID } from "uuid";
import { db } from "../../infrastructure/database/db";
import { medecins, utilisateurs, messages, patients, administrateurs } from "../../infrastructure/database/schema";
import { hashPassword } from "../../infrastructure/auth/hash";
import { generatePassword, sendPasswordByEmail, sendRejectionEmailByEmail } from "../../infrastructure/auth/email2fa";

/**
 * Interface pour la réponse d'administration
 */
export interface AdminResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Interface pour les médecins en attente
 */
export interface MedecinEnAttente {
  id: string;
  nom: string;
  telephone: string;
  mail: string;
  specialite: string;
  numeroLicence: string;
  documentIdentite: string;
  diplome: string | null;
  photoProfil: string | null;
  dateCreation: Date;
}

/**
 * Service d'administration
 * Gère la validation des médecins et autres tâches administratives
 */
export class AdminService {
  /**
   * Récupérer tous les médecins en attente de validation
   */
  static async getMedecinsEnAttente(): Promise<AdminResponse> {
    try {
      const medecinsEnAttente = await db
        .select({
          id: medecins.id,
          nom: medecins.nom,
          telephone: utilisateurs.telephone,
          mail: utilisateurs.mail,
          specialite: medecins.specialite,
          numeroLicence: medecins.numeroLicence,
          documentIdentite: medecins.documentIdentite,
          diplome: medecins.diplome,
          photoProfil: medecins.photoProfil,
          dateCreation: utilisateurs.dateCreation,
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(medecins.statutVerification, "en_attente"));

      return {
        success: true,
        message: "Médecins en attente récupérés avec succès",
        data: medecinsEnAttente
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des médecins en attente:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération des médecins en attente"
      };
    }
  }

  /**
   * Valider un médecin
   */
  static async validerMedecin(medecinId: string): Promise<AdminResponse> {
    try {
      // Vérifier que le médecin existe et est en attente
      const medecinData = await db
        .select({
          medecin: medecins,
          utilisateur: utilisateurs
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(medecins.id, medecinId))
        .limit(1);

      if (medecinData.length === 0) {
        return {
          success: false,
          message: "Médecin non trouvé"
        };
      }

      const medecin = medecinData[0].medecin;
      const utilisateur = medecinData[0].utilisateur;

      if (medecin.statutVerification !== "en_attente") {
        return {
          success: false,
          message: "Ce médecin n'est pas en attente de validation"
        };
      }

      // Générer un nouveau mot de passe sécurisé
      const newPassword = generatePassword(12);
      const hashedPassword = await hashPassword(newPassword);

      // Mettre à jour le statut et le mot de passe
      await db
        .update(medecins)
        .set({ statutVerification: "valide" })
        .where(eq(medecins.id, medecinId));

      await db
        .update(utilisateurs)
        .set({ motDePasse: hashedPassword })
        .where(eq(utilisateurs.id, medecinId));

      // Envoyer le mot de passe par email
      try {
        await sendPasswordByEmail(utilisateur.mail, newPassword, medecin.nom);
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        // Continuer même si l'email échoue
      }

      return {
        success: true,
        message: "Médecin validé avec succès. Le mot de passe a été envoyé par email."
      };
    } catch (error) {
      console.error("Erreur lors de la validation du médecin:", error);
      return {
        success: false,
        message: "Erreur lors de la validation du médecin"
      };
    }
  }

  /**
   * Rejeter un médecin
   */
  static async rejeterMedecin(medecinId: string, motif?: string): Promise<AdminResponse> {
    try {
      // Vérifier que le médecin existe et est en attente
      const medecinData = await db
        .select({
          medecin: medecins,
          utilisateur: utilisateurs
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(medecins.id, medecinId))
        .limit(1);

      if (medecinData.length === 0) {
        return {
          success: false,
          message: "Médecin non trouvé"
        };
      }

      const medecin = medecinData[0].medecin;
      const utilisateur = medecinData[0].utilisateur;

      if (medecin.statutVerification !== "en_attente") {
        return {
          success: false,
          message: "Ce médecin n'est pas en attente de validation"
        };
      }

      // Supprimer le médecin et l'utilisateur de la base de données
      // La suppression de l'utilisateur supprimera automatiquement le médecin grâce au CASCADE
      await db.delete(utilisateurs).where(eq(utilisateurs.id, medecinId));
      console.log(`✅ Médecin ${medecin.nom} (ID: ${medecinId}) supprimé de la base de données`);

      // Envoyer un email de notification du rejet
      try {
        if (utilisateur.mail) {
          await sendRejectionEmailByEmail(
            utilisateur.mail,
            medecin.nom,
            motif
          );
          console.log(`✅ Email de rejet envoyé à ${utilisateur.mail}`);
        } else {
          console.warn(`⚠️ Aucun email trouvé pour le médecin ${medecin.nom}, impossible d'envoyer l'email de rejet`);
        }
      } catch (emailError) {
        console.error("⚠️ Erreur lors de l'envoi de l'email de rejet:", emailError);
        // Continuer même si l'email échoue
      }

      // Créer un message de notification du rejet dans la base de données
      try {
        // Utiliser l'ID admin "system" ou créer un message sans expéditeur particulier
        const messageId = randomUUID();
        const motifMessage = motif 
          ? `Votre demande d'inscription a été rejetée.\n\nMotif du rejet: ${motif}`
          : `Votre demande d'inscription a été rejetée.`;

        // Chercher un administrateur pour envoyer le message
        const admin = await db
          .select()
          .from(utilisateurs)
          .where(eq(utilisateurs.typeUtilisateur, "administrateur"))
          .limit(1);

        if (admin.length > 0) {
          await db.insert(messages).values({
            id: messageId,
            idExpediteur: admin[0].id,
            idDestinataire: medecinId,
            contenu: motifMessage,
            dateEnvoi: new Date(),
            confirmationDeLecture: false
          });
          console.log("✅ Message de rejet créé dans la base de données");
        }
      } catch (messageError) {
        console.error("⚠️ Erreur lors de la création du message de notification:", messageError);
        // Continuer même si le message échoue
      }

      return {
        success: true,
        message: `Médecin rejeté avec succès${motif ? `. Motif: ${motif}` : ""}`
      };
    } catch (error) {
      console.error("Erreur lors du rejet du médecin:", error);
      return {
        success: false,
        message: "Erreur lors du rejet du médecin"
      };
    }
  }

  /**
   * Récupérer les statistiques d'administration
   */
  static async getStatistiques(): Promise<AdminResponse> {
    try {
      // Compter les médecins par statut
      const medecinsEnAttente = await db
        .select()
        .from(medecins)
        .where(eq(medecins.statutVerification, "en_attente"));

      const medecinsValides = await db
        .select()
        .from(medecins)
        .where(eq(medecins.statutVerification, "valide"));

      const medecinsRejetes = await db
        .select()
        .from(medecins)
        .where(eq(medecins.statutVerification, "rejete"));

      // Compter tous les utilisateurs par type
      const patients = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.typeUtilisateur, "patient"));

      const administrateurs = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.typeUtilisateur, "administrateur"));

      const statistiques = {
        medecins: {
          enAttente: medecinsEnAttente.length,
          valides: medecinsValides.length,
          rejetes: medecinsRejetes.length,
          total: medecinsEnAttente.length + medecinsValides.length + medecinsRejetes.length
        },
        patients: {
          total: patients.length
        },
        administrateurs: {
          total: administrateurs.length
        }
      };

      return {
        success: true,
        message: "Statistiques récupérées avec succès",
        data: statistiques
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération des statistiques"
      };
    }
  }

  /**
   * Récupérer tous les patients
   */
  static async getAllPatients(): Promise<AdminResponse> {
    try {
      const patientsData = await db
        .select({
          id: utilisateurs.id,
          mail: utilisateurs.mail,
          telephone: utilisateurs.telephone,
          adresse: utilisateurs.adresse,
          dateCreation: utilisateurs.dateCreation,
          nom: patients.nom,
          dateNaissance: patients.dateNaissance,
          genre: patients.genre,
        })
        .from(utilisateurs)
        .innerJoin(patients, eq(utilisateurs.id, patients.id))
        .where(eq(utilisateurs.typeUtilisateur, "patient"));

      return {
        success: true,
        message: "Patients récupérés avec succès",
        data: patientsData
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des patients:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération des patients"
      };
    }
  }

  /**
   * Récupérer tous les utilisateurs avec leurs noms depuis les tables spécifiques
   */
  static async getAllUsers(): Promise<AdminResponse> {
    try {
      // Récupérer tous les utilisateurs
      const allUsers = await db.select().from(utilisateurs);

      // Pour chaque utilisateur, récupérer le nom depuis la table appropriée
      const usersWithNames = await Promise.all(
        allUsers.map(async (user) => {
          let nom = null;
          
          if (user.typeUtilisateur === "patient") {
            const patientData = await db
              .select({ nom: patients.nom })
              .from(patients)
              .where(eq(patients.id, user.id))
              .limit(1);
            nom = patientData[0]?.nom || null;
          } else if (user.typeUtilisateur === "medecin") {
            const medecinData = await db
              .select({ nom: medecins.nom })
              .from(medecins)
              .where(eq(medecins.id, user.id))
              .limit(1);
            nom = medecinData[0]?.nom || null;
          } else if (user.typeUtilisateur === "administrateur") {
            const adminData = await db
              .select({ nom: administrateurs.nom })
              .from(administrateurs)
              .where(eq(administrateurs.id, user.id))
              .limit(1);
            nom = adminData[0]?.nom || null;
          }

          return {
            ...user,
            nom: nom || user.mail?.split("@")[0] || "N/A"
          };
        })
      );

      const medecinsList = usersWithNames.filter(u => u.typeUtilisateur === "medecin");
      const patientsList = usersWithNames.filter(u => u.typeUtilisateur === "patient");
      const administrateursList = usersWithNames.filter(u => u.typeUtilisateur === "administrateur");

      return {
        success: true,
        message: "Utilisateurs récupérés avec succès",
        data: {
          allUsers: usersWithNames,
          medecins: medecinsList,
          patients: patientsList,
          administrateurs: administrateursList,
          total: usersWithNames.length
        }
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération des utilisateurs"
      };
    }
  }
}