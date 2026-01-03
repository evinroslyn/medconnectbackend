import { Medecin } from "./Medecin";
import { TypeConsultation } from "../enums/TypeConsultation";

/**
 * Entité représentant une plage de disponibilité d'un médecin
 */
export class Disponibilite {
    id: string;
    idMedecin: string;
    jour: Date;
    heureDebut: string; // Format "HH:mm"
    heureFin: string;   // Format "HH:mm"
    lieu?: string;
    centreMedical?: string;
    typeConsultation: TypeConsultation;
    actif: boolean;
    dateCreation: Date;

    // Relation optionnelle
    medecin?: Medecin;

    constructor(
        id: string,
        idMedecin: string,
        jour: Date,
        heureDebut: string,
        heureFin: string,
        typeConsultation: TypeConsultation,
        actif: boolean = true,
        dateCreation: Date = new Date(),
        lieu?: string,
        centreMedical?: string,
        medecin?: Medecin
    ) {
        this.id = id;
        this.idMedecin = idMedecin;
        this.jour = jour;
        this.heureDebut = heureDebut;
        this.heureFin = heureFin;
        this.typeConsultation = typeConsultation;
        this.actif = actif;
        this.dateCreation = dateCreation;
        this.lieu = lieu;
        this.centreMedical = centreMedical;
        this.medecin = medecin;
    }
}
