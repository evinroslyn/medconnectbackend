/**
 * Entité représentant un traitement médical d'un patient
 */
export class Traitement {
  /**
   * Identifiant unique du traitement
   */
  id: string;

  /**
   * Identifiant du patient
   */
  idPatient: string;

  /**
   * Nom du traitement (ex: "Paracétamol", "Insuline")
   */
  nom: string;

  /**
   * Description détaillée du traitement
   */
  description?: string;

  /**
   * Date de début du traitement
   */
  dateDebut: Date;

  /**
   * Date de fin du traitement (optionnel si traitement en cours)
   */
  dateFin?: Date;

  /**
   * Posologie (ex: "1 comprimé matin et soir")
   */
  posologie?: string;

  /**
   * Nom du médecin prescripteur
   */
  medecinPrescripteur?: string;

  /**
   * Date de création de l'enregistrement
   */
  dateCreation?: Date;

  constructor(
    id: string,
    idPatient: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string,
    dateCreation?: Date
  ) {
    this.id = id;
    this.idPatient = idPatient;
    this.nom = nom;
    this.dateDebut = dateDebut;
    this.description = description;
    this.dateFin = dateFin;
    this.posologie = posologie;
    this.medecinPrescripteur = medecinPrescripteur;
    this.dateCreation = dateCreation;
  }
}

