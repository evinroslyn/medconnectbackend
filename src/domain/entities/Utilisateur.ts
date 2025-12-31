import { Message } from "./Message";

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
    secretDeuxFacteur?: string,
    derniereConnexion?: Date,
    adresse?: string,
    telephone?: string
  ) {
    this.id = id;
    this.mail = mail;
    this.motDePasse = motDePasse;
    this.dateCreation = dateCreation;
    this.secretDeuxFacteur = secretDeuxFacteur;
    this.derniereConnexion = derniereConnexion;
    this.adresse = adresse;
    this.telephone = telephone;
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
  verifier2FA(code: string): boolean {
    // Cette méthode sera implémentée dans la couche service
    // La vérification du code 2FA sera gérée par le service d'authentification
    return false;
  }
}

