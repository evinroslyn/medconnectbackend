import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { utilisateurs, patients, medecins, administrateurs } from "../../infrastructure/database/schema";
import { hashPassword, comparePassword } from "../../infrastructure/auth/hash";
import { generateToken } from "../../infrastructure/auth/jwt";
import { generate2FASecret, generate2FAUrl, verify2FA } from "../../infrastructure/auth/2fa";
import { generateVerificationCode, sendVerificationCodeByEmail, sendPasswordResetCodeByEmail, verifyCode, generatePassword } from "../../infrastructure/auth/email2fa";
import { randomUUID } from "crypto";

/**
 * Interface pour l'inscription d'un utilisateur
 */
export interface RegisterUserData {
  telephone: string;
  motDePasse?: string; // Optionnel pour les médecins (généré lors de la validation)
  typeUtilisateur: "patient" | "medecin" | "administrateur";
  nom: string;
  mail: string; // Email obligatoire pour recevoir les codes de vérification
  adresse?: string;
  // Champs spécifiques selon le type
  dateNaissance?: string; // Pour les patients
  genre?: "Homme" | "Femme" | "Autre"; // Pour les patients
  specialite?: string; // Pour les médecins
  numeroLicence?: string; // Pour les médecins
  documentIdentite?: string; // Pour les médecins (CNI/Passeport)
  diplome?: string; // Pour les médecins (chemin vers le diplôme)
  photoProfil?: string; // Pour les médecins (chemin vers la photo de profil)
}

/**
 * Interface pour la connexion
 */
export interface LoginData {
  telephone?: string;
  mail?: string;
  motDePasse: string;
  code2FA?: string;
}

/**
 * Interface pour la réponse d'authentification
 */
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    telephone: string;
    typeUtilisateur: string;
    nom: string;
    mail?: string;
    require2FA?: boolean;
    qrCode2FA?: string;
  };
  message: string;
}

/**
 * Service d'authentification
 * Gère l'inscription, la connexion et l'authentification 2FA
 */
export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(userData: RegisterUserData): Promise<AuthResponse> {
    try {
      // Vérifier si l'utilisateur existe déjà par téléphone
      const existingUserByPhone = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.telephone, userData.telephone))
        .limit(1);

      if (existingUserByPhone.length > 0) {
        return {
          success: false,
          message: `Le numéro de téléphone "${userData.telephone}" est déjà utilisé. Veuillez utiliser un autre numéro ou vous connecter.`
        };
      }

      // Vérifier si l'utilisateur existe déjà par email
      const existingUserByEmail = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.mail, userData.mail))
        .limit(1);

      if (existingUserByEmail.length > 0) {
        return {
          success: false,
          message: `L'adresse email "${userData.mail}" est déjà utilisée. Veuillez utiliser un autre email ou vous connecter avec ce compte.`
        };
      }

      // Valider le numéro de téléphone
      if (!this.isValidPhoneNumber(userData.telephone)) {
        return {
          success: false,
          message: `Format de numéro de téléphone invalide : "${userData.telephone}".\n\nFormat attendu (camerounais) :\n• 612345678 (9 chiffres, commence par 6 ou 7)\n• +237612345678 (format international)`
        };
      }

      // Pour les médecins, ne pas valider le mot de passe (il sera généré lors de la validation)
      // Pour les autres types, valider le mot de passe
      let hashedPassword: string;
      if (userData.typeUtilisateur === "medecin") {
        // Générer un mot de passe temporaire qui sera remplacé lors de la validation
        const tempPassword = generatePassword(16);
        hashedPassword = await hashPassword(tempPassword);

        console.log('👨‍⚕️ ═══════════════════════════════════════════════════════════════');
        console.log('👨‍⚕️ CRÉATION DE MÉDECIN - MOT DE PASSE TEMPORAIRE GÉNÉRÉ');
        console.log('👨‍⚕️ ═══════════════════════════════════════════════════════════════');
        console.log(`👨‍⚕️ Nom: ${userData.nom}`);
        console.log(`👨‍⚕️ Email: ${userData.mail}`);
        console.log(`👨‍⚕️ Spécialité: ${userData.specialite}`);
        console.log(`👨‍⚕️ MOT DE PASSE TEMPORAIRE NON-CRYPTÉ: ${tempPassword}`);
        console.log(`👨‍⚕️ MOT DE PASSE TEMPORAIRE CRYPTÉ: ${hashedPassword.substring(0, 30)}...`);
        console.log('👨‍⚕️ ⚠️  Ce mot de passe sera remplacé lors de la validation par l\'admin');
        console.log('👨‍⚕️ ═══════════════════════════════════════════════════════════════');
      } else {
        // Valider le mot de passe pour les patients et administrateurs
        if (!userData.motDePasse) {
          return {
            success: false,
            message: "Le mot de passe est requis pour les patients et administrateurs"
          };
        }

        if (userData.motDePasse.length < 8) {
          return {
            success: false,
            message: `Le mot de passe est trop court. Il contient ${userData.motDePasse.length} caractère(s) mais doit en contenir au moins 8.`
          };
        }

        // Valider la complexité du mot de passe
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(userData.motDePasse)) {
          return {
            success: false,
            message: "Le mot de passe ne respecte pas les critères de sécurité.\n\nIl doit contenir :\n• Au moins une lettre minuscule\n• Au moins une lettre majuscule\n• Au moins un chiffre"
          };
        }

        hashedPassword = await hashPassword(userData.motDePasse);
      }
      const userId = randomUUID();

      // Valider l'email
      if (!userData.mail || !userData.mail.includes("@") || userData.mail.includes("@medconnect.local")) {
        return {
          success: false,
          message: "Une adresse email valide est obligatoire pour recevoir les codes de vérification. Format attendu: exemple@domaine.com"
        };
      }

      // Utiliser une transaction pour garantir que l'utilisateur et son profil spécifique sont créés ensemble
      await db.transaction(async (tx) => {
        // 1. Créer l'utilisateur de base
        await tx.insert(utilisateurs).values({
          id: userId,
          mail: userData.mail,
          motDePasse: hashedPassword,
          telephone: userData.telephone || null,
          typeUtilisateur: userData.typeUtilisateur,
          adresse: userData.adresse || null,
          dateCreation: new Date(),
        });

        // 2. Créer l'enregistrement spécifique selon le type
        switch (userData.typeUtilisateur) {
          case "patient": {
            if (!userData.dateNaissance) {
              throw new Error("La date de naissance est obligatoire pour les patients");
            }
            if (!userData.genre) {
              throw new Error("Le genre est obligatoire pour les patients");
            }
            const dateNaissanceFormatted = userData.dateNaissance.split("T")[0];

            await tx.insert(patients).values({
              id: userId,
              nom: userData.nom,
              dateNaissance: dateNaissanceFormatted as any,
              genre: userData.genre,
            });
            break;
          }

          case "medecin":
            if (!userData.specialite || !userData.numeroLicence || !userData.documentIdentite || !userData.diplome) {
              throw new Error("Spécialité, numéro de licence, document d'identité et diplôme requis pour les médecins");
            }
            await tx.insert(medecins).values({
              id: userId,
              nom: userData.nom,
              specialite: userData.specialite,
              numeroLicence: userData.numeroLicence,
              statutVerification: "en_attente",
              documentIdentite: userData.documentIdentite,
              diplome: userData.diplome,
              photoProfil: userData.photoProfil || null,
              // Nouveaux champs supportés par le schéma
              anneesExperience: (userData as any).anneesExperience || null,
              description: (userData as any).description || null,
              education: (userData as any).education || null,
              specialisations: (userData as any).specialisations || null,
            });
            break;

          case "administrateur":
            await tx.insert(administrateurs).values({
              id: userId,
              nom: userData.nom,
            });
            break;
        }
      });

      // Pour les médecins, ne pas générer de token (ils doivent attendre la validation)
      if (userData.typeUtilisateur === "medecin") {
        return {
          success: true,
          user: {
            id: userId,
            telephone: userData.telephone || "",
            typeUtilisateur: userData.typeUtilisateur,
            nom: userData.nom,
          },
          message: "Votre demande d'inscription a été soumise avec succès. Un administrateur va examiner votre demande et vous contactera par email avec vos identifiants de connexion une fois votre compte validé."
        };
      }

      // Générer le token JWT pour les autres types
      const token = generateToken({
        userId,
        telephone: userData.telephone || "",
        typeUtilisateur: userData.typeUtilisateur,
      });

      return {
        success: true,
        token,
        user: {
          id: userId,
          telephone: userData.telephone || "",
          typeUtilisateur: userData.typeUtilisateur,
          nom: userData.nom,
        },
        message: "Inscription réussie"
      };

    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      console.error("Stack trace:", error.stack);

      // Extraire le message d'erreur détaillé
      let errorMessage = "Erreur lors de l'inscription";

      if (error.message) {
        const errorMsg = error.message.toString();

        // Détecter les erreurs de duplication d'email
        if (errorMsg.includes("Duplicate entry") && errorMsg.includes("mail")) {
          const emailMatch = errorMsg.match(/'([^']+)'/);
          const email = emailMatch ? emailMatch[1] : "cet email";
          errorMessage = `L'adresse email "${email}" est déjà utilisée. Veuillez utiliser un autre email ou vous connecter avec ce compte.`;
        }
        // Détecter les erreurs de duplication de téléphone
        else if (errorMsg.includes("Duplicate entry") && errorMsg.includes("telephone")) {
          const phoneMatch = errorMsg.match(/'([^']+)'/);
          const phone = phoneMatch ? phoneMatch[1] : "ce numéro";
          errorMessage = `Le numéro de téléphone "${phone}" est déjà utilisé. Veuillez utiliser un autre numéro ou vous connecter avec ce compte.`;
        }
        // Détecter les erreurs de duplication génériques
        else if (errorMsg.includes("Duplicate entry")) {
          errorMessage = "Ces informations sont déjà utilisées par un autre compte. Veuillez vérifier votre email ou numéro de téléphone.";
        }
        // Autres erreurs
        else {
          errorMessage = errorMsg;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.code) {
        // Erreur de base de données MySQL/MariaDB
        switch (error.code) {
          case 'ER_DUP_ENTRY':
            errorMessage = "Un utilisateur avec ces informations existe déjà. Veuillez vérifier votre email ou numéro de téléphone.";
            break;
          case 'ER_NO_REFERENCED_ROW_2':
            errorMessage = "Erreur de référence dans la base de données. Veuillez contacter le support.";
            break;
          case 'ER_BAD_NULL_ERROR':
            errorMessage = "Un champ requis est manquant. Veuillez vérifier tous les champs obligatoires.";
            break;
          default:
            errorMessage = `Erreur de base de données: ${error.code}. ${error.message || ''}`;
        }
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      // Rechercher l'utilisateur par téléphone ou email
      let user;
      if (loginData.mail) {
        // Si mail est fourni, chercher par email
        user = await db
          .select()
          .from(utilisateurs)
          .where(eq(utilisateurs.mail, loginData.mail))
          .limit(1);
      } else if (loginData.telephone) {
        // Sinon, chercher par téléphone
        user = await db
          .select()
          .from(utilisateurs)
          .where(eq(utilisateurs.telephone, loginData.telephone))
          .limit(1);
      } else {
        return {
          success: false,
          message: "Le numéro de téléphone ou l'adresse email est requis."
        };
      }

      if (user.length === 0) {
        const identifier = loginData.mail || loginData.telephone || "ces identifiants";
        return {
          success: false,
          message: `Aucun compte trouvé avec "${identifier}".\n\nVérifiez vos identifiants ou créez un compte si vous n'en avez pas encore.`
        };
      }

      const userData = user[0];

      // Vérifier le mot de passe
      const isPasswordValid = await comparePassword(
        loginData.motDePasse,
        userData.motDePasse
      );

      if (!isPasswordValid) {
        return {
          success: false,
          message: "Mot de passe incorrect.\n\nVérifiez votre mot de passe et réessayez. Si vous avez oublié votre mot de passe, utilisez la fonctionnalité de réinitialisation."
        };
      }

      // Vérifier le statut de vérification pour les médecins
      if (userData.typeUtilisateur === "medecin") {
        const medecinData = await db
          .select({ statutVerification: medecins.statutVerification })
          .from(medecins)
          .where(eq(medecins.id, userData.id))
          .limit(1);

        if (medecinData.length > 0 && medecinData[0].statutVerification !== "valide") {
          return {
            success: false,
            message: "Votre compte médecin est en attente de validation par un administrateur"
          };
        }
      }

      // IMPORTANT: La 2FA est OBLIGATOIRE uniquement pour les patients
      // Les médecins et administrateurs n'ont JAMAIS besoin de 2FA
      const is2FARequired = userData.typeUtilisateur === "patient";

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'AuthService.ts:368', message: 'Début évaluation 2FA', data: { typeUtilisateur: userData.typeUtilisateur, is2FARequiredInitial: is2FARequired }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      // Les médecins n'ont jamais besoin de 2FA, même s'ils sont validés
      // (La vérification du statut de validation est déjà faite plus haut)

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'AuthService.ts:383', message: 'Vérification condition 2FA', data: { is2FARequired, hasCode2FA: !!loginData.code2FA, typeUtilisateur: userData.typeUtilisateur, willGenerateCode: is2FARequired && !loginData.code2FA }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
      // #endregion

      // Si pas de code 2FA fourni et 2FA requis, générer et envoyer un code par email
      if (is2FARequired && !loginData.code2FA) {
        // Vérifier que l'utilisateur a un email valide
        if (!userData.mail || userData.mail.includes("@medconnect.local")) {
          return {
            success: false,
            message: "Votre compte n'a pas d'adresse email valide configurée. Veuillez contacter le support pour mettre à jour votre email."
          };
        }

        // Générer un code de vérification à 4 chiffres
        const verificationCode = generateVerificationCode();
        const expirationTime = new Date();
        expirationTime.setDate(expirationTime.getDate() + 14); // Code valide 2 semaines

        // Log en développement
        if (process.env.NODE_ENV === "development") {
          console.log(`[2FA Debug] Génération du code: "${verificationCode}" pour l'utilisateur ${userData.id}`);
        }

        // Stocker le code en base de données
        await db
          .update(utilisateurs)
          .set({
            codeSMS: verificationCode, // On garde le même champ pour la compatibilité
            codeSMSExpiration: expirationTime
          })
          .where(eq(utilisateurs.id, userData.id));

        // Vérifier que le code a bien été stocké (en développement)
        if (process.env.NODE_ENV === "development") {
          const verifyStored = await db
            .select({ codeSMS: utilisateurs.codeSMS })
            .from(utilisateurs)
            .where(eq(utilisateurs.id, userData.id))
            .limit(1);
          console.log(`[2FA Debug] Code stocké vérifié: "${verifyStored[0]?.codeSMS}"`);
        }

        // Envoyer le code par email
        await sendVerificationCodeByEmail(userData.mail, verificationCode);

        const message = process.env.NODE_ENV === "development"
          ? `Un code de vérification a été envoyé à votre adresse email (${userData.mail || "non configurée"}).\n\n🔑 Code de vérification (DEV): ${verificationCode}\n\nVeuillez vérifier votre boîte de réception.`
          : `Un code de vérification a été envoyé à votre adresse email (${userData.mail || "non configurée"}). Veuillez vérifier votre boîte de réception.`;

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'AuthService.ts:428', message: 'Retour réponse 2FA requise', data: { typeUtilisateur: userData.typeUtilisateur, require2FA: true, message: message.substring(0, 100) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion

        return {
          success: false,
          message,
          user: {
            id: userData.id,
            telephone: userData.telephone || "",
            typeUtilisateur: userData.typeUtilisateur,
            nom: await this.getUserName(userData.id, userData.typeUtilisateur),
            mail: userData.mail, // Ajouter le mail dans la réponse
            require2FA: true,
          }
        };
      }

      // Si un code 2FA est fourni, le vérifier
      if (is2FARequired && loginData.code2FA) {
        // Récupérer le code stocké et sa date d'expiration
        const userWithCode = await db
          .select({ codeSMS: utilisateurs.codeSMS, codeSMSExpiration: utilisateurs.codeSMSExpiration })
          .from(utilisateurs)
          .where(eq(utilisateurs.id, userData.id))
          .limit(1);

        if (userWithCode.length === 0) {
          return {
            success: false,
            message: "Erreur lors de la vérification du code"
          };
        }

        const storedCode = userWithCode[0].codeSMS;
        const expirationTime = userWithCode[0].codeSMSExpiration;

        // Logs de débogage en développement
        if (process.env.NODE_ENV === "development") {
          console.log(`[2FA Debug] Code fourni: "${loginData.code2FA}" (type: ${typeof loginData.code2FA}, length: ${loginData.code2FA.length})`);
          console.log(`[2FA Debug] Code stocké: "${storedCode}" (type: ${typeof storedCode}, length: ${storedCode?.length || 0})`);
          console.log(`[2FA Debug] Expiration: ${expirationTime ? expirationTime.toISOString() : "null"}`);
          console.log(`[2FA Debug] Date actuelle: ${new Date().toISOString()}`);
          if (expirationTime) {
            console.log(`[2FA Debug] Code expiré: ${new Date() > expirationTime}`);
          }
        }

        // Vérifier le code de vérification
        const isCodeValid = verifyCode(loginData.code2FA, storedCode, expirationTime);

        // Log uniquement en mode développement pour le diagnostic
        if (process.env.NODE_ENV === "development") {
          console.log(`[2FA Debug] Code valide: ${isCodeValid}`);
        }

        if (!isCodeValid) {
          // Message plus détaillé pour aider au diagnostic
          if (!storedCode) {
            return {
              success: false,
              message: "Aucun code de vérification trouvé. Veuillez demander un nouveau code."
            };
          }
          if (expirationTime && new Date() > expirationTime) {
            return {
              success: false,
              message: "Le code de vérification a expiré. Veuillez demander un nouveau code."
            };
          }
          return {
            success: false,
            message: "Code de vérification invalide. Veuillez vérifier et réessayer."
          };
        }

        // Code valide, supprimer le code utilisé et mettre à jour la dernière connexion en une seule requête
        await db
          .update(utilisateurs)
          .set({
            codeSMS: null,
            codeSMSExpiration: null,
            derniereConnexion: new Date()
          })
          .where(eq(utilisateurs.id, userData.id));
      } else {
        // Si pas de 2FA requis, juste mettre à jour la dernière connexion
        await db
          .update(utilisateurs)
          .set({ derniereConnexion: new Date() })
          .where(eq(utilisateurs.id, userData.id));
      }

      // Générer le token JWT
      const token = generateToken({
        userId: userData.id,
        telephone: userData.telephone || "",
        typeUtilisateur: userData.typeUtilisateur,
      });

      console.log(`✅ Token généré pour ${userData.typeUtilisateur} ${userData.id}: ${token.substring(0, 20)}...`);

      const response = {
        success: true,
        token,
        user: {
          id: userData.id,
          telephone: userData.telephone || "",
          typeUtilisateur: userData.typeUtilisateur,
          nom: await this.getUserName(userData.id, userData.typeUtilisateur),
        },
        message: "Connexion réussie"
      };

      console.log(`📤 Réponse login (token présent: ${!!response.token}):`, JSON.stringify({ ...response, token: response.token ? response.token.substring(0, 20) + '...' : 'MANQUANT' }, null, 2));

      return response;

    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return {
        success: false,
        message: "Erreur lors de la connexion"
      };
    }
  }

  /**
   * Activation du 2FA pour un utilisateur
   */
  static async enable2FA(userId: string): Promise<AuthResponse> {
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

      // Générer un nouveau secret 2FA
      const userPhone = userData.telephone || "";
      const secret = generate2FASecret(userPhone);
      const qrCodeUrl = generate2FAUrl(userPhone, secret);

      // Sauvegarder le secret (temporairement, sera confirmé lors de la vérification)
      await db
        .update(utilisateurs)
        .set({ secretDeuxFacteur: secret })
        .where(eq(utilisateurs.id, userId));

      return {
        success: true,
        user: {
          id: userData.id,
          telephone: userData.telephone || "",
          typeUtilisateur: userData.typeUtilisateur,
          nom: await this.getUserName(userData.id, userData.typeUtilisateur),
          qrCode2FA: qrCodeUrl,
        },
        message: "2FA configuré. Scannez le QR code avec votre application d'authentification"
      };

    } catch (error) {
      console.error("Erreur lors de l'activation 2FA:", error);
      return {
        success: false,
        message: "Erreur lors de l'activation du 2FA"
      };
    }
  }

  /**
   * Désactivation du 2FA
   */
  static async disable2FA(userId: string, code2FA: string): Promise<AuthResponse> {
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

      if (!userData.secretDeuxFacteur) {
        return {
          success: false,
          message: "2FA n'est pas activé pour cet utilisateur"
        };
      }

      // Vérifier le code 2FA
      const is2FAValid = verify2FA(code2FA, userData.secretDeuxFacteur);
      if (!is2FAValid) {
        return {
          success: false,
          message: "Code d'authentification invalide"
        };
      }

      // Supprimer le secret 2FA
      await db
        .update(utilisateurs)
        .set({ secretDeuxFacteur: null })
        .where(eq(utilisateurs.id, userId));

      return {
        success: true,
        message: "2FA désactivé avec succès"
      };

    } catch (error) {
      console.error("Erreur lors de la désactivation 2FA:", error);
      return {
        success: false,
        message: "Erreur lors de la désactivation du 2FA"
      };
    }
  }

  /**
   * Récupérer le profil complet de l'utilisateur
   */
  static async getProfile(userId: string, typeUtilisateur: string): Promise<{
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
    message: string;
  }> {
    try {
      // Récupérer les informations de base depuis la table utilisateurs
      const userData = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, userId))
        .limit(1);

      if (userData.length === 0) {
        return {
          success: false,
          message: "Utilisateur non trouvé"
        };
      }

      const baseUser = userData[0];

      // Récupérer le nom selon le type d'utilisateur
      const nom = await this.getUserName(userId, typeUtilisateur);

      // Construire l'objet utilisateur complet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userProfile: Record<string, any> = {
        id: baseUser.id,
        mail: baseUser.mail,
        telephone: baseUser.telephone || "",
        typeUtilisateur: baseUser.typeUtilisateur,
        adresse: baseUser.adresse || null,
        nom: nom,
      };

      // Ajouter les informations spécifiques selon le type
      if (typeUtilisateur === "patient") {
        const patientData = await db
          .select()
          .from(patients)
          .where(eq(patients.id, userId))
          .limit(1);

        if (patientData.length > 0) {
          // Convertir la date en string ISO si elle existe
          userProfile.dateNaissance = patientData[0].dateNaissance
            ? new Date(patientData[0].dateNaissance).toISOString().split('T')[0]
            : undefined;
          userProfile.genre = patientData[0].genre;
          // Normaliser le chemin de la photo de profil (remplacer les backslashes par des slashes)
          const photoProfil = patientData[0].photoProfil;
          userProfile.photoProfil = photoProfil ? photoProfil.replace(/\\/g, '/') : null;
        }
      } else if (typeUtilisateur === "medecin") {
        const medecinData = await db
          .select()
          .from(medecins)
          .where(eq(medecins.id, userId))
          .limit(1);

        if (medecinData.length > 0) {
          userProfile.specialite = medecinData[0].specialite;
          userProfile.numeroLicence = medecinData[0].numeroLicence;
          userProfile.description = medecinData[0].description || null;
          userProfile.education = medecinData[0].education || null;
          userProfile.specialisations = medecinData[0].specialisations || null;
          // Normaliser le chemin de la photo de profil (remplacer les backslashes par des slashes)
          const photoProfil = medecinData[0].photoProfil;
          userProfile.photoProfil = photoProfil ? photoProfil.replace(/\\/g, '/') : null;
        }
      }

      return {
        success: true,
        user: userProfile as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        message: "Profil récupéré avec succès"
      };
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération du profil"
      };
    }
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  static async updateProfile(
    userId: string,
    typeUtilisateur: string,
    updates: {
      nom?: string;
      mail?: string;
      telephone?: string;
      adresse?: string;
      photoProfil?: string;
      dateNaissance?: string;
      genre?: "Homme" | "Femme" | "Autre";
      specialite?: string;
      description?: string;
      education?: string;
      specialisations?: string;
    }
  ): Promise<{
    success: boolean;
    user?: any;
    message: string;
  }> {
    try {
      // Vérifier que l'utilisateur existe
      const userData = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, userId))
        .limit(1);

      if (userData.length === 0) {
        return {
          success: false,
          message: "Utilisateur non trouvé",
        };
      }

      // Mettre à jour les informations de base dans utilisateurs
      const utilisateurUpdates: any = {};
      if (updates.mail !== undefined) {
        // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
        const existingUser = await db
          .select()
          .from(utilisateurs)
          .where(eq(utilisateurs.mail, updates.mail))
          .limit(1);

        if (existingUser.length > 0 && existingUser[0].id !== userId) {
          return {
            success: false,
            message: "Cet email est déjà utilisé par un autre compte",
          };
        }
        utilisateurUpdates.mail = updates.mail;
      }
      if (updates.telephone !== undefined) {
        utilisateurUpdates.telephone = updates.telephone;
      }
      if (updates.adresse !== undefined) {
        utilisateurUpdates.adresse = updates.adresse || null;
      }

      if (Object.keys(utilisateurUpdates).length > 0) {
        await db
          .update(utilisateurs)
          .set(utilisateurUpdates)
          .where(eq(utilisateurs.id, userId));
      }

      // Mettre à jour les informations spécifiques selon le type
      if (typeUtilisateur === "patient") {
        const patientUpdates: any = {};
        if (updates.nom !== undefined) {
          patientUpdates.nom = updates.nom;
        }
        if (updates.dateNaissance !== undefined) {
          patientUpdates.dateNaissance = updates.dateNaissance;
        }
        if (updates.genre !== undefined) {
          patientUpdates.genre = updates.genre;
        }
        if (updates.photoProfil !== undefined) {
          // Normaliser le chemin (remplacer les backslashes par des slashes)
          const photoProfil = updates.photoProfil || null;
          patientUpdates.photoProfil = photoProfil ? photoProfil.replace(/\\/g, '/') : null;
        }

        if (Object.keys(patientUpdates).length > 0) {
          await db
            .update(patients)
            .set(patientUpdates)
            .where(eq(patients.id, userId));
        }
      } else if (typeUtilisateur === "medecin") {
        const medecinUpdates: any = {};
        if (updates.nom !== undefined) {
          medecinUpdates.nom = updates.nom;
        }
        if (updates.photoProfil !== undefined) {
          // Normaliser le chemin (remplacer les backslashes par des slashes)
          const photoProfil = updates.photoProfil || null;
          medecinUpdates.photoProfil = photoProfil ? photoProfil.replace(/\\/g, '/') : null;
        }
        if (updates.specialite !== undefined) {
          medecinUpdates.specialite = updates.specialite;
        }
        if (updates.description !== undefined) {
          medecinUpdates.description = updates.description || null;
        }
        if (updates.education !== undefined) {
          medecinUpdates.education = updates.education || null;
        }
        if (updates.specialisations !== undefined) {
          medecinUpdates.specialisations = updates.specialisations || null;
        }

        if (Object.keys(medecinUpdates).length > 0) {
          await db
            .update(medecins)
            .set(medecinUpdates)
            .where(eq(medecins.id, userId));
        }
      }

      // Récupérer le profil mis à jour
      return await this.getProfile(userId, typeUtilisateur);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la mise à jour du profil",
      };
    }
  }

  /**
   * Récupérer le nom de l'utilisateur selon son type
   */
  private static async getUserName(userId: string, typeUtilisateur: string): Promise<string> {
    try {
      switch (typeUtilisateur) {
        case "patient": {
          const patient = await db
            .select({ nom: patients.nom })
            .from(patients)
            .where(eq(patients.id, userId))
            .limit(1);
          return patient[0]?.nom || "Utilisateur";
        }

        case "medecin": {
          const medecin = await db
            .select({ nom: medecins.nom })
            .from(medecins)
            .where(eq(medecins.id, userId))
            .limit(1);
          return medecin[0]?.nom || "Utilisateur";
        }

        case "administrateur": {
          const admin = await db
            .select({ nom: administrateurs.nom })
            .from(administrateurs)
            .where(eq(administrateurs.id, userId))
            .limit(1);
          return admin[0]?.nom || "Utilisateur";
        }

        default:
          return "Utilisateur";
      }
    } catch (error) {
      return "Utilisateur";
    }
  }

  /**
   * Supprime un compte utilisateur
   * Supprime toutes les données associées grâce aux CASCADE
   */
  static async deleteAccount(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Vérifier que l'utilisateur existe
      const user = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: "Utilisateur non trouvé",
        };
      }

      // Supprimer l'utilisateur (les CASCADE supprimeront automatiquement les données associées)
      await db.delete(utilisateurs).where(eq(utilisateurs.id, userId));

      return {
        success: true,
        message: "Compte supprimé avec succès",
      };
    } catch (error: any) {
      console.error("Erreur lors de la suppression du compte:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la suppression du compte",
      };
    }
  }

  /**
   * Demande de réinitialisation du mot de passe
   * Envoie un code de vérification par email
   */
  static async requestPasswordReset(telephone: string): Promise<{ success: boolean; message: string; devCode?: string }> {
    try {
      console.log(`[AuthService] requestPasswordReset - Recherche utilisateur avec téléphone: ${telephone}`);

      // Rechercher l'utilisateur par téléphone
      const user = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.telephone, telephone))
        .limit(1);

      console.log(`[AuthService] Nombre d'utilisateurs trouvés: ${user.length}`);

      if (user.length === 0) {
        console.log(`[AuthService] Aucun utilisateur trouvé pour ${telephone}`);
        // Pour des raisons de sécurité, ne pas révéler si l'utilisateur existe
        return {
          success: true,
          message: "Si un compte existe avec ce numéro de téléphone, un code de réinitialisation a été envoyé par email.",
        };
      }

      const userData = user[0];
      console.log(`[AuthService] Utilisateur trouvé: ID=${userData.id}, Email=${userData.mail}`);

      // Générer un code de réinitialisation
      const resetCode = generateVerificationCode();
      console.log(`[AuthService] Code généré: ${resetCode}`);
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 15); // Code valide 15 minutes
      console.log(`[AuthService] Code expire à: ${expirationTime.toISOString()}`);

      // Stocker le code dans la base de données
      console.log(`[AuthService] Stockage du code en base de données...`);
      await db
        .update(utilisateurs)
        .set({
          codeResetPassword: resetCode,
          codeResetPasswordExpires: expirationTime,
        })
        .where(eq(utilisateurs.id, userData.id));
      console.log(`[AuthService] Code stocké avec succès`);

      // Envoyer le code par email
      let emailSent = false;
      let devCode: string | undefined = undefined;
      let emailError: any = null;

      try {
        console.log(`📧 Tentative d'envoi d'email de réinitialisation à ${userData.mail}...`);
        await sendPasswordResetCodeByEmail(
          userData.mail,
          resetCode
        );
        emailSent = true;
        console.log(`✅ Email de réinitialisation envoyé avec succès à ${userData.mail}`);
      } catch (err: any) {
        emailError = err;
        console.error("❌ Erreur lors de l'envoi de l'email:", err.message || err);
        console.error("❌ Détails de l'erreur:", JSON.stringify(err, null, 2));

        // En développement, toujours inclure le code dans la réponse si l'email échoue
        if (process.env.NODE_ENV === "development") {
          console.log(`\n⚠️  [DEV MODE] Code de réinitialisation pour ${telephone} (${userData.mail}): ${resetCode}\n`);
          devCode = resetCode; // Inclure le code dans la réponse en développement
        }
      }

      // Vérifier si SMTP est configuré
      const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
      console.log(`[AuthService] SMTP configuré: ${smtpConfigured}, Email envoyé: ${emailSent}`);

      // En mode développement, inclure le code dans la réponse SEULEMENT si l'email n'a pas été envoyé
      // pour faciliter les tests quand SMTP n'est pas configuré
      if (process.env.NODE_ENV === "development" && !emailSent) {
        if (!devCode) {
          devCode = resetCode;
          console.log(`[AuthService] Code ajouté à la réponse (DEV MODE - email non envoyé): ${devCode}`);
        }
      }

      // Construire le message
      let message: string;
      if (emailSent) {
        message = "Si un compte existe avec ce numéro de téléphone, un code de réinitialisation a été envoyé par email.";
      } else if (process.env.NODE_ENV === "development" && devCode) {
        message = `Code de réinitialisation (DEV MODE): ${devCode}. Ce code est valide pendant 15 minutes.`;
        if (emailError) {
          message += ` (Erreur email: ${emailError.message})`;
        }
      } else {
        message = "Si un compte existe avec ce numéro de téléphone, un code de réinitialisation a été envoyé par email.";
        if (emailError && smtpConfigured) {
          console.error("⚠️  SMTP configuré mais l'envoi a échoué. Vérifiez les logs pour plus de détails.");
        }
      }

      const response = {
        success: true,
        message: message,
        ...(process.env.NODE_ENV === "development" && devCode && { devCode: devCode })
      };

      console.log(`[AuthService] Réponse finale préparée:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la demande de réinitialisation",
      };
    }
  }

  /**
   * Réinitialise le mot de passe avec le code de vérification
   */
  static async resetPassword(
    telephone: string,
    code: string,
    nouveauMotDePasse: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Rechercher l'utilisateur
      const user = await db
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.telephone, telephone))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: "Aucun compte trouvé avec ce numéro de téléphone.",
        };
      }

      const userData = user[0];

      // Vérifier le code de réinitialisation
      const isCodeValid = verifyCode(
        code,
        userData.codeResetPassword || null,
        userData.codeResetPasswordExpires || null
      );

      if (!isCodeValid) {
        return {
          success: false,
          message: "Code de réinitialisation invalide ou expiré. Veuillez demander un nouveau code.",
        };
      }

      // Valider le nouveau mot de passe
      if (nouveauMotDePasse.length < 8) {
        return {
          success: false,
          message: "Le mot de passe est trop court. Il doit contenir au moins 8 caractères.",
        };
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(nouveauMotDePasse)) {
        return {
          success: false,
          message: "Le mot de passe ne respecte pas les critères de sécurité.\n\nIl doit contenir :\n• Au moins une lettre minuscule\n• Au moins une lettre majuscule\n• Au moins un chiffre",
        };
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await hashPassword(nouveauMotDePasse);

      // Mettre à jour le mot de passe et supprimer le code de réinitialisation
      const updateData: any = {
        motDePasse: hashedPassword,
      };

      // Utiliser undefined au lieu de null pour éviter les erreurs Drizzle
      updateData.codeResetPassword = undefined;
      updateData.codeResetPasswordExpires = undefined;

      await db
        .update(utilisateurs)
        .set(updateData)
        .where(eq(utilisateurs.id, userData.id));

      return {
        success: true,
        message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      };
    } catch (error: any) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la réinitialisation du mot de passe",
      };
    }
  }

  /**
   * Valider le format du numéro de téléphone camerounais
   */
  private static isValidPhoneNumber(phone: string): boolean {
    // Format camerounais : +237XXXXXXXXX (9 chiffres) ou 6XXXXXXXXX/7XXXXXXXXX (9 chiffres)
    const phoneRegex = /^(\+237[6-7]\d{8}|[6-7]\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }
}