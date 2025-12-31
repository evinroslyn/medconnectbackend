import { TypeEnregistrement } from "../enums/TypeEnregistrement";
import { Ordonnance } from "./Ordonnance";
import { DocumentMedical } from "./DocumentMedical";
import { Allergie } from "./Allergie";
import { Commentaire } from "./Commentaire";

/**
 * Entité représentant un dossier médical dans le système Med-Connect
 * C'est la classe centrale pour la gestion des enregistrements médicaux
 */
export class DossierMedical {
  /**
   * Identifiant unique du dossier médical
   */
  id: string;

  /**
   * Identifiant du patient propriétaire du dossier
   */
  idPatient: string;

  /**
   * Titre du dossier médical
   */
  titre: string;

  /**
   * Date de création ou de l'événement médical
   */
  date: Date;

  /**
   * Description détaillée du dossier
   */
  description?: string;

  /**
   * Type d'enregistrement médical (via énumération) - optionnel car un dossier peut contenir différents types
   */
  type?: TypeEnregistrement;

  // cheminFichier supprimé - les fichiers sont dans DocumentMedical

  /**
   * Numéro de version du document
   */
  version: number;

  /**
   * Date de la dernière modification
   */
  dernierModification: Date;

  /**
   * Ordonnances associées au dossier
   */
  ordonnances?: Ordonnance[];

  /**
   * Documents médicaux associés au dossier
   */
  documentsMedicaux?: DocumentMedical[];

  /**
   * Allergies associées au dossier
   */
  allergies?: Allergie[];

  /**
   * Commentaires des médecins sur le dossier
   */
  commentaires?: Commentaire[];

  constructor(
    id: string,
    idPatient: string,
    titre: string,
    date: Date,
    version: number,
    dernierModification: Date,
    description?: string,
    type?: TypeEnregistrement,
    ordonnances?: Ordonnance[],
    documentsMedicaux?: DocumentMedical[],
    allergies?: Allergie[],
    commentaires?: Commentaire[]
  ) {
    this.id = id;
    this.idPatient = idPatient;
    this.titre = titre;
    this.date = date;
    this.description = description;
    this.type = type;
    this.version = version;
    this.dernierModification = dernierModification;
    this.ordonnances = ordonnances;
    this.documentsMedicaux = documentsMedicaux;
    this.allergies = allergies;
    this.commentaires = commentaires;
  }

  /**
   * Téléverse un fichier associé au dossier
   * @param fichier - Fichier à téléverser
   */
  televerserFichier(fichier: File): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Obtient l'historique des versions du dossier
   * @returns Liste des versions du dossier
   */
  obtenirVersions(): any[] {
    // Cette méthode sera implémentée dans la couche service
    // Le type VersionDossier sera défini si nécessaire
    return [];
  }

  /**
   * Chiffre les données du dossier pour la sécurité
   */
  chiffrerDonnee(): void {
    // Cette méthode sera implémentée dans la couche service
  }
}

