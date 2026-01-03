import { Patient } from "./Patient";
import { Medecin } from "./Medecin";

/**
 * Entité représentant un partage médical entre un patient et un médecin
 * Permet d'accorder des permissions spécifiques sur un dossier ou un document
 */
export class PartageMedical {
    id: string;
    idPatient: string;
    idMedecin: string;
    typeRessource: "dossier" | "document";
    idRessource: string;
    peutTelecharger: boolean;
    peutScreenshot: boolean;
    dateCreation: Date;
    dateExpiration?: Date;
    statut: string;

    // Relations optionnelles
    patient?: Patient;
    medecin?: Medecin;

    constructor(
        id: string,
        idPatient: string,
        idMedecin: string,
        typeRessource: "dossier" | "document",
        idRessource: string,
        peutTelecharger: boolean = false,
        peutScreenshot: boolean = false,
        dateCreation: Date = new Date(),
        statut: string = "actif",
        dateExpiration?: Date,
        patient?: Patient,
        medecin?: Medecin
    ) {
        this.id = id;
        this.idPatient = idPatient;
        this.idMedecin = idMedecin;
        this.typeRessource = typeRessource;
        this.idRessource = idRessource;
        this.peutTelecharger = peutTelecharger;
        this.peutScreenshot = peutScreenshot;
        this.dateCreation = dateCreation;
        this.statut = statut;
        this.dateExpiration = dateExpiration;
        this.patient = patient;
        this.medecin = medecin;
    }
}
