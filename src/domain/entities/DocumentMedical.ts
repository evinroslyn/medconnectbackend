import { TypeEnregistrement } from "../enums/TypeEnregistrement";

/**
 * Entité représentant un document médical générique
 * Peut être un résultat de laboratoire, une radio, une imagerie, etc.
 */
export class DocumentMedical {
  /**
   * Identifiant unique du document médical
   */
  id: string;

  /**
   * Nom du document
   */
  nom: string;

  /**
   * Type d'enregistrement médical
   */
  type: TypeEnregistrement;

  /**
   * Identifiant du patient propriétaire
   */
  idPatient: string;

  /**
   * Identifiant du dossier médical associé (obligatoire)
   */
  idDossierMedical: string;
  
  /**
   * Description du document
   */
  description?: string;

  /**
   * Chemin d'accès au fichier stocké
   */
  cheminFichier?: string;

  /**
   * Date de création du document
   */
  dateCreation?: Date;

  constructor(
    id: string,
    nom: string,
    type: TypeEnregistrement,
    idPatient: string,
    idDossierMedical: string,
    cheminFichier?: string,
    dateCreation?: Date,
    description?: string
  ) {
    this.id = id;
    this.nom = nom;
    this.type = type;
    this.idPatient = idPatient;
    this.idDossierMedical = idDossierMedical;
    this.cheminFichier = cheminFichier;
    this.dateCreation = dateCreation;
    this.description = description;
  }
}

