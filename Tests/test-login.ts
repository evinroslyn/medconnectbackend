import * as dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    console.log('🔐 Test de connexion API...');
    
    // Test avec l'administrateur
    const adminCredentials = {
      mail: 'vaneck.dongmo@saintjeaningenieur.org',
      motDePasse: '*Eb7%RpwGNGh'
    };

    console.log('📧 Test connexion admin:', adminCredentials.mail);
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminCredentials)
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Connexion réussie!');
      console.log('🎫 Token:', data.token ? 'Présent' : 'Absent');
      console.log('👤 Utilisateur:', data.utilisateur?.nom || 'Non défini');
    } else {
      console.log('❌ Échec de connexion');
      try {
        const errorData = JSON.parse(responseText);
        console.log('🚨 Erreur:', errorData);
      } catch {
        console.log('🚨 Erreur brute:', responseText);
      }
    }

  } catch (error) {
    console.error('💥 Erreur réseau:', error);
  }
}

testLogin();