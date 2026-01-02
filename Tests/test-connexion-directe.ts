import { ConnexionService } from '../src/application/services/ConnexionService';
import { db } from '../src/infrastructure/database/db';
import { connexions } from '../src/infrastructure/database/schema/connexions';

/**
 * Script de test pour vérifier les connexions patient-médecin
 * et tester la logique de connexion directe
 */
async function testConnexionDirecte() {
  console.log('🔍 Test de la logique de connexion directe...\n');

  try {
    // 1. Lister toutes les connexions acceptées
    console.log('📋 Connexions acceptées dans le système:');
    
    // Récupérer toutes les connexions directement de la base
    const allConnexions = await db.select().from(connexions);
    
    if (allConnexions.length === 0) {
      console.log('❌ Aucune connexion trouvée dans le système');
      console.log('💡 Créez des connexions de test avec accept-connexion.ts\n');
      return;
    }

    const acceptedConnexions = allConnexions.filter(c => c.statut === 'Accepté');
    
    if (acceptedConnexions.length === 0) {
      console.log('❌ Aucune connexion acceptée trouvée');
      console.log(`📊 Connexions totales: ${allConnexions.length}`);
      allConnexions.forEach((conn, index) => {
        console.log(`${index + 1}. Patient ${conn.idPatient} ↔ Médecin ${conn.idMedecin} - ${conn.statut}`);
      });
      console.log('💡 Acceptez des connexions avec accept-connexion.ts\n');
    } else {
      acceptedConnexions.forEach((connexion, index) => {
        console.log(`${index + 1}. Patient ${connexion.idPatient} ↔ Médecin ${connexion.idMedecin}`);
        console.log(`   Statut: ${connexion.statut}`);
        console.log(`   Date acceptation: ${connexion.dateAcceptation || 'N/A'}`);
        console.log(`   Niveau d'accès: ${connexion.niveauAcces || 'N/A'}\n`);
      });
    }

    // 2. Tester la logique pour un patient spécifique
    if (acceptedConnexions.length > 0) {
      const testConnexion = acceptedConnexions[0];
      console.log(`🧪 Test avec Patient ${testConnexion.idPatient}:`);
      
      // Récupérer toutes les connexions de ce patient
      const patientConnexions = await ConnexionService.getConnexionsByPatient(testConnexion.idPatient);
      
      if (patientConnexions.success && patientConnexions.data) {
        console.log(`✅ Patient a ${patientConnexions.data.length} connexion(s):`);
        
        patientConnexions.data.forEach((conn: any) => {
          const status = conn.statut === 'Accepté' ? '🟢' : 
                        conn.statut === 'En_attente' ? '🟡' : '🔴';
          console.log(`   ${status} Médecin ${conn.idMedecin} (${conn.medecinNom}) - ${conn.statut}`);
        });

        // Simuler la logique mobile
        const activeConnexions = patientConnexions.data.filter((c: any) => c.statut === 'Accepté');
        console.log(`\n📱 Logique Mobile:`);
        console.log(`   - Connexions actives: ${activeConnexions.length}`);
        
        if (activeConnexions.length > 0) {
          console.log(`   - Le patient peut accéder directement au chat avec:`);
          activeConnexions.forEach((conn: any) => {
            console.log(`     • Dr. ${conn.medecinNom} (ID: ${conn.idMedecin}, Connexion: ${conn.id})`);
          });
        }

        // Test de la fonction areConnected
        console.log(`\n🔗 Test de vérification de connexion:`);
        for (const conn of activeConnexions) {
          const isConnected = await ConnexionService.areConnected(testConnexion.idPatient, conn.idMedecin);
          console.log(`   - Patient ${testConnexion.idPatient} ↔ Médecin ${conn.idMedecin}: ${isConnected ? '✅ Connecté' : '❌ Non connecté'}`);
        }
      } else {
        console.log('❌ Erreur lors de la récupération des connexions du patient:', patientConnexions.error);
      }
    }

    // 3. Statistiques générales
    console.log('\n📊 Statistiques des connexions:');
    const stats = {
      total: allConnexions.length,
      acceptees: allConnexions.filter(c => c.statut === 'Accepté').length,
      enAttente: allConnexions.filter(c => c.statut === 'En_attente').length,
      revoquees: allConnexions.filter(c => c.statut === 'Revoqué').length
    };

    console.log(`   Total: ${stats.total}`);
    console.log(`   Acceptées: ${stats.acceptees} (${stats.total > 0 ? ((stats.acceptees/stats.total)*100).toFixed(1) : 0}%)`);
    console.log(`   En attente: ${stats.enAttente} (${stats.total > 0 ? ((stats.enAttente/stats.total)*100).toFixed(1) : 0}%)`);
    console.log(`   Révoquées: ${stats.revoquees} (${stats.total > 0 ? ((stats.revoquees/stats.total)*100).toFixed(1) : 0}%)`);

    // 4. Recommandations pour les tests mobile
    console.log('\n💡 Recommandations pour tester l\'app mobile:');
    if (acceptedConnexions.length > 0) {
      console.log('   ✅ Vous avez des connexions acceptées pour tester la navigation directe');
      console.log('   📱 Dans l\'app mobile, connectez-vous avec un patient qui a des connexions actives');
      console.log('   🎯 Les médecins connectés devraient afficher un badge "Connecté" et un bouton "Chat"');
    } else {
      console.log('   ⚠️  Aucune connexion acceptée - créez-en avec accept-connexion.ts');
      console.log('   📝 Ou utilisez les scripts create-test-patient.ts et create-test-medecin.ts');
    }

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }

  console.log('\n✅ Test terminé');
  process.exit(0);
}

// Exécuter le test
testConnexionDirecte().catch(console.error);