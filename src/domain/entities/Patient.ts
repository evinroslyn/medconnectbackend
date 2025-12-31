import { Utilisateur } from "./Utilisateur";
import { DossierMedical } from "./DossierMedical";
import { Medecin } from "./Medecin";
import { Connexion } from "./Connexion";
import { Message } from "./Message";
import { NiveauAcces } from "../enums/NiveauAcces";
import { TypeEnregistrement } from "../enums/TypeEnregistrement";
import { Genre } from "../enums/Genre";

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
    derniereConnexion?: Date,
    adresse?: string,
    telephone?: string,
    dossiersMedicaux?: DossierMedical[],
    connexions?: Connexion[]
  ) {
    super(
      id,
      mail,
      motDePasse,
      dateCreation,
      secretDeuxFacteur,
      derniereConnexion,
      adresse,
      telephone
    );
    this.nom = nom;
    this.dateNaissance = dateNaissance;
    this.genre = genre;
    this.dossiersMedicaux = dossiersMedicaux;
    this.connexions = connexions;
  }

  /**
   * Authentifie un patient
   * @param mail - Adresse e-mail du patient
   * @param motDePasse - Mot de passe en clair
   * @returns true si l'authentification réussit
   */
  async authentifier(mail: string, motDePasse: string): Promise<boolean> {
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
  televerserDossierMedical(dossier: DossierMedical): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Catégorise un dossier médical existant
   * @param idDossier - Identifiant du dossier à catégoriser
   * @param type - Type d'enregistrement à attribuer
   */
  categoriserDossier(idDossier: string, type: TypeEnregistrement): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Ajoute une description à un dossier médical
   * @param idDossier - Identifiant du dossier
   * @param description - Description à ajouter
   */
  ajouterDescriptionDossier(idDossier: string, description: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Recherche des médecins par spécialité
   * @param specialisation - Spécialité recherchée
   * @returns Liste des médecins correspondants
   */
  rechercherMedecins(specialisation: string): Medecin[] {
    // Cette méthode sera implémentée dans la couche service
    return [];
  }

  /**
   * Envoie une demande de connexion à un médecin
   * @param idMedecin - Identifiant du médecin
   * @returns Connexion créée
   */
  envoyerDemandeConnexion(idMedecin: string): Connexion {
    // Cette méthode sera implémentée dans la couche service
    return {} as Connexion;
  }

  /**
   * Accorde un niveau d'accès à un médecin
   * @param idMedecin - Identifiant du médecin
   * @param niveau - Niveau d'accès à accorder
   */
  accorderAcces(idMedecin: string, niveau: NiveauAcces): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Révoque l'accès d'un médecin
   * @param idMedecin - Identifiant du médecin
   */
  revoquerAcces(idMedecin: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Partage un dossier spécifique avec un médecin
   * @param idDossier - Identifiant du dossier à partager
   * @param idMedecin - Identifiant du médecin
   */
  partagerDossier(idDossier: string, idMedecin: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Envoie un message sécurisé
   * @param destinataire - Identifiant du destinataire
   * @param contenu - Contenu du message
   */
  envoyerMessage(destinataire: string, contenu: string): Message {
    // Cette méthode sera implémentée dans la couche service
    return {} as Message;
  }
}

