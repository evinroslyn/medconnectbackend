import { db } from '../src/infrastructure/database/db.js';
import { connexions, patients, medecins, utilisateurs } from '../src/infrastructure/database/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { ConnexionService } from '../src/application/services/ConnexionService.js';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnexionMedecinPatient() {
  try {
    console.log('🧪 Test de la fonctionnalité de connexion médecin-patient\n');

    // 1. Lister les médecins disponibles
    console.log('👨‍⚕️ Médecins disponibles:');
    const medecinsDisponibles = await db
      .select({
        id: medecins.id,
        nom: medecins.nom,
        specialite: medecins.specialite,
        email: utilisateurs.mail,
        statut: medecins.statutVerification
      })
      .from(medecins)
      .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
      .where(eq(medecins.statutVerification, 'valide'));

    medecinsDisponibles.forEach((medecin, index) => {
      console.log(`  ${index + 1}. ${medecin.nom} - ${medecin.specialite} (${medecin.email})`);
    });

    if (medecinsDisponibles.length === 0) {
      console.log('❌ Aucun médecin validé trouvé. Créez d\'abord un médecin et validez-le.');
      return;
    }

    // 2. Lister les patients disponibles
    console.log('\n👥 Patients disponibles:');
    const patientsDisponibles = await db
      .select({
        id: patients.id,
        nom: patients.nom,
        email: utilisateurs.mail,
        telephone: utilisateurs.telephone
      })
      .from(patients)
      .innerJoin(utilisateurs, eq(patients.id, utilisateurs.id));

    patientsDisponibles.forEach((patient, index) => {
      console.log(`  ${index + 1}. ${patient.nom} (${patient.email})`);
    });

    if (patientsDisponibles.length === 0) {
      console.log('❌ Aucun patient trouvé. Créez d\'abord un patient.');
      return;
    }

    // 3. Prendre le premier médecin et le premier patient pour les tests
    const testMedecin = medecinsDisponibles[0];
    const testPatient = patientsDisponibles[0];

    console.log(`\n🧪 Test avec:`);
    console.log(`  Médecin: ${testMedecin.nom} (${testMedecin.id})`);
    console.log(`  Patient: ${testPatient.nom} (${testPatient.id})`);

    // 4. Vérifier les connexions existantes
    console.log('\n📋 Vérification des connexions existantes...');
    const connexionsExistantes = await db
      .select()
      .from(connexions)
      .where(and(
        eq(connexions.idPatient, testPatient.id),
        eq(connexions.idMedecin, testMedecin.id)
      ));

    if (connexionsExistantes.length > 0) {
      console.log(`⚠️  ${connexionsExistantes.length} connexion(s) existante(s) trouvée(s)`);
      
      // Supprimer toutes les connexions existantes pour le test
      for (const connexion of connexionsExistantes) {
        console.log(`   - Statut: ${connexion.statut}, ID: ${connexion.id}`);
        await db
          .delete(connexions)
          .where(eq(connexions.id, connexion.id));
      }
      console.log('🗑️  Toutes les connexions existantes supprimées pour le test');
    } else {
      console.log('✅ Aucune connexion existante trouvée');
    }

    // 5. Test 1: Envoyer une demande de connexion
    console.log('\n🔄 Test 1: Envoi d\'une demande de connexion...');
    const demandeResult = await ConnexionService.sendConnexionRequest(testPatient.id, testMedecin.id);
    
    if (demandeResult.success) {
      console.log('✅ Demande envoyée avec succès');
      console.log(`   ID de connexion: ${demandeResult.data.id}`);
      console.log(`   Statut: ${demandeResult.data.statut}`);
    } else {
      console.log('❌ Erreur lors de l\'envoi:', demandeResult.message);
      return;
    }

    const connexionId = demandeResult.data.id;

    // 6. Test 2: Récupérer les demandes en attente pour le médecin
    console.log('\n🔄 Test 2: Récupération des demandes en attente...');
    const demandesEnAttente = await ConnexionService.getPendingRequestsByMedecin(testMedecin.id);
    
    if (demandesEnAttente.success) {
      console.log(`✅ ${demandesEnAttente.data.length} demande(s) en attente trouvée(s)`);
      demandesEnAttente.data.forEach((demande: any) => {
        console.log(`   - ${demande.patientNom} (${demande.patientMail}) - ${demande.dateCreation}`);
      });
    } else {
      console.log('❌ Erreur lors de la récupération:', demandesEnAttente.message);
    }

    // 7. Test 3: Accepter la demande de connexion
    console.log('\n🔄 Test 3: Acceptation de la demande...');
    const acceptationResult = await ConnexionService.acceptConnexion(connexionId, testMedecin.id);
    
    if (acceptationResult.success) {
      console.log('✅ Demande acceptée avec succès');
    } else {
      console.log('❌ Erreur lors de l\'acceptation:', acceptationResult.message);
    }

    // 8. Test 4: Vérifier que la connexion est maintenant acceptée
    console.log('\n🔄 Test 4: Vérification du statut de connexion...');
    const connexionApresAcceptation = await db
      .select()
      .from(connexions)
      .where(eq(connexions.id, connexionId))
      .limit(1);

    if (connexionApresAcceptation.length > 0) {
      const connexion = connexionApresAcceptation[0];
      console.log(`✅ Statut de connexion: ${connexion.statut}`);
      console.log(`   Date d'acceptation: ${connexion.dateAcceptation}`);
    }

    // 9. Test 5: Récupérer les patients connectés au médecin
    console.log('\n🔄 Test 5: Récupération des patients connectés...');
    const patientsConnectes = await ConnexionService.getPatientsByMedecin(testMedecin.id);
    
    if (patientsConnectes.success) {
      console.log(`✅ ${patientsConnectes.data.length} patient(s) connecté(s)`);
      patientsConnectes.data.forEach((patient: any) => {
        console.log(`   - ${patient.patientNom} (${patient.patientMail})`);
        console.log(`     Connecté le: ${patient.dateAcceptation}`);
        console.log(`     Niveau d'accès: ${patient.niveauAcces || 'Non défini'}`);
      });
    } else {
      console.log('❌ Erreur lors de la récupération:', patientsConnectes.message);
    }

    // 10. Test 6: Test de refus - Créer une nouvelle demande et la refuser
    console.log('\n🔄 Test 6: Test de refus de demande...');
    
    // Créer une nouvelle demande (simuler un autre patient ou réinitialiser)
    await db
      .update(connexions)
      .set({ statut: 'En_attente', dateAcceptation: null })
      .where(eq(connexions.id, connexionId));

    const refusResult = await ConnexionService.rejectConnexion(connexionId, testMedecin.id, 'medecin');
    
    if (refusResult.success) {
      console.log('✅ Demande refusée avec succès');
    } else {
      console.log('❌ Erreur lors du refus:', refusResult.message);
    }

    // 11. Vérifier le statut après refus
    console.log('\n🔄 Vérification du statut après refus...');
    const connexionApresRefus = await db
      .select()
      .from(connexions)
      .where(eq(connexions.id, connexionId))
      .limit(1);

    if (connexionApresRefus.length > 0) {
      console.log(`✅ Statut après refus: ${connexionApresRefus[0].statut}`);
    }

    console.log('\n🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

testConnexionMedecinPatient();