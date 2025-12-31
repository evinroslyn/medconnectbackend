import { Medecin } from "./Medecin";
import { Patient } from "./Patient";
import { StatusRV } from "../enums/StatusRV";
import { TypeConsultation } from "../enums/TypeConsultation";

/**
 * Entité représentant un rendez-vous ou une téléconsultation
 * Gère les rendez-vous planifiés par les médecins pour les patients
 */
export class RendezVous {
  /**
   * Identifiant unique du rendez-vous
   */
  id: string;

  /**
   * Date et heure du rendez-vous
   */
  date: Date;

  /**
   * Type de consultation (Téléconsultation ou Présentiel)
   */
  type: TypeConsultation;

  /**
   * Statut du rendez-vous (Planifié, Terminé, Annulé)
   */
  statut: StatusRV;

  /**
   * Médecin qui planifie le rendez-vous
   */
  medecin?: Medecin;

  /**
   * Identifiant du médecin
   */
  idMedecin: string;

  /**
   * Patient concerné par le rendez-vous
   */
  patient?: Patient;

  /**
   * Identifiant du patient
   */
  idPatient: string;

  /**
   * Notes ou commentaires sur le rendez-vous
   */
  notes?: string;

  /**
   * Durée prévue du rendez-vous (en minutes)
   */
  duree?: number;

  constructor(
    id: string,
    date: Date,
    type: TypeConsultation,
    statut: StatusRV,
    idMedecin: string,
    idPatient: string,
    medecin?: Medecin,
    patient?: Patient,
    notes?: string,
    duree?: number
  ) {
    this.id = id;
    this.date = date;
    this.type = type;
    this.statut = statut;
    this.idMedecin = idMedecin;
    this.idPatient = idPatient;
    this.medecin = medecin;
    this.patient = patient;
    this.notes = notes;
    this.duree = duree;
  }

  /**
   * Confirme le rendez-vous
   */
  confirmer(): void {
    this.statut = StatusRV.PLANIFIE;
  }

  /**
   * Annule le rendez-vous
   */
  annuler(): void {
    this.statut = StatusRV.ANNULE;
  }
}

