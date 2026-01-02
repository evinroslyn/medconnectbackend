import { AuthService } from '../src/application/services/AuthService.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function createTestPatient() {
  try {
    console.log('👥 Création d\'un patient de test...\n');
    
    const testPatientData = {
      nom: 'Patient Test',
      mail: 'patient.test@example.com',
      telephone: '612345679',
      motDePasse: 'TestPassword123!',
      typeUtilisateur: 'patient' as const,
      dateNaissance: '1990-01-01',
      genre: 'Homme' as const,
      adresse: '456 Rue du Patient, Douala'
    };

    console.log('📝 Données du patient de test:');
    console.log(`   Nom: ${testPatientData.nom}`);
    console.log(`   Email: ${testPatientData.mail}`);
    console.log(`   Téléphone: ${testPatientData.telephone}`);
    console.log(`   Date de naissance: ${testPatientData.dateNaissance}`);
    console.log(`   Genre: ${testPatientData.genre}`);
    console.log(`   Mot de passe: ${testPatientData.motDePasse}\n`);

    const result = await AuthService.register(testPatientData);

    if (result.success) {
      console.log('✅ Patient de test créé avec succès !');
      console.log(`🆔 ID: ${result.user?.id}`);
      console.log(`🔑 Token: ${result.token ? result.token.substring(0, 30) + '...' : 'N/A'}`);
      console.log('\n💡 Vous pouvez maintenant utiliser ce patient pour tester les connexions');
      console.log('   Email/Téléphone:', testPatientData.mail, 'ou', testPatientData.telephone);
      console.log('   Mot de passe:', testPatientData.motDePasse);
    } else {
      console.error('❌ Erreur lors de la création:', result.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createTestPatient();