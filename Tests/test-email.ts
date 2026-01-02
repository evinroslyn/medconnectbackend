import { sendPasswordByEmail, generatePassword } from '../src/infrastructure/auth/email2fa.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  try {
    console.log('🧪 Test d\'envoi d\'email...');
    
    const testPassword = generatePassword(12);
    const testEmail = 'kdjidawo@gmail.com';
    const testNom = 'Dr. Test';
    
    console.log(`📧 Envoi d'un email de test à: ${testEmail}`);
    console.log(`🔑 Mot de passe de test: ${testPassword}`);
    
    await sendPasswordByEmail(testEmail, testPassword, testNom);
    
    console.log('✅ Test terminé avec succès !');
    console.log('📝 Vérifiez la console pour voir les logs d\'email');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testEmail();