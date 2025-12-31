import { Utilisateur } from "./Utilisateur";

/**
 * Entité représentant un message sécurisé entre utilisateurs
 * Les messages sont chiffrés pour garantir la confidentialité des communications
 */
export class Message {
  /**
   * Identifiant unique du message
   */
  id: string;

  /**
   * Contenu du message (chiffré)
   */
  contenu: string;

  /**
   * Date d'envoi du message
   */
  date: Date;

  /**
   * Indicateur de confirmation de lecture
   */
  confirmationDeLecture: boolean;

  /**
   * Utilisateur expéditeur du message
   */
  expediteur?: Utilisateur;

  /**
   * Identifiant de l'expéditeur
   */
  idExpediteur: string;

  /**
   * Utilisateur destinataire du message
   */
  destinataire?: Utilisateur;

  /**
   * Identifiant du destinataire
   */
  idDestinataire: string;

  constructor(
    id: string,
    contenu: string,
    date: Date,
    idExpediteur: string,
    idDestinataire: string,
    confirmationDeLecture: boolean = false,
    expediteur?: Utilisateur,
    destinataire?: Utilisateur
  ) {
    this.id = id;
    this.contenu = contenu;
    this.date = date;
    this.idExpediteur = idExpediteur;
    this.idDestinataire = idDestinataire;
    this.confirmationDeLecture = confirmationDeLecture;
    this.expediteur = expediteur;
    this.destinataire = destinataire;
  }

  /**
   * Marque le message comme envoyé
   */
  envoyer(): void {
    // Cette méthode sera implémentée dans la couche service
  }

  /**
   * Chiffre le contenu du message
   * @param contenu - Contenu en clair à chiffrer
   * @returns Contenu chiffré
   */
  chiffrer(contenu: string): string {
    // Cette méthode sera implémentée dans la couche service
    // Le chiffrement sera géré par le service de messagerie
    return contenu;
  }

  /**
   * Déchiffre le contenu du message
   * @param cle - Clé de déchiffrement
   * @returns Contenu déchiffré
   */
  dechiffrer(cle: string): string {
    // Cette méthode sera implémentée dans la couche service
    // Le déchiffrement sera géré par le service de messagerie
    return this.contenu;
  }
}

