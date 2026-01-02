import * as dotenv from 'dotenv';

dotenv.config();

async function testCORS() {
  try {
    console.log('🌐 Test CORS depuis le frontend...');
    
    // Simuler une requête depuis le frontend
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4201'
      },
      body: JSON.stringify({
        mail: 'vaneck.dongmo@saintjeaningenieur.org',
        motDePasse: '*Eb7%RpwGNGh'
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);

  } catch (error) {
    console.error('💥 Erreur CORS:', error);
  }
}

testCORS();