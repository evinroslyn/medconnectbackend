import { AuthService } from '../src/application/services/AuthService.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function createTestMedecin() {
  try {
    console.log('👨‍⚕️ Création d\'un médecin de test...\n');
    
    const testMedecinData = {
      nom: 'Dr. Test Médecin',
      mail: 'test.medecin@example.com',
      telephone: '612345678',
      typeUtilisateur: 'medecin' as const,
      specialite: 'Médecine Générale',
      numeroLicence: 'TEST-12345',
      documentIdentite: '/uploads/test-cni.pdf',
      diplome: '/uploads/test-diplome.pdf',
      photoProfil: '/uploads/test-photo.jpg',
      adresse: '123 Rue de Test, Yaoundé'
    };

    console.log('📝 Données du médecin de test:');
    console.log(`   Nom: ${testMedecinData.nom}`);
    console.log(`   Email: ${testMedecinData.mail}`);
    console.log(`   Téléphone: ${testMedecinData.telephone}`);
    console.log(`   Spécialité: ${testMedecinData.specialite}`);
    console.log(`   Numéro de licence: ${testMedecinData.numeroLicence}\n`);

    const result = await AuthService.register(testMedecinData);

    if (result.success) {
      console.log('✅ Médecin de test créé avec succès !');
      console.log(`🆔 ID: ${result.user?.id}`);
      console.log('📋 Statut: en_attente (doit être validé par un admin)');
      console.log('\n💡 Pour valider ce médecin:');
      console.log('   1. Connectez-vous en tant qu\'admin');
      console.log('   2. Allez dans la section "Vérification des médecins"');
      console.log('   3. Validez le médecin');
      console.log('   4. Le mot de passe sera affiché dans la console');
    } else {
      console.error('❌ Erreur lors de la création:', result.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createTestMedecin();