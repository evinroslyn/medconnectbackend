import { db } from "../src/infrastructure/database/db";
import { utilisateurs } from "../src/infrastructure/database/schema/utilisateurs";
import { eq } from "drizzle-orm";
import { generateToken } from "../src/infrastructure/auth/jwt";

/**
 * Script de test pour l'API de statut utilisateur
 */
async function testUserStatusAPI() {
  console.log("🧪 Test de l'API de statut utilisateur");
  console.log("=" .repeat(50));

  try {
    // 1. Récupérer un médecin pour les tests
    const medecin = await db
      .select()
      .from(utilisateurs)
      .where(eq(utilisateurs.typeUtilisateur, "medecin"))
      .limit(1);

    if (medecin.length === 0) {
      console.log("❌ Aucun médecin trouvé pour les tests");
      return;
    }

    const testMedecin = medecin[0];
    console.log(`\n1. Médecin de test: ${testMedecin.mail}`);

    // 2. Générer un token valide
    const token = generateToken({
      userId: testMedecin.id,
      typeUtilisateur: testMedecin.typeUtilisateur,
    });

    console.log("✅ Token généré");

    // 3. Récupérer un patient pour tester le statut
    const patient = await db
      .select()
      .from(utilisateurs)
      .where(eq(utilisateurs.typeUtilisateur, "patient"))
      .limit(1);

    if (patient.length === 0) {
      console.log("❌ Aucun patient trouvé pour les tests");
      return;
    }

    const testPatient = patient[0];
    console.log(`\n2. Patient de test: ${testPatient.mail}`);
    console.log(`   ID: ${testPatient.id}`);
    console.log(`   Dernière connexion: ${testPatient.derniereConnexion || 'Jamais'}`);

    // 4. Tester l'endpoint de statut utilisateur
    console.log("\n3. Test de l'endpoint GET /api/user-status/:userId");
    
    const apiUrl = `http://localhost:3000/api/user-status/${testPatient.id}`;
    console.log(`URL: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Réponse API:");
        console.log(JSON.stringify(data, null, 2));
      } else {
        const errorData = await response.text();
        console.log(`❌ Erreur API (${response.status}):`, errorData);
      }
    } catch (error) {
      console.log("❌ Erreur de connexion à l'API:", error);
      console.log("💡 Assurez-vous que le serveur backend est démarré (npm run dev)");
    }

    // 5. Tester l'endpoint de statuts multiples
    console.log("\n4. Test de l'endpoint POST /api/user-status/multiple");
    
    const multipleApiUrl = `http://localhost:3000/api/user-status/multiple`;
    console.log(`URL: ${multipleApiUrl}`);

    try {
      const response = await fetch(multipleApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [testPatient.id]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Réponse API (multiple):");
        console.log(JSON.stringify(data, null, 2));
      } else {
        const errorData = await response.text();
        console.log(`❌ Erreur API (${response.status}):`, errorData);
      }
    } catch (error) {
      console.log("❌ Erreur de connexion à l'API:", error);
      console.log("💡 Assurez-vous que le serveur backend est démarré (npm run dev)");
    }

    console.log("\n✅ Test terminé");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

// Exécuter le test
testUserStatusAPI().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});