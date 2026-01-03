import { Utilisateur } from "./Utilisateur";
import { TypeUtilisateur } from "../enums/TypeUtilisateur";

/**
 * Entité représentant un administrateur du système Med-Connect
 * Hérite de Utilisateur et ajoute les fonctionnalités de gestion des médecins
 */
export class Administrateur extends Utilisateur {
  /**
   * Nom complet de l'administrateur
   */
  nom: string;

  constructor(
    id: string,
    mail: string,
    motDePasse: string,
    nom: string,
    dateCreation: Date,
    secretDeuxFacteur?: string,
    codeSMS?: string,
    codeSMSExpiration?: Date,
    derniereConnexion?: Date,
    adresse?: string,
    telephone?: string,
    codeResetPassword?: string,
    codeResetPasswordExpires?: Date
  ) {
    super(
      id,
      mail,
      motDePasse,
      dateCreation,
      TypeUtilisateur.ADMINISTRATEUR,
      secretDeuxFacteur,
      codeSMS,
      codeSMSExpiration,
      derniereConnexion,
      adresse,
      telephone,
      codeResetPassword,
      codeResetPasswordExpires
    );
    this.nom = nom;
  }

  /**
   * Authentifie un administrateur
   * @param mail - Adresse e-mail de l'administrateur
   * @param motDePasse - Mot de passe en clair
   * @returns true si l'authentification réussit
   */
  async authentifier(mail: string, _motDePasse: string): Promise<boolean> {
    // Cette méthode sera implémentée dans la couche service
    return this.mail === mail;
  }

  /**
   * Gère les comptes des médecins (création, modification, suppression)
   */
  gererMedecin(): void {
    // Cette méthode sera implémentée dans la couche service
  }
}

