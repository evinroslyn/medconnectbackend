/**
 * Entité représentant une ordonnance médicale
 * Une ordonnance est associée à un dossier médical et contient des prescriptions de médicaments
 */
export class Ordonnance {
  /**
   * Identifiant unique de l'ordonnance
   */
  id: string;

  /**
   * Nom du médicament prescrit
   */
  medicament: string;

  /**
   * Dosage du médicament
   */
  dosage: string;

  /**
   * Durée du traitement
   */
  duree: string;

  /**
   * Date d'émission de l'ordonnance
   */
  dateEmission: Date;

  /**
   * Identifiant du dossier médical associé
   */
  idDossierMedical?: string;

  /**
   * Identifiant du médecin prescripteur
   */
  idMedecin?: string;

  constructor(
    id: string,
    medicament: string,
    dosage: string,
    duree: string,
    dateEmission: Date,
    idDossierMedical?: string,
    idMedecin?: string
  ) {
    this.id = id;
    this.medicament = medicament;
    this.dosage = dosage;
    this.duree = duree;
    this.dateEmission = dateEmission;
    this.idDossierMedical = idDossierMedical;
    this.idMedecin = idMedecin;
  }
}

