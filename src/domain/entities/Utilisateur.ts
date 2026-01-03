import { Message } from "./Message";
import { TypeUtilisateur } from "../enums/TypeUtilisateur";

/**
 * Classe abstraite représentant un utilisateur du système Med-Connect
 * Cette classe de base contient les informations communes à tous les types d'utilisateurs
 * (Patient, Médecin, Administrateur)
 */
export abstract class Utilisateur {
  /**
   * Identifiant unique de l'utilisateur
   */
  id: string;

  /**
   * Adresse e-mail de l'utilisateur (utilisée pour l'authentification)
   */
  mail: string;

  /**
   * Mot de passe hashé de l'utilisateur
   */
  motDePasse: string;

  /**
   * Clé secrète pour l'authentification à deux facteurs (2FA)
   */
  secretDeuxFacteur?: string;

  /**
   * Code de vérification envoyé par SMS ou Email
   */
  codeSMS?: string;

  /**
   * Date d'expiration du code de vérification
   */
  codeSMSExpiration?: Date;

  /**
   * Date de création du compte utilisateur
   */
  dateCreation: Date;

  /**
   * Date de la dernière connexion de l'utilisateur
   */
  derniereConnexion?: Date;

  /**
   * Adresse physique de l'utilisateur
   */
  adresse?: string;

  /**
   * Numéro de téléphone de l'utilisateur
   */
  telephone?: string;

  /**
   * Type d'utilisateur (Patient, Médecin, Administrateur)
   */
  typeUtilisateur: TypeUtilisateur;

  /**
   * Code de réinitialisation du mot de passe
   */
  codeResetPassword?: string;

  /**
   * Date d'expiration du code de réinitialisation
   */
  codeResetPasswordExpires?: Date;

  /**
   * Messages envoyés par l'utilisateur
   */
  messagesEnvoyes?: Message[];

  /**
   * Messages reçus par l'utilisateur
   */
  messagesRecus?: Message[];

  constructor(
    id: string,
    mail: string,
    motDePasse: string,
    dateCreation: Date,
    typeUtilisateur: TypeUtilisateur,
    secretDeuxFacteur?: string,
    codeSMS?: string,
    codeSMSExpiration?: Date,
    derniereConnexion?: Date,
    adresse?: string,
    telephone?: string,
    codeResetPassword?: string,
    codeResetPasswordExpires?: Date
  ) {
    this.id = id;
    this.mail = mail;
    this.motDePasse = motDePasse;
    this.dateCreation = dateCreation;
    this.typeUtilisateur = typeUtilisateur;
    this.secretDeuxFacteur = secretDeuxFacteur;
    this.codeSMS = codeSMS;
    this.codeSMSExpiration = codeSMSExpiration;
    this.derniereConnexion = derniereConnexion;
    this.adresse = adresse;
    this.telephone = telephone;
    this.codeResetPassword = codeResetPassword;
    this.codeResetPasswordExpires = codeResetPasswordExpires;
  }

  /**
   * Authentifie un utilisateur en vérifiant son e-mail et mot de passe
   * @param mail - Adresse e-mail de l'utilisateur
   * @param motDePasse - Mot de passe en clair à vérifier
   * @returns true si l'authentification réussit, false sinon
   */
  abstract authentifier(mail: string, motDePasse: string): Promise<boolean>;

  /**
   * Active l'authentification à deux facteurs pour l'utilisateur
   * Génère et stocke une clé secrète 2FA
   */
  activer2FA(): void {
    // Cette méthode sera implémentée dans la couche service
    // La logique de génération de clé 2FA sera gérée par le service d'authentification
  }

  /**
   * Vérifie le code d'authentification à deux facteurs
   * @param code - Code 2FA à vérifier
   * @returns true si le code est valide, false sinon
   */
  verifier2FA(_code: string): boolean {
    // Cette méthode sera implémentée dans la couche service
    // La vérification du code 2FA sera gérée par le service d'authentification
    return false;
  }
}

