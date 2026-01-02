import { ConnexionService } from '../src/application/services/ConnexionService.js';
import { db } from '../src/infrastructure/database/db.js';
import { connexions, patients, medecins, utilisateurs } from '../src/infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function rejectConnexion(connexionId?: string) {
  try {
    if (!connexionId) {
      console.log('❌ Usage: npx tsx reject-connexion.ts --id=ID_CONNEXION');
      return;
    }

    console.log(`🔄 Refus de la connexion ${connexionId}...\n`);

    // 1. Récupérer les détails de la connexion
    const connexionDetails = await db
      .select({
        id: connexions.id,
        statut: connexions.statut,
        dateCreation: connexions.dateCreation,
        patientId: connexions.idPatient,
        patientNom: patients.nom,
        patientEmail: utilisateurs.mail,
        medecinId: connexions.idMedecin,
        medecinNom: medecins.nom,
        medecinSpecialite: medecins.specialite,
      })
      .from(connexions)
      .innerJoin(patients, eq(connexions.idPatient, patients.id))
      .innerJoin(medecins, eq(connexions.idMedecin, medecins.id))
      .innerJoin(utilisateurs, eq(patients.id, utilisateurs.id))
      .where(eq(connexions.id, connexionId))
      .limit(1);

    if (connexionDetails.length === 0) {
      console.log('❌ Connexion non trouvée');
      return;
    }

    const connexion = connexionDetails[0];
    
    console.log('📋 Détails de la connexion:');
    console.log(`   Patient: ${connexion.patientNom} (${connexion.patientEmail})`);
    console.log(`   Médecin: Dr. ${connexion.medecinNom} - ${connexion.medecinSpecialite}`);
    console.log(`   Statut actuel: ${connexion.statut}`);
    console.log(`   Demandé le: ${connexion.dateCreation?.toLocaleDateString('fr-FR')}\n`);

    // 2. Refuser la connexion
    console.log('🔄 Refus en cours...');
    const result = await ConnexionService.rejectConnexion(connexionId, connexion.medecinId, 'medecin');

    if (result.success) {
      console.log('✅ Connexion refusée avec succès !');
      
      // 3. Vérifier le nouveau statut
      const updatedConnexion = await db
        .select({
          statut: connexions.statut,
        })
        .from(connexions)
        .where(eq(connexions.id, connexionId))
        .limit(1);

      if (updatedConnexion.length > 0) {
        const updated = updatedConnexion[0];
        console.log(`   Nouveau statut: ${updated.statut}`);
      }

      console.log('\n📧 Le patient sera notifié du refus de sa demande');
      
    } else {
      console.log('❌ Erreur lors du refus:', result.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Récupérer l'ID depuis les arguments
const args = process.argv.slice(2);
const idArg = args.find(arg => arg.startsWith('--id='));

if (idArg) {
  const connexionId = idArg.split('=')[1];
  rejectConnexion(connexionId);
} else {
  rejectConnexion();
}