import { ConnexionService } from '../src/application/services/ConnexionService.js';
import { db } from '../src/infrastructure/database/db.js';
import { connexions, patients, medecins, utilisateurs } from '../src/infrastructure/database/schema/index.js';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnexionOptimized() {
  try {
    console.log('🧪 Test des fonctionnalités optimisées de connexion médecin-patient\n');

    // Récupérer les médecins et patients
    const medecinsDisponibles = await db
      .select({
        id: medecins.id,
        nom: medecins.nom,
        specialite: medecins.specialite,
      })
      .from(medecins)
      .where(eq(medecins.statutVerification, 'valide'))
      .limit(1);

    const patientsDisponibles = await db
      .select({
        id: patients.id,
        nom: patients.nom,
      })
      .from(patients)
      .limit(1);

    if (medecinsDisponibles.length === 0 || patientsDisponibles.length === 0) {
      console.log('❌ Médecin ou patient manquant pour les tests');
      return;
    }

    const testMedecin = medecinsDisponibles[0];
    const testPatient = patientsDisponibles[0];

    console.log(`🧪 Test avec:`);
    console.log(`  Médecin: ${testMedecin.nom}`);
    console.log(`  Patient: ${testPatient.nom}\n`);

    // Test 1: Envoyer une demande de connexion
    console.log('🔄 Test 1: Envoi d\'une nouvelle demande...');
    const demandeResult = await ConnexionService.sendConnexionRequest(testPatient.id, testMedecin.id);
    
    if (demandeResult.success) {
      console.log('✅ Demande envoyée:', demandeResult.message);
      const connexionId = demandeResult.data.id;

      // Test 2: Accepter avec niveau d'accès
      console.log('\n🔄 Test 2: Acceptation avec niveau d\'accès "Partiel"...');
      const acceptResult = await ConnexionService.acceptConnexion(connexionId, testMedecin.id, 'Partiel');
      
      if (acceptResult.success) {
        console.log('✅ Acceptation réussie:', acceptResult.message);
        console.log('   Données:', acceptResult.data);
      } else {
        console.log('❌ Erreur acceptation:', acceptResult.message);
      }

      // Test 3: Tenter de renvoyer une demande (doit échouer)
      console.log('\n🔄 Test 3: Tentative de nouvelle demande (doit échouer)...');
      const demandeResult2 = await ConnexionService.sendConnexionRequest(testPatient.id, testMedecin.id);
      
      if (!demandeResult2.success) {
        console.log('✅ Rejet attendu:', demandeResult2.message);
      } else {
        console.log('❌ Erreur: La demande aurait dû être rejetée');
      }

      // Test 4: Révoquer la connexion
      console.log('\n🔄 Test 4: Révocation de la connexion...');
      const revokeResult = await ConnexionService.rejectConnexion(connexionId, testMedecin.id, 'medecin', 'Test de révocation');
      
      if (revokeResult.success) {
        console.log('✅ Révocation réussie:', revokeResult.message);
      } else {
        console.log('❌ Erreur révocation:', revokeResult.message);
      }

      // Test 5: Réactiver une connexion révoquée
      console.log('\n🔄 Test 5: Réactivation d\'une connexion révoquée...');
      const reactivateResult = await ConnexionService.sendConnexionRequest(testPatient.id, testMedecin.id);
      
      if (reactivateResult.success) {
        console.log('✅ Réactivation réussie:', reactivateResult.message);
      } else {
        console.log('❌ Erreur réactivation:', reactivateResult.message);
      }

    } else {
      console.log('❌ Erreur demande:', demandeResult.message);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

testConnexionOptimized();