import { Patient } from "./Patient";
import { Medecin } from "./Medecin";
import { Status } from "../enums/Status";
import { NiveauAcces } from "../enums/NiveauAcces";

/**
 * Entité représentant une connexion entre un patient et un médecin
 * Gère les demandes de connexion et les permissions d'accès aux dossiers médicaux
 */
export class Connexion {
  /**
   * Identifiant unique de la connexion
   */
  id: string;

  /**
   * Patient concerné par la connexion
   */
  patient?: Patient;

  /**
   * Identifiant du patient
   */
  idPatient: string;

  /**
   * Médecin concerné par la connexion
   */
  medecin?: Medecin;

  /**
   * Identifiant du médecin
   */
  idMedecin: string;

  /**
   * Statut de la connexion (En_attente, Accepté, Revoqué)
   */
  statut: Status;

  /**
   * Niveau d'accès accordé au médecin (Complet, Partiel, Lecture_Seule)
   */
  niveauAcces?: NiveauAcces;

  /**
   * Date de création de la demande de connexion
   */
  dateCreation: Date;

  /**
   * Date d'acceptation de la connexion
   */
  dateAcceptation?: Date;

  constructor(
    id: string,
    idPatient: string,
    idMedecin: string,
    statut: Status,
    dateCreation: Date,
    patient?: Patient,
    medecin?: Medecin,
    niveauAcces?: NiveauAcces,
    dateAcceptation?: Date
  ) {
    this.id = id;
    this.idPatient = idPatient;
    this.idMedecin = idMedecin;
    this.statut = statut;
    this.dateCreation = dateCreation;
    this.patient = patient;
    this.medecin = medecin;
    this.niveauAcces = niveauAcces;
    this.dateAcceptation = dateAcceptation;
  }

  /**
   * Initie une demande de connexion
   */
  demander(): void {
    this.statut = Status.EN_ATTENTE;
  }

  /**
   * Accepte une demande de connexion
   */
  accepter(): void {
    this.statut = Status.ACCEPTE;
    this.dateAcceptation = new Date();
  }

  /**
   * Révoque une connexion ou un accès
   */
  revoquer(): void {
    this.statut = Status.REVOQUE;
  }

  /**
   * Vérifie si un utilisateur a accès à une ressource spécifique
   * @param ressource - Ressource à vérifier
   * @returns true si l'accès est autorisé
   */
  verifierAcces(ressource: string): boolean {
    // Cette méthode sera implémentée dans la couche service
    // La logique de vérification d'accès sera gérée selon le niveau d'accès
    if (this.statut !== Status.ACCEPTE) {
      return false;
    }

    // Logique de vérification selon le niveau d'accès
    if (this.niveauAcces === NiveauAcces.COMPLET) {
      return true;
    }

    if (this.niveauAcces === NiveauAcces.LECTURE_SEULE) {
      // Vérifier que la ressource est en lecture seule
      return true;
    }

    if (this.niveauAcces === NiveauAcces.PARTIEL) {
      // Vérifier les ressources autorisées pour l'accès partiel
      return true;
    }

    return false;
  }
}

