import { ConnexionService } from '../src/application/services/ConnexionService.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testReactivation() {
  try {
    console.log('🔄 Test de réactivation d\'une connexion révoquée\n');

    // IDs des utilisateurs de test
    const patientId = '5ca311be-6567-4008-9cb7-9f8317c5e997'; // Pablo Giscar
    const medecinId = '17e811fa-02bb-40a6-b510-70d989494d7b'; // djidawo keylian

    console.log('🧪 Tentative de réactivation...');
    const result = await ConnexionService.sendConnexionRequest(patientId, medecinId);

    if (result.success) {
      console.log('✅ Réactivation réussie !');
      console.log('   Message:', result.message);
      console.log('   ID Connexion:', result.data.id);
      console.log('   Statut:', result.data.statut);
      console.log('   Date:', result.data.dateCreation);
    } else {
      console.log('❌ Erreur lors de la réactivation:', result.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testReactivation();