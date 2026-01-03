import { Medecin } from "./Medecin";
import { Administrateur } from "./Administrateur";

/**
 * Entité représentant une action dans l'historique de validation d'un médecin
 */
export class HistoriqueValidation {
    id: string;
    medecinId: string;
    adminId: string;
    action: "validation" | "rejet" | "mise_en_attente";
    statutAvant: string;
    statutApres: string;
    motif?: string;
    dateAction: Date;
    commentaireAdmin?: string;
    adresseIp?: string;

    // Relations optionnelles
    medecin?: Medecin;
    admin?: Administrateur;

    constructor(
        id: string,
        medecinId: string,
        adminId: string,
        action: "validation" | "rejet" | "mise_en_attente",
        statutAvant: string,
        statutApres: string,
        dateAction: Date = new Date(),
        motif?: string,
        commentaireAdmin?: string,
        adresseIp?: string,
        medecin?: Medecin,
        admin?: Administrateur
    ) {
        this.id = id;
        this.medecinId = medecinId;
        this.adminId = adminId;
        this.action = action;
        this.statutAvant = statutAvant;
        this.statutApres = statutApres;
        this.dateAction = dateAction;
        this.motif = motif;
        this.commentaireAdmin = commentaireAdmin;
        this.adresseIp = adresseIp;
        this.medecin = medecin;
        this.admin = admin;
    }
}
