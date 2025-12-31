import { Medecin } from "./Medecin";
import { DossierMedical } from "./DossierMedical";
import { DocumentMedical } from "./DocumentMedical";

/**
 * Entité représentant un commentaire fait par un médecin sur un dossier médical ou un document médical
 * Permet aux médecins d'ajouter des notes et observations
 * Un commentaire peut être associé à un dossier médical ou à un document médical spécifique
 */
export class Commentaire {
  /**
   * Identifiant unique du commentaire
   */
  id: string;

  /**
   * Contenu du commentaire
   */
  contenu: string;

  /**
   * Date de création du commentaire
   */
  dateCreation: Date;

  /**
   * Médecin auteur du commentaire
   */
  medecin?: Medecin;

  /**
   * Identifiant du médecin
   */
  idMedecin: string;

  /**
   * Dossier médical concerné par le commentaire (obligatoire)
   */
  dossierMedical?: DossierMedical;

  /**
   * Identifiant du dossier médical (obligatoire)
   */
  idDossierMedical: string;

  /**
   * Document médical concerné par le commentaire (optionnel)
   * Si présent, le commentaire est spécifique à ce document
   */
  documentMedical?: DocumentMedical;

  /**
   * Identifiant du document médical (optionnel)
   */
  idDocumentMedical?: string;

  constructor(
    id: string,
    contenu: string,
    dateCreation: Date,
    idMedecin: string,
    idDossierMedical: string,
    idDocumentMedical?: string,
    medecin?: Medecin,
    dossierMedical?: DossierMedical,
    documentMedical?: DocumentMedical
  ) {
    this.id = id;
    this.contenu = contenu;
    this.dateCreation = dateCreation;
    this.idMedecin = idMedecin;
    this.idDossierMedical = idDossierMedical;
    this.idDocumentMedical = idDocumentMedical;
    this.medecin = medecin;
    this.dossierMedical = dossierMedical;
    this.documentMedical = documentMedical;
  }
}

