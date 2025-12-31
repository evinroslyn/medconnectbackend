/**
 * Entité représentant une allergie d'un patient
 * Les allergies sont associées aux dossiers médicaux
 */
export class Allergie {
  /**
   * Identifiant unique de l'allergie
   */
  id: string;

  /**
   * Nom de l'allergie (ex: "Pénicilline", "Arachides")
   */
  nom: string;

  /**
   * Identifiant du dossier médical associé
   */
  idDossierMedical?: string;

  /**
   * Identifiant du patient
   */
  idPatient?: string;

  /**
   * Description détaillée de l'allergie
   */
  description?: string;

  /**
   * Date de découverte de l'allergie
   */
  dateDecouverte?: Date;

  constructor(
    id: string,
    nom: string,
    idDossierMedical?: string,
    idPatient?: string,
    description?: string,
    dateDecouverte?: Date
  ) {
    this.id = id;
    this.nom = nom;
    this.idDossierMedical = idDossierMedical;
    this.idPatient = idPatient;
    this.description = description;
    this.dateDecouverte = dateDecouverte;
  }
}

