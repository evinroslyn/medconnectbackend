import { UserStatusService } from '../src/application/services/UserStatusService';

/**
 * Script de test pour le système de statut utilisateur
 */
async function testUserStatus() {
  console.log('🔍 Test du système de statut utilisateur...\n');

  try {
    // Test avec des IDs d'utilisateurs existants (patients de nos tests précédents)
    const testUserIds = [
      '980b01b3-2c5d-4bab-b6cf-7c147033322f', // Patient 1
      '5ca311be-6567-4008-9cb7-9f8317c5e997', // Patient 2
    ];

    console.log('📊 Test de récupération de statuts multiples:');
    const statuses = await UserStatusService.getMultipleUserStatus(testUserIds);
    
    statuses.forEach((status, index) => {
      console.log(`${index + 1}. Utilisateur ${status.userId}:`);
      console.log(`   Statut: ${status.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}`);
      console.log(`   Dernière connexion: ${status.lastSeen}`);
      console.log('');
    });

    // Test de statut individuel
    if (testUserIds.length > 0) {
      console.log('🔍 Test de statut individuel:');
      const individualStatus = await UserStatusService.getUserStatus(testUserIds[0]);
      
      if (individualStatus) {
        console.log(`✅ Utilisateur ${individualStatus.userId}:`);
        console.log(`   Statut: ${individualStatus.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}`);
        console.log(`   Dernière connexion: ${individualStatus.lastSeen}`);
      } else {
        console.log('❌ Utilisateur non trouvé');
      }
    }

    // Test de mise à jour de statut
    console.log('\n🔄 Test de mise à jour de statut:');
    const updateResult = await UserStatusService.updateLastSeen(testUserIds[0]);
    
    if (updateResult.success) {
      console.log('✅ Statut mis à jour avec succès');
      
      // Vérifier la mise à jour
      const updatedStatus = await UserStatusService.getUserStatus(testUserIds[0]);
      if (updatedStatus) {
        console.log(`   Nouveau statut: ${updatedStatus.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}`);
        console.log(`   Nouvelle dernière connexion: ${updatedStatus.lastSeen}`);
      }
    } else {
      console.log('❌ Erreur lors de la mise à jour:', updateResult.error);
    }

    console.log('\n💡 Informations système:');
    console.log('   - Un utilisateur est considéré "en ligne" s\'il s\'est connecté dans les 5 dernières minutes');
    console.log('   - Le heartbeat doit être envoyé toutes les 30 secondes pour maintenir le statut');
    console.log('   - Les statuts sont mis à jour automatiquement côté frontend');

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }

  console.log('\n✅ Test terminé');
  process.exit(0);
}

// Exécuter le test
testUserStatus().catch(console.error);