import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService, RegisterUserData, LoginData } from "../../application/services/AuthService";

/**
 * Contrôleur d'authentification
 * Gère les routes d'inscription, connexion et 2FA
 */
export class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Construire des messages d'erreur détaillés
        const errorDetails = errors.array().map((error: any) => ({
          field: error.param || error.path || "champ inconnu",
          message: error.msg || "Valeur invalide"
        }));
        
        // Créer un message résumé
        const fieldNames = errorDetails.map(d => d.field).join(", ");
        const summaryMessage = errorDetails.length === 1 
          ? `Le champ "${fieldNames}" est invalide`
          : `Les champs suivants sont invalides : ${fieldNames}`;
        
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: summaryMessage,
          details: errorDetails
        });
        return;
      }

      const userData: RegisterUserData = req.body;
      console.log("📥 Données reçues pour l'inscription:", JSON.stringify(userData, null, 2));
      
      const result = await AuthService.register(userData);
      console.log("📤 Résultat de l'inscription:", JSON.stringify(result, null, 2));

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json({
          ...result,
          error: result.message || "Erreur lors de l'inscription"
        });
      }
    } catch (error: any) {
      console.error("Erreur dans register:", error);
      console.error("Stack trace:", error.stack);
      const errorMessage = error.message || "Une erreur est survenue lors de l'inscription";
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: errorMessage
      });
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorDetails = errors.array().map((error: any) => ({
          field: error.param || error.path || "champ inconnu",
          message: error.msg || "Valeur invalide"
        }));
        
        const fieldNames = errorDetails.map(d => d.field).join(", ");
        const summaryMessage = errorDetails.length === 1 
          ? `Le champ "${fieldNames}" est invalide ou manquant`
          : `Les champs suivants sont invalides : ${fieldNames}`;
        
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: summaryMessage,
          details: errorDetails
        });
        return;
      }

      const loginData: LoginData = req.body;
      const result = await AuthService.login(loginData);

      console.log(`📤 Réponse login envoyée (success: ${result.success}, token: ${result.token ? 'PRÉSENT' : 'MANQUANT'}):`, JSON.stringify({ ...result, token: result.token ? result.token.substring(0, 20) + '...' : 'MANQUANT' }, null, 2));

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Si 2FA requis, retourner 200 avec require2FA
        if (result.user?.require2FA) {
          res.status(200).json(result);
        } else {
          res.status(401).json({
            ...result,
            error: result.message || "Identifiants incorrects"
          });
        }
      }
    } catch (error: any) {
      console.error("Erreur dans login:", error);
      const errorMessage = error.message || "Une erreur est survenue lors de la connexion";
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: errorMessage
      });
    }
  }

  /**
   * Activation du 2FA
   */
  static async enable2FA(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise"
        });
        return;
      }

      const result = await AuthService.enable2FA(req.user.userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans enable2FA:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de l'activation du 2FA"
      });
    }
  }

  /**
   * Désactivation du 2FA
   */
  static async disable2FA(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise"
        });
        return;
      }

      const { code2FA } = req.body;

      if (!code2FA) {
        res.status(400).json({
          success: false,
          error: "Code manquant",
          message: "Code d'authentification requis"
        });
        return;
      }

      const result = await AuthService.disable2FA(req.user.userId, code2FA);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Erreur dans disable2FA:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la désactivation du 2FA"
      });
    }
  }

  /**
   * Récupération du profil utilisateur
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise"
        });
        return;
      }

      // Récupérer les informations complètes de l'utilisateur
      const result = await AuthService.getProfile(req.user.userId, req.user.typeUtilisateur);

      if (result.success) {
        res.status(200).json({
          success: true,
          user: result.user,
          message: "Profil récupéré avec succès"
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur serveur",
          message: result.message || "Une erreur est survenue lors de la récupération du profil"
        });
      }
    } catch (error) {
      console.error("Erreur dans getProfile:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la récupération du profil"
      });
    }
  }

  /**
   * Mise à jour du profil utilisateur
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise"
        });
        return;
      }

      const updates = req.body;
      const result = await AuthService.updateProfile(
        req.user.userId,
        req.user.typeUtilisateur,
        updates
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          user: result.user,
          message: result.message || "Profil mis à jour avec succès"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Erreur lors de la mise à jour",
          message: result.message
        });
      }
    } catch (error: any) {
      console.error("Erreur dans updateProfile:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue lors de la mise à jour du profil"
      });
    }
  }

  /**
   * Déconnexion (côté client principalement)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Déconnexion réussie"
    });
  }

  /**
   * Suppression du compte utilisateur
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Non authentifié",
          message: "Authentification requise"
        });
        return;
      }

      const result = await AuthService.deleteAccount(req.user.userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Erreur lors de la suppression",
          message: result.message
        });
      }
    } catch (error: any) {
      console.error("Erreur dans deleteAccount:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue lors de la suppression du compte"
      });
    }
  }

  /**
   * Demande de réinitialisation du mot de passe
   */
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { telephone } = req.body;
      console.log(`[AuthController] requestPasswordReset appelé avec téléphone: ${telephone}`);

      if (!telephone) {
        console.log("[AuthController] Téléphone manquant");
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Le numéro de téléphone est requis",
        });
        return;
      }

      console.log(`[AuthController] Appel de AuthService.requestPasswordReset pour ${telephone}`);
      const result = await AuthService.requestPasswordReset(telephone);
      console.log(`[AuthController] Résultat de requestPasswordReset:`, JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`[AuthController] Succès - Envoi réponse 200`);
        res.status(200).json(result);
      } else {
        console.log(`[AuthController] Échec - Envoi réponse 400`);
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("[AuthController] Erreur dans requestPasswordReset:", error);
      console.error("[AuthController] Stack:", error.stack);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue lors de la demande de réinitialisation",
      });
    }
  }

  /**
   * Réinitialisation du mot de passe avec code de vérification
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { telephone, code, nouveauMotDePasse } = req.body;

      if (!telephone || !code || !nouveauMotDePasse) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Le numéro de téléphone, le code de vérification et le nouveau mot de passe sont requis",
        });
        return;
      }

      const result = await AuthService.resetPassword(telephone, code, nouveauMotDePasse);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Erreur dans resetPassword:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur",
        message: error.message || "Une erreur est survenue lors de la réinitialisation du mot de passe",
      });
    }
  }
}

/**
 * Validateurs pour l'inscription
 */
export const registerValidators = [
  body("telephone")
    .notEmpty()
    .withMessage("Le numéro de téléphone est requis")
    .matches(/^(\+237[6-7]\d{8}|[6-7]\d{8})$/)
    .withMessage("Format de numéro de téléphone invalide (format camerounais attendu: 612345678 ou +237612345678)"),
  
  // Le mot de passe n'est pas requis pour les médecins (généré lors de la validation)
  body("motDePasse")
    .if(body("typeUtilisateur").not().equals("medecin"))
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"),
  
  body("motDePasse")
    .if(body("typeUtilisateur").equals("medecin"))
    .optional(),
  
  body("typeUtilisateur")
    .isIn(["patient", "medecin", "administrateur"])
    .withMessage("Type d'utilisateur invalide"),
  
  body("nom")
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom doit contenir entre 2 et 100 caractères"),
  
  body("mail")
    .notEmpty()
    .withMessage("L'adresse email est obligatoire")
    .isEmail()
    .withMessage("Format d'email invalide. Format attendu: exemple@domaine.com")
    .custom((value) => {
      if (value.includes("@medconnect.local")) {
        throw new Error("Les emails temporaires ne sont pas autorisés. Veuillez utiliser une adresse email valide.");
      }
      return true;
    }),
  
  body("adresse")
    .optional()
    .isLength({ max: 500 })
    .withMessage("L'adresse ne peut pas dépasser 500 caractères"),
  
  // Validations conditionnelles pour les patients
  body("dateNaissance")
    .if(body("typeUtilisateur").equals("patient"))
    .notEmpty()
    .withMessage("La date de naissance est requise pour les patients")
    .isISO8601()
    .withMessage("Format de date invalide"),
  
  body("genre")
    .if(body("typeUtilisateur").equals("patient"))
    .isIn(["Homme", "Femme", "Autre"])
    .withMessage("Genre invalide"),
  
  // Validations conditionnelles pour les médecins
  body("specialite")
    .if(body("typeUtilisateur").equals("medecin"))
    .notEmpty()
    .withMessage("La spécialité est requise pour les médecins")
    .isLength({ min: 2, max: 100 })
    .withMessage("La spécialité doit contenir entre 2 et 100 caractères"),
  
  body("numeroLicence")
    .if(body("typeUtilisateur").equals("medecin"))
    .notEmpty()
    .withMessage("Le numéro de licence est requis pour les médecins")
    .isLength({ min: 5, max: 50 })
    .withMessage("Le numéro de licence doit contenir entre 5 et 50 caractères"),
  
  body("documentIdentite")
    .if(body("typeUtilisateur").equals("medecin"))
    .notEmpty()
    .withMessage("Le document d'identité (CNI/Passeport) est requis pour les médecins"),
  
  body("diplome")
    .if(body("typeUtilisateur").equals("medecin"))
    .notEmpty()
    .withMessage("Le diplôme est requis pour les médecins"),
  
  body("photoProfil")
    .if(body("typeUtilisateur").equals("medecin"))
    .optional(),
];

/**
 * Validateurs pour la connexion
 * Accepte soit un téléphone soit un email
 */
export const loginValidators = [
  body("telephone")
    .optional()
    .custom((value, { req }) => {
      // Au moins un des deux (telephone ou mail) doit être fourni
      if (!value && !req.body.mail) {
        throw new Error("Le numéro de téléphone ou l'adresse email est requis");
      }
      // Si telephone est fourni, valider le format
      if (value) {
        const phoneRegex = /^(\+237[6-7]\d{8}|[6-7]\d{8}|\+\d{1,3}\d{8,15})$/;
        if (!phoneRegex.test(value)) {
          throw new Error("Format de numéro de téléphone invalide");
        }
      }
      return true;
    }),
  
  body("mail")
    .optional()
    .isEmail()
    .withMessage("Format d'email invalide. Format attendu: exemple@domaine.com"),
  
  body("motDePasse")
    .notEmpty()
    .withMessage("Le mot de passe est requis"),
  
  body("code2FA")
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage("Le code de vérification doit contenir 4 chiffres")
    .isNumeric()
    .withMessage("Le code de vérification doit être numérique"),
];