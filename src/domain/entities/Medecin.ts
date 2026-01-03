import { Utilisateur } from "./Utilisateur";
import { Patient } from "./Patient";
import { DossierMedical } from "./DossierMedical";
import { Connexion } from "./Connexion";
import { RendezVous } from "./RendezVous";
import { Commentaire } from "./Commentaire";
import { Message } from "./Message";
import { Ordonnance } from "./Ordonnance";
import { TypeEnregistrement } from "../enums/TypeEnregistrement";
import { TypeUtilisateur } from "../enums/TypeUtilisateur";

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
   * Statut de vérification (en_attente, valide, rejete)
   */
  statutVerification: string;

  /**
   * Chemin vers le document CNI/Passeport
   */
  documentIdentite?: string;

  /**
   * Chemin vers le diplôme
   */
  diplome?: string;

  /**
   * Chemin vers la photo de profil
   */
  photoProfil?: string;

  /**
   * Nombre d'années d'expérience
   */
  anneesExperience?: string;

  /**
   * Description personnelle du médecin
   */
  description?: string;

  /**
   * Éducation et formations du médecin
   */
  education?: string;

  /**
   * Spécialisations médicales
   */
  specialisations?: string;

  /**
   * Date de validation ou de rejet de la demande
   */
  dateValidation?: Date;

  /**
   * Motif du rejet (si applicable)
   */
  motifRejet?: string;

  /**
   * ID de l'administrateur qui a validé le compte
   */
  adminValidateurId?: string;

  /**
   * Historique des actions au format JSON (string)
   */
  historiqueActions?: string;

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
    statutVerification: string = "en_attente",
    secretDeuxFacteur?: string,
    codeSMS?: string,
    codeSMSExpiration?: Date,
    derniereConnexion?: Date,
    adresse?: string,
    telephone?: string,
    documentIdentite?: string,
    diplome?: string,
    photoProfil?: string,
    anneesExperience?: string,
    description?: string,
    education?: string,
    specialisations?: string,
    dateValidation?: Date,
    motifRejet?: string,
    adminValidateurId?: string,
    historiqueActions?: string,
    codeResetPassword?: string,
    codeResetPasswordExpires?: Date,
    connexions?: Connexion[],
    rendezVous?: RendezVous[],
    commentaires?: Commentaire[]
  ) {
    super(
      id,
      mail,
      motDePasse,
      dateCreation,
      TypeUtilisateur.MEDECIN,
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
    this.specialite = specialite;
    this.numeroLicence = numeroLicence;
    this.statutVerification = statutVerification;
    this.documentIdentite = documentIdentite;
    this.diplome = diplome;
    this.photoProfil = photoProfil;
    this.anneesExperience = anneesExperience;
    this.description = description;
    this.education = education;
    this.specialisations = specialisations;
    this.dateValidation = dateValidation;
    this.motifRejet = motifRejet;
    this.adminValidateurId = adminValidateurId;
    this.historiqueActions = historiqueActions;
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
  async authentifier(mail: string, _motDePasse: string): Promise<boolean> {
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
    _idPatient: string,
    _filtres: FiltresDossier
  ): DossierMedical[] {
    // Cette méthode sera implémentée dans la couche service
    return [];
  }

  /**
   * Visualise le profil complet d'un patient
   * @param idPatient - Identifiant du patient
   */
  visualiserProfilPatient(_idPatient: string): void {
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
    _type: TypeEnregistrement,
    _dateDebut: Date,
    _dateFin: Date
  ): DossierMedical[] {
    // Cette méthode sera implémentée dans la couche service
    return [];
  }

  /**
   * Ajoute un diagnostic à un dossier médical
   * @param idDossier - Identifiant du dossier
   * @param diagnostic - Diagnostic à ajouter
   */
  ajouterDiagnosticDossier(_idDossier: string, _diagnostic: string): void {
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
    _idPatient: string,
    _medicament: string,
    _dosage: string
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
  planifierTeleconsulation(_idPatient: string, _date: Date): RendezVous {
    // Cette méthode sera implémentée dans la couche service
    return {} as RendezVous;
  }

  /**
   * Envoie un message sécurisé
   * @param destinataire - Identifiant du destinataire
   * @param contenu - Contenu du message
   * @returns Message créé
   */
  envoyerMessage(_destinataire: string, _contenu: string): Message {
    // Cette méthode sera implémentée dans la couche service
    return {} as Message;
  }
}

