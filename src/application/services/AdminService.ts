import { eq, desc, and } from "drizzle-orm";
import { v4 as randomUUID } from "uuid";
import { db } from "../../infrastructure/database/db";
import { medecins, utilisateurs, messages, patients, administrateurs, historiqueValidations } from "../../infrastructure/database/schema";
import { hashPassword } from "../../infrastructure/auth/hash";
import { generatePassword, sendPasswordByEmail, sendRejectionEmailByEmail } from "../../infrastructure/auth/email2fa";

/**
 * Interface pour la réponse d'administration
 */
export interface AdminResponse {
  success: boolean;
  message: string;
  data?: unknown;
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
 * Interface pour l'historique des actions
 */
export interface HistoriqueAction {
  id: string;
  action: "validation" | "rejet" | "mise_en_attente";
  statutAvant: string;
  statutApres: string;
  motif?: string;
  dateAction: Date;
  commentaireAdmin?: string;
  adminNom: string;
  adminEmail: string;
}

/**
 * Interface pour les médecins avec historique
 */
export interface MedecinAvecHistorique extends MedecinEnAttente {
  dateValidation?: Date;
  motifRejet?: string;
  adminValidateurNom?: string;
  historique: HistoriqueAction[];
}

/**
 * Service d'administration
 * Gère la validation des médecins et autres tâches administratives
 */
export class AdminService {
  /**
   * Enregistrer une action dans l'historique
   */
  private static async enregistrerHistorique(
    medecinId: string,
    adminId: string,
    action: "validation" | "rejet" | "mise_en_attente",
    statutAvant: string,
    statutApres: string,
    motif?: string,
    commentaireAdmin?: string,
    adresseIP?: string
  ): Promise<void> {
    try {
      await db.insert(historiqueValidations).values({
        id: randomUUID(),
        medecinId,
        adminId,
        action,
        statutAvant,
        statutApres,
        motif,
        commentaireAdmin,
        adresseIP,
        dateAction: new Date(),
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'historique:", error);
      // Ne pas faire échouer l'opération principale si l'historique échoue
    }
  }

  /**
   * Récupérer l'historique d'un médecin
   */
  static async getHistoriqueMedecin(medecinId: string): Promise<AdminResponse> {
    try {
      const historique = await db
        .select({
          id: historiqueValidations.id,
          action: historiqueValidations.action,
          statutAvant: historiqueValidations.statutAvant,
          statutApres: historiqueValidations.statutApres,
          motif: historiqueValidations.motif,
          dateAction: historiqueValidations.dateAction,
          commentaireAdmin: historiqueValidations.commentaireAdmin,
          adminNom: administrateurs.nom,
          adminEmail: utilisateurs.mail,
        })
        .from(historiqueValidations)
        .leftJoin(utilisateurs, eq(historiqueValidations.adminId, utilisateurs.id))
        .leftJoin(administrateurs, eq(historiqueValidations.adminId, administrateurs.id))
        .where(eq(historiqueValidations.medecinId, medecinId))
        .orderBy(desc(historiqueValidations.dateAction));

      return {
        success: true,
        message: "Historique récupéré avec succès",
        data: historique
      };
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération de l'historique"
      };
    }
  }
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
   * Récupérer tous les médecins validés avec historique
   */
  static async getMedecinsValides(): Promise<AdminResponse> {
    try {
      const medecinsValides = await db
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
          dateValidation: medecins.dateValidation,
          adminValidateurId: medecins.adminValidateurId,
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(medecins.statutVerification, "valide"));

      // Enrichir avec l'historique et les informations de l'admin validateur
      const medecinsAvecHistorique = await Promise.all(
        medecinsValides.map(async (medecin: any) => {
          // Récupérer l'historique
          const historiqueResult = await this.getHistoriqueMedecin(medecin.id);
          const historique = historiqueResult.success ? historiqueResult.data : [];

          // Récupérer le nom de l'admin validateur
          let adminValidateurNom = "Administrateur supprimé";
          if (medecin.adminValidateurId) {
            const adminData = await db
              .select({ nom: administrateurs.nom })
              .from(administrateurs)
              .where(eq(administrateurs.id, medecin.adminValidateurId))
              .limit(1);

            if (adminData.length > 0) {
              adminValidateurNom = adminData[0].nom;
            }
          }

          return {
            ...medecin,
            adminValidateurNom,
            historique
          };
        })
      );

      return {
        success: true,
        message: "Médecins validés récupérés avec succès",
        data: medecinsAvecHistorique
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des médecins validés:", error);
      console.error("Détails de l'erreur:", error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: `Erreur lors de la récupération des médecins validés: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Récupérer tous les médecins rejetés avec historique
   */
  static async getMedecinsRejetes(): Promise<AdminResponse> {
    try {
      const medecinsRejetes = await db
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
          dateValidation: medecins.dateValidation,
          motifRejet: medecins.motifRejet,
          adminValidateurId: medecins.adminValidateurId,
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(medecins.statutVerification, "rejete"));

      // Enrichir avec l'historique et les informations de l'admin validateur
      const medecinsAvecHistorique = await Promise.all(
        medecinsRejetes.map(async (medecin: any) => {
          // Récupérer l'historique
          const historiqueResult = await this.getHistoriqueMedecin(medecin.id);
          const historique = historiqueResult.success ? historiqueResult.data : [];

          // Récupérer le nom de l'admin validateur
          let adminValidateurNom = "Administrateur supprimé";
          if (medecin.adminValidateurId) {
            const adminData = await db
              .select({ nom: administrateurs.nom })
              .from(administrateurs)
              .where(eq(administrateurs.id, medecin.adminValidateurId))
              .limit(1);

            if (adminData.length > 0) {
              adminValidateurNom = adminData[0].nom;
            }
          }

          return {
            ...medecin,
            adminValidateurNom,
            historique
          };
        })
      );

      return {
        success: true,
        message: "Médecins rejetés récupérés avec succès",
        data: medecinsAvecHistorique
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des médecins rejetés:", error);
      console.error("Détails de l'erreur:", error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: `Erreur lors de la récupération des médecins rejetés: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Valider un médecin
   */
  static async validerMedecin(medecinId: string, adminId?: string, adresseIP?: string): Promise<AdminResponse> {
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
      const statutAvant = medecin.statutVerification;

      if (medecin.statutVerification !== "en_attente") {
        return {
          success: false,
          message: "Ce médecin n'est pas en attente de validation"
        };
      }

      // Générer un nouveau mot de passe sécurisé
      const newPassword = generatePassword(12);
      const hashedPassword = await hashPassword(newPassword);

      console.log('🔐 ═══════════════════════════════════════════════════════════════');
      console.log('🔐 VALIDATION DE MÉDECIN - NOUVEAU MOT DE PASSE GÉNÉRÉ');
      console.log('🔐 ═══════════════════════════════════════════════════════════════');
      console.log(`🔐 Médecin: ${medecin.nom}`);
      console.log(`🔐 Email: ${utilisateur.mail}`);
      console.log(`🔐 MOT DE PASSE NON-CRYPTÉ: ${newPassword}`);
      console.log(`🔐 MOT DE PASSE CRYPTÉ: ${hashedPassword.substring(0, 30)}...`);
      console.log('🔐 ═══════════════════════════════════════════════════════════════');

      // Mettre à jour le statut et le mot de passe
      await db
        .update(medecins)
        .set({
          statutVerification: "valide",
          dateValidation: new Date(),
          adminValidateurId: adminId
        })
        .where(eq(medecins.id, medecinId));

      await db
        .update(utilisateurs)
        .set({ motDePasse: hashedPassword })
        .where(eq(utilisateurs.id, medecinId));

      // Enregistrer l'action dans l'historique
      if (adminId) {
        await this.enregistrerHistorique(
          medecinId,
          adminId,
          "validation",
          statutAvant,
          "valide",
          "Médecin validé avec succès",
          "Validation automatique avec génération de mot de passe",
          adresseIP
        );
      }

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
  static async rejeterMedecin(medecinId: string, motif?: string, adminId?: string, adresseIP?: string): Promise<AdminResponse> {
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
      const statutAvant = medecin.statutVerification;

      if (medecin.statutVerification !== "en_attente") {
        return {
          success: false,
          message: "Ce médecin n'est pas en attente de validation"
        };
      }

      const motifFinal = motif || "Aucun motif spécifié";

      // Mettre à jour le statut de rejet avec le motif
      await db
        .update(medecins)
        .set({
          statutVerification: "rejete",
          motifRejet: motifFinal,
          dateValidation: new Date(),
          adminValidateurId: adminId
        })
        .where(eq(medecins.id, medecinId));

      // Enregistrer l'action dans l'historique
      if (adminId) {
        await this.enregistrerHistorique(
          medecinId,
          adminId,
          "rejet",
          statutAvant,
          "rejete",
          motifFinal,
          `Demande rejetée pour le motif: ${motifFinal}`,
          adresseIP
        );
      }

      console.log(`✅ Médecin ${medecin.nom} (ID: ${medecinId}) marqué comme rejeté`);

      // Envoyer un email de notification du rejet
      try {
        if (utilisateur.mail) {
          await sendRejectionEmailByEmail(
            utilisateur.mail,
            medecin.nom,
            motifFinal
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
        const messageId = randomUUID();
        const motifMessage = `Votre demande d'inscription a été rejetée.\n\nMotif du rejet: ${motifFinal}`;

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
        message: `Médecin rejeté avec succès. Motif: ${motifFinal}`
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
   * Rechercher des médecins avec filtres
   */
  static async rechercherMedecins(filtres: {
    statut?: string;
    nom?: string;
    specialite?: string;
    numeroLicence?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminResponse> {
    try {
      const { statut, nom, specialite, numeroLicence, dateDebut: _dateDebut, dateFin: _dateFin, page = 1, limit = 10 } = filtres;
      // Mark date filters as used to avoid "assigned but never used" warnings
      void _dateDebut; // may be used later for advanced date filtering
      void _dateFin; // may be used later for advanced date filtering

      let query = db
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
          dateValidation: medecins.dateValidation,
          motifRejet: medecins.motifRejet,
          statutVerification: medecins.statutVerification,
          adminValidateurId: medecins.adminValidateurId,
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id));

      // Appliquer les filtres
      const conditions = [];

      if (statut) {
        conditions.push(eq(medecins.statutVerification, statut));
      }

      if (nom) {
        conditions.push(eq(medecins.nom, nom));
      }

      if (specialite) {
        conditions.push(eq(medecins.specialite, specialite));
      }

      if (numeroLicence) {
        conditions.push(eq(medecins.numeroLicence, numeroLicence));
      }

      if (conditions.length > 0) {
        query = (query as unknown as { where: (...args: unknown[]) => typeof query }).where(and(...conditions));
      }

      // Pagination
      const offset = (page - 1) * limit;
      const resultats = await query.limit(limit).offset(offset);

      // Compter le total pour la pagination
      let countQuery = db
        .select({ count: medecins.id })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id));

      if (conditions.length > 0) {
        countQuery = (countQuery as unknown as { where: (...args: unknown[]) => typeof countQuery }).where(and(...conditions));
      }

      const totalCount = await countQuery;
      const total = totalCount.length;

      // Enrichir avec l'historique
      const resultatsAvecHistorique = await Promise.all(
        resultats.map(async (medecin: any) => {
          const historiqueResult = await this.getHistoriqueMedecin(medecin.id);
          const historique = historiqueResult.success ? historiqueResult.data : [];

          let adminValidateurNom = "Aucun";
          if (medecin.adminValidateurId) {
            const adminData = await db
              .select({ nom: administrateurs.nom })
              .from(administrateurs)
              .where(eq(administrateurs.id, medecin.adminValidateurId))
              .limit(1);

            if (adminData.length > 0) {
              adminValidateurNom = adminData[0].nom;
            }
          }

          return {
            ...medecin,
            adminValidateurNom,
            historique
          };
        })
      );

      return {
        success: true,
        message: "Recherche effectuée avec succès",
        data: {
          medecins: resultatsAvecHistorique,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      return {
        success: false,
        message: "Erreur lors de la recherche"
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
        .select({ id: medecins.id })
        .from(medecins)
        .where(eq(medecins.statutVerification, "en_attente"));

      const medecinsValides = await db
        .select({ id: medecins.id })
        .from(medecins)
        .where(eq(medecins.statutVerification, "valide"));

      const medecinsRejetes = await db
        .select({ id: medecins.id })
        .from(medecins)
        .where(eq(medecins.statutVerification, "rejete"));

      // Compter tous les utilisateurs par type
      const patientsCount = await db
        .select({ id: utilisateurs.id })
        .from(utilisateurs)
        .where(eq(utilisateurs.typeUtilisateur, "patient"));

      const administrateursCount = await db
        .select({ id: utilisateurs.id })
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
          total: patientsCount.length
        },
        administrateurs: {
          total: administrateursCount.length
        }
      };

      return {
        success: true,
        message: "Statistiques récupérées avec succès",
        data: statistiques
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      console.error("Détails de l'erreur:", error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: `Erreur lors de la récupération des statistiques: ${error instanceof Error ? error.message : String(error)}`
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
        allUsers.map(async (user: any) => {
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

  /**
   * Récupérer un utilisateur par son ID avec ses données spécifiques
   */
  static async getUserById(userId: string): Promise<AdminResponse> {
    try {
      const user = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: "Utilisateur non trouvé"
        };
      }

      const userData = user[0];
      let specificData = null;

      // Récupérer les données spécifiques selon le type
      if (userData.typeUtilisateur === "medecin") {
        const medecin = await db
          .select()
          .from(medecins)
          .where(eq(medecins.id, userId))
          .limit(1);
        specificData = medecin[0] || null;
      } else if (userData.typeUtilisateur === "patient") {
        const patient = await db
          .select()
          .from(patients)
          .where(eq(patients.id, userId))
          .limit(1);
        specificData = patient[0] || null;
      } else if (userData.typeUtilisateur === "administrateur") {
        const admin = await db
          .select()
          .from(administrateurs)
          .where(eq(administrateurs.id, userId))
          .limit(1);
        specificData = admin[0] || null;
      }

      return {
        success: true,
        message: "Utilisateur récupéré avec succès",
        data: {
          ...userData,
          details: specificData
        }
      };
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération de l'utilisateur"
      };
    }
  }

  /**
   * Supprimer un utilisateur (la suppression en cascade gérera les tables liées)
   */
  static async deleteUser(userId: string): Promise<AdminResponse> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: "Utilisateur non trouvé"
        };
      }

      // Supprimer l'utilisateur de la table de base
      // Grâce à onDelete: "cascade", les entrées dans medecins/patients/etc seront supprimées
      await db.delete(utilisateurs).where(eq(utilisateurs.id, userId));

      return {
        success: true,
        message: "Utilisateur supprimé avec succès"
      };
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return {
        success: false,
        message: "Erreur lors de la suppression de l'utilisateur"
      };
    }
  }
}