import { Utilisateur } from "./Utilisateur";
import { DossierMedical } from "./DossierMedical";
import { Medecin } from "./Medecin";
import { Connexion } from "./Connexion";
import { Message } from "./Message";
import { NiveauAcces } from "../enums/NiveauAcces";
import { TypeEnregistrement } from "../enums/TypeEnregistrement";
import { Genre } from "../enums/Genre";
import { TypeUtilisateur } from "../enums/TypeUtilisateur";

/**
 * Entité représentant un patient du système Med-Connect
 * Hérite de Utilisateur et ajoute les fonctionnalités spécifiques aux patients
 */
export class Patient extends Utilisateur {
  /**
   * Nom complet du patient
   */
  nom: string;

  /**
   * Date de naissance du patient
   */
  dateNaissance: Date;

  /**
   * Genre du patient
   */
  genre: Genre;

  /**
   * Chemin vers la photo de profil
   */
  photoProfil?: string;

  /**
   * Dossiers médicaux possédés par le patient
   */
  dossiersMedicaux?: DossierMedical[];

  /**
   * Connexions avec les médecins
   */
  connexions?: Connexion[];

  constructor(
    id: string,
    mail: string,
    motDePasse: string,
    nom: string,
    dateNaissance: Date,
    genre: Genre,
    dateCreation: Date,
    secretDeuxFacteur?: string,
    codeSMS?: string,
    codeSMSExpiration?: Date,
    derniereConnexion?: Date,
    adresse?: string,
    telephone?: string,
    photoProfil?: string,
    codeResetPassword?: string,
    codeResetPasswordExpires?: Date,
    dossiersMedicaux?: DossierMedical[],
    connexions?: Connexion[]
  ) {
    super(
      id,
      mail,
      motDePasse,
      dateCreation,
      TypeUtilisateur.PATIENT,
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
    this.dateNaissance = dateNaissance;
    this.genre = genre;
    this.photoProfil = photoProfil;
    this.dossiersMedicaux = dossiersMedicaux;
    this.connexions = connexions;
  }

  /**
   * Authentifie un patient
   * @param mail - Adresse e-mail du patient
   * @param motDePasse - Mot de passe en clair
   * @returns true si l'authentification réussit
   */
  async authentifier(mail: string, _motDePasse: string): Promise<boolean> {
    // Cette méthode sera implémentée dans la couche service
    // La vérification du mot de passe sera gérée par le service d'authentification
    return this.mail === mail;
  }

  /**
   * Affiche le tableau de bord de santé personnel du patient
   */
  tableauBord(): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Téléverse un nouveau dossier médical
   * @param dossier - Dossier médical à téléverser
   */
  televerserDossierMedical(_dossier: DossierMedical): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Catégorise un dossier médical existant
   * @param idDossier - Identifiant du dossier à catégoriser
   * @param type - Type d'enregistrement à attribuer
   */
  categoriserDossier(_idDossier: string, _type: TypeEnregistrement): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Ajoute une description à un dossier médical
   * @param idDossier - Identifiant du dossier
   * @param description - Description à ajouter
   */
  ajouterDescriptionDossier(_idDossier: string, _description: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Recherche des médecins par spécialité
   * @param specialisation - Spécialité recherchée
   * @returns Liste des médecins correspondants
   */
  rechercherMedecins(_specialisation: string): Medecin[] {
    // Cette méthode sera implémentée dans la couche service
    return [];
  }

  /**
   * Envoie une demande de connexion à un médecin
   * @param idMedecin - Identifiant du médecin
   * @returns Connexion créée
   */
  envoyerDemandeConnexion(_idMedecin: string): Connexion {
    // Cette méthode sera implémentée dans la couche service
    return {} as Connexion;
  }

  /**
   * Accorde un niveau d'accès à un médecin
   * @param idMedecin - Identifiant du médecin
   * @param niveau - Niveau d'accès à accorder
   */
  accorderAcces(_idMedecin: string, _niveau: NiveauAcces): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Révoque l'accès d'un médecin
   * @param idMedecin - Identifiant du médecin
   */
  revoquerAcces(_idMedecin: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Partage un dossier spécifique avec un médecin
   * @param idDossier - Identifiant du dossier à partager
   * @param idMedecin - Identifiant du médecin
   */
  partagerDossier(_idDossier: string, _idMedecin: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Envoie un message sécurisé
   * @param destinataire - Identifiant du destinataire
   * @param contenu - Contenu du message
   */
  envoyerMessage(_destinataire: string, _contenu: string): Message {
    // Cette méthode sera implémentée dans la couche service
    return {} as Message;
  }
}

