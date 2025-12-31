import { Utilisateur } from "./Utilisateur";
import { Patient } from "./Patient";
import { DossierMedical } from "./DossierMedical";
import { Connexion } from "./Connexion";
import { RendezVous } from "./RendezVous";
import { Commentaire } from "./Commentaire";
import { Message } from "./Message";
import { Ordonnance } from "./Ordonnance";
import { TypeEnregistrement } from "../enums/TypeEnregistrement";

/**
 * Interface pour les filtres de recherche de dossiers
 */
export interface FiltresDossier {
  type?: TypeEnregistrement;
  dateDebut?: Date;
  dateFin?: Date;
}

/**
 * Entité représentant un médecin du système Med-Connect
 * Hérite de Utilisateur et ajoute les fonctionnalités spécifiques aux médecins
 */
export class Medecin extends Utilisateur {
  /**
   * Nom complet du médecin
   */
  nom: string;

  /**
   * Spécialité médicale du médecin
   */
  specialite: string;

  /**
   * Numéro de licence professionnelle du médecin
   */
  numeroLicence: string;

  /**
   * Connexions avec les patients
   */
  connexions?: Connexion[];

  /**
   * Rendez-vous planifiés par le médecin
   */
  rendezVous?: RendezVous[];

  /**
   * Commentaires faits par le médecin
   */
  commentaires?: Commentaire[];

  constructor(
    id: string,
    mail: string,
    motDePasse: string,
    nom: string,
    specialite: string,
    numeroLicence: string,
    dateCreation: Date,
    secretDeuxFacteur?: string,
    derniereConnexion?: Date,
    adresse?: string,
    telephone?: string,
    connexions?: Connexion[],
    rendezVous?: RendezVous[],
    commentaires?: Commentaire[]
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
    this.specialite = specialite;
    this.numeroLicence = numeroLicence;
    this.connexions = connexions;
    this.rendezVous = rendezVous;
    this.commentaires = commentaires;
  }

  /**
   * Authentifie un médecin
   * @param mail - Adresse e-mail du médecin
   * @param motDePasse - Mot de passe en clair
   * @returns true si l'authentification réussit
   */
  async authentifier(mail: string, motDePasse: string): Promise<boolean> {
    // Cette méthode sera implémentée dans la couche service
    return this.mail === mail;
  }

  /**
   * Obtient la liste des patients connectés au médecin
   * @returns Liste des patients
   */
  obtenirListePatients(): Patient[] {
    // Cette méthode sera implémentée dans la couche service
    return [];
  }

  /**
   * Recherche des dossiers spécifiques d'un patient
   * @param idPatient - Identifiant du patient
   * @param filtres - Filtres de recherche (type, date)
   * @returns Liste des dossiers médicaux correspondants
   */
  rechercherDossiersPatient(
    idPatient: string,
    filtres: FiltresDossier
  ): DossierMedical[] {
    // Cette méthode sera implémentée dans la couche service
    return [];
  }

  /**
   * Visualise le profil complet d'un patient
   * @param idPatient - Identifiant du patient
   */
  visualiserProfilPatient(idPatient: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Filtre les dossiers par type et date
   * @param type - Type d'enregistrement
   * @param dateDebut - Date de début de la plage
   * @param dateFin - Date de fin de la plage
   * @returns Liste des dossiers filtrés
   */
  filtrerDossier(
    type: TypeEnregistrement,
    dateDebut: Date,
    dateFin: Date
  ): DossierMedical[] {
    // Cette méthode sera implémentée dans la couche service
    return [];
  }

  /**
   * Ajoute un diagnostic à un dossier médical
   * @param idDossier - Identifiant du dossier
   * @param diagnostic - Diagnostic à ajouter
   */
  ajouterDiagnosticDossier(idDossier: string, diagnostic: string): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Prescrit un médicament à un patient
   * @param idPatient - Identifiant du patient
   * @param medicament - Nom du médicament
   * @param dosage - Dosage du médicament
   * @returns Ordonnance créée
   */
  prescriptionMedicament(
    idPatient: string,
    medicament: string,
    dosage: string
  ): Ordonnance {
    // Cette méthode sera implémentée dans la couche service
    return {} as Ordonnance;
  }

  /**
   * Planifie une téléconsultation avec un patient
   * @param idPatient - Identifiant du patient
   * @param date - Date et heure de la téléconsultation
   * @returns Rendez-vous créé
   */
  planifierTeleconsulation(idPatient: string, date: Date): RendezVous {
    // Cette méthode sera implémentée dans la couche service
    return {} as RendezVous;
  }

  /**
   * Envoie un message sécurisé
   * @param destinataire - Identifiant du destinataire
   * @param contenu - Contenu du message
   * @returns Message créé
   */
  envoyerMessage(destinataire: string, contenu: string): Message {
    // Cette méthode sera implémentée dans la couche service
    return {} as Message;
  }
}

