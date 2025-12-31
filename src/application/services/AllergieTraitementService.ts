import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { allergies, traitements } from "../../infrastructure/database/schema";
import { Allergie } from "../../domain/entities/Allergie";
import { Traitement } from "../../domain/entities/Traitement";
import { randomUUID } from "crypto";

/**
 * Service pour gérer les allergies et traitements des patients
 */
export class AllergieTraitementService {
  /**
   * Récupère toutes les allergies d'un patient
   */
  static async getAllergiesByPatient(idPatient: string): Promise<Allergie[]> {
    const result = await db
      .select()
      .from(allergies)
      .where(eq(allergies.idPatient, idPatient));

    return result.map(
      (a) =>
        new Allergie(
          a.id,
          a.nom,
          a.idDossierMedical || undefined,
          a.idPatient,
          a.description || undefined,
          a.dateDecouverte || undefined
        )
    );
  }

  /**
   * Récupère une allergie par son ID
   */
  static async getAllergieById(id: string): Promise<Allergie | null> {
    const result = await db
      .select()
      .from(allergies)
      .where(eq(allergies.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const a = result[0];
    return new Allergie(
      a.id,
      a.nom,
      a.idDossierMedical || undefined,
      a.idPatient,
      a.description || undefined,
      a.dateDecouverte || undefined
    );
  }

  /**
   * Récupère un traitement par son ID
   */
  static async getTraitementById(id: string): Promise<Traitement | null> {
    const result = await db
      .select()
      .from(traitements)
      .where(eq(traitements.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const t = result[0];
    return new Traitement(
      t.id,
      t.idPatient,
      t.nom,
      t.dateDebut,
      t.description || undefined,
      t.dateFin || undefined,
      t.posologie || undefined,
      t.medecinPrescripteur || undefined,
      t.dateCreation || undefined
    );
  }

  /**
   * Ajoute une allergie à un patient
   */
  static async addAllergie(
    idPatient: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Allergie> {
    const id = randomUUID();
    const allergie = new Allergie(id, nom, undefined, idPatient, description, dateDecouverte);

    await db.insert(allergies).values({
      id: allergie.id,
      idPatient: allergie.idPatient!,
      nom: allergie.nom,
      description: allergie.description || null,
      dateDecouverte: allergie.dateDecouverte || null,
      idDossierMedical: null,
    });

    return allergie;
  }

  /**
   * Met à jour une allergie
   */
  static async updateAllergie(
    id: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Allergie | null> {
    const existing = await db.select().from(allergies).where(eq(allergies.id, id)).limit(1);

    if (existing.length === 0) {
      return null;
    }

    await db
      .update(allergies)
      .set({
        nom,
        description: description || null,
        dateDecouverte: dateDecouverte || null,
      })
      .where(eq(allergies.id, id));

    return new Allergie(
      id,
      nom,
      existing[0].idDossierMedical || undefined,
      existing[0].idPatient,
      description,
      dateDecouverte
    );
  }

  /**
   * Supprime une allergie
   */
  static async deleteAllergie(id: string): Promise<boolean> {
    const result = await db.delete(allergies).where(eq(allergies.id, id));
    return true;
  }

  /**
   * Récupère tous les traitements d'un patient
   */
  static async getTraitementsByPatient(idPatient: string): Promise<Traitement[]> {
    const result = await db
      .select()
      .from(traitements)
      .where(eq(traitements.idPatient, idPatient))
      .orderBy(traitements.dateDebut);

    return result.map(
      (t) =>
        new Traitement(
          t.id,
          t.idPatient,
          t.nom,
          t.dateDebut,
          t.description || undefined,
          t.dateFin || undefined,
          t.posologie || undefined,
          t.medecinPrescripteur || undefined,
          t.dateCreation || undefined
        )
    );
  }

  /**
   * Ajoute un traitement à un patient
   */
  static async addTraitement(
    idPatient: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Traitement> {
    const id = randomUUID();
    const traitement = new Traitement(
      id,
      idPatient,
      nom,
      dateDebut,
      description,
      dateFin,
      posologie,
      medecinPrescripteur
    );

    await db.insert(traitements).values({
      id: traitement.id,
      idPatient: traitement.idPatient,
      nom: traitement.nom,
      description: traitement.description || null,
      dateDebut: traitement.dateDebut,
      dateFin: traitement.dateFin || null,
      posologie: traitement.posologie || null,
      medecinPrescripteur: traitement.medecinPrescripteur || null,
    });

    return traitement;
  }

  /**
   * Met à jour un traitement
   */
  static async updateTraitement(
    id: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Traitement | null> {
    const existing = await db.select().from(traitements).where(eq(traitements.id, id)).limit(1);

    if (existing.length === 0) {
      return null;
    }

    await db
      .update(traitements)
      .set({
        nom,
        description: description || null,
        dateDebut,
        dateFin: dateFin || null,
        posologie: posologie || null,
        medecinPrescripteur: medecinPrescripteur || null,
      })
      .where(eq(traitements.id, id));

    return new Traitement(
      id,
      existing[0].idPatient,
      nom,
      dateDebut,
      description,
      dateFin,
      posologie,
      medecinPrescripteur
    );
  }

  /**
   * Supprime un traitement
   */
  static async deleteTraitement(id: string): Promise<boolean> {
    await db.delete(traitements).where(eq(traitements.id, id));
    return true;
  }
}

