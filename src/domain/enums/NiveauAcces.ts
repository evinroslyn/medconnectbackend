/**
 * Énumération représentant les niveaux d'accès accordés par un patient à un médecin
 * Permet un contrôle granulaire sur le partage des données médicales
 */
export enum NiveauAcces {
  COMPLET = "Complet",
  PARTIEL = "Partiel",
  LECTURE_SEULE = "Lecture_Seule",
}

