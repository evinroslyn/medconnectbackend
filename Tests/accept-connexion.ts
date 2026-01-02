import { ConnexionService } from '../src/application/services/ConnexionService.js';
import { db } from '../src/infrastructure/database/db.js';
import { connexions, patients, medecins, utilisateurs } from '../src/infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function acceptConnexion(connexionId?: string) {
  try {
    if (!connexionId) {
      console.log('❌ Usage: npx tsx accept-connexion.ts --id=ID_CONNEXION');
      return;
    }

    console.log(`🔄 Acceptation de la connexion ${connexionId}...\n`);

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

    if (connexion.statut !== 'En_attente') {
      console.log(`⚠️  Cette connexion ne peut pas être acceptée (statut: ${connexion.statut})`);
      return;
    }

    // 2. Accepter la connexion
    console.log('🔄 Acceptation en cours...');
    const result = await ConnexionService.acceptConnexion(connexionId, connexion.medecinId);

    if (result.success) {
      console.log('✅ Connexion acceptée avec succès !');
      
      // 3. Vérifier le nouveau statut
      const updatedConnexion = await db
        .select({
          statut: connexions.statut,
          dateAcceptation: connexions.dateAcceptation,
          niveauAcces: connexions.niveauAcces
        })
        .from(connexions)
        .where(eq(connexions.id, connexionId))
        .limit(1);

      if (updatedConnexion.length > 0) {
        const updated = updatedConnexion[0];
        console.log(`   Nouveau statut: ${updated.statut}`);
        console.log(`   Date d'acceptation: ${updated.dateAcceptation?.toLocaleString('fr-FR')}`);
        console.log(`   Niveau d'accès: ${updated.niveauAcces || 'Non défini'}`);
      }

      console.log('\n🎉 Le patient peut maintenant accéder aux services du médecin !');
      
    } else {
      console.log('❌ Erreur lors de l\'acceptation:', result.message);
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
  acceptConnexion(connexionId);
} else {
  acceptConnexion();
}