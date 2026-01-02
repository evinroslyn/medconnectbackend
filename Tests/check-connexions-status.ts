import { db } from '../src/infrastructure/database/db.js';
import { connexions, patients, medecins, utilisateurs } from '../src/infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkConnexionsStatus() {
  try {
    console.log('📊 État actuel des connexions médecin-patient\n');

    // Récupérer toutes les connexions avec détails
    const allConnexions = await db
      .select({
        id: connexions.id,
        statut: connexions.statut,
        niveauAcces: connexions.niveauAcces,
        dateCreation: connexions.dateCreation,
        dateAcceptation: connexions.dateAcceptation,
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
      .innerJoin(utilisateurs, eq(patients.id, utilisateurs.id));

    if (allConnexions.length === 0) {
      console.log('❌ Aucune connexion trouvée dans la base de données');
      return;
    }

    console.log(`📈 Total: ${allConnexions.length} connexion(s) trouvée(s)\n`);

    // Grouper par statut
    const enAttente = allConnexions.filter(c => c.statut === 'En_attente');
    const acceptees = allConnexions.filter(c => c.statut === 'Accepté');
    const revoquees = allConnexions.filter(c => c.statut === 'Revoqué');

    console.log('📊 STATISTIQUES:');
    console.log(`  🟡 En attente: ${enAttente.length}`);
    console.log(`  🟢 Acceptées: ${acceptees.length}`);
    console.log(`  🔴 Révoquées: ${revoquees.length}\n`);

    // Afficher les connexions en attente (priorité)
    if (enAttente.length > 0) {
      console.log('🟡 DEMANDES EN ATTENTE:');
      enAttente.forEach((connexion, index) => {
        console.log(`  ${index + 1}. ${connexion.patientNom} → Dr. ${connexion.medecinNom}`);
        console.log(`     📧 Patient: ${connexion.patientEmail}`);
        console.log(`     🏥 Médecin: ${connexion.medecinSpecialite}`);
        console.log(`     🆔 ID Connexion: ${connexion.id}`);
        console.log(`     📅 Demandé le: ${connexion.dateCreation?.toLocaleDateString('fr-FR')}`);
        console.log('');
      });
    }

    // Afficher les connexions acceptées
    if (acceptees.length > 0) {
      console.log('🟢 CONNEXIONS ACCEPTÉES:');
      acceptees.forEach((connexion, index) => {
        console.log(`  ${index + 1}. ${connexion.patientNom} ↔ Dr. ${connexion.medecinNom}`);
        console.log(`     📧 Patient: ${connexion.patientEmail}`);
        console.log(`     🏥 Médecin: ${connexion.medecinSpecialite}`);
        console.log(`     🆔 ID Connexion: ${connexion.id}`);
        console.log(`     📅 Accepté le: ${connexion.dateAcceptation?.toLocaleDateString('fr-FR')}`);
        console.log(`     🔐 Niveau d'accès: ${connexion.niveauAcces || 'Non défini'}`);
        console.log('');
      });
    }

    // Afficher les connexions révoquées
    if (revoquees.length > 0) {
      console.log('🔴 CONNEXIONS RÉVOQUÉES:');
      revoquees.forEach((connexion, index) => {
        console.log(`  ${index + 1}. ${connexion.patientNom} ✗ Dr. ${connexion.medecinNom}`);
        console.log(`     📧 Patient: ${connexion.patientEmail}`);
        console.log(`     🏥 Médecin: ${connexion.medecinSpecialite}`);
        console.log(`     🆔 ID Connexion: ${connexion.id}`);
        console.log(`     📅 Créé le: ${connexion.dateCreation?.toLocaleDateString('fr-FR')}`);
        console.log('');
      });
    }

    console.log('💡 Actions possibles:');
    console.log('   - Pour accepter une demande: npx tsx accept-connexion.ts --id=ID_CONNEXION');
    console.log('   - Pour refuser une demande: npx tsx reject-connexion.ts --id=ID_CONNEXION');
    console.log('   - Pour nettoyer toutes les connexions: npx tsx clean-connexions.ts');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkConnexionsStatus();