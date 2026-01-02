import { db } from "../src/infrastructure/database/db";
import { utilisateurs } from "../src/infrastructure/database/schema/utilisateurs";
import { eq } from "drizzle-orm";

/**
 * Script de test pour le système de statut en ligne simplifié
 */
async function testOnlineStatus() {
  console.log("🧪 Test du système de statut en ligne simplifié");
  console.log("=" .repeat(50));

  try {
    // 1. Lister quelques utilisateurs avec leur dernière connexion
    console.log("\n1. État actuel des utilisateurs:");
    const users = await db
      .select({
        id: utilisateurs.id,
        mail: utilisateurs.mail,
        typeUtilisateur: utilisateurs.typeUtilisateur,
        derniereConnexion: utilisateurs.derniereConnexion,
      })
      .from(utilisateurs)
      .limit(5);

    users.forEach(user => {
      const lastSeen = user.derniereConnexion;
      const isOnline = lastSeen ? isUserOnline(lastSeen) : false;
      const statusText = lastSeen ? formatLastSeen(lastSeen) : 'Jamais connecté';
      
      console.log(`- ${user.mail} (${user.typeUtilisateur})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Statut: ${isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}`);
      console.log(`  Détail: ${statusText}`);
      console.log(`  Dernière connexion: ${lastSeen || 'Jamais'}`);
      console.log("");
    });

    // 2. Simuler une mise à jour de dernière connexion
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n2. Simulation de connexion pour ${testUser.mail}:`);
      
      await db
        .update(utilisateurs)
        .set({
          derniereConnexion: new Date(),
        })
        .where(eq(utilisateurs.id, testUser.id));
      
      console.log("✅ Dernière connexion mise à jour");
      
      // Vérifier le nouveau statut
      const updatedUser = await db
        .select({
          id: utilisateurs.id,
          mail: utilisateurs.mail,
          derniereConnexion: utilisateurs.derniereConnexion,
        })
        .from(utilisateurs)
        .where(eq(utilisateurs.id, testUser.id))
        .limit(1);
      
      if (updatedUser.length > 0) {
        const user = updatedUser[0];
        const isOnline = user.derniereConnexion ? isUserOnline(user.derniereConnexion) : false;
        const statusText = user.derniereConnexion ? formatLastSeen(user.derniereConnexion) : 'Jamais connecté';
        
        console.log(`Nouveau statut: ${isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}`);
        console.log(`Détail: ${statusText}`);
      }
    }

    console.log("\n✅ Test terminé avec succès");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

/**
 * Détermine si un utilisateur est en ligne basé sur sa dernière connexion
 */
function isUserOnline(lastSeen: Date): boolean {
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
  return diffInMinutes <= 5; // En ligne si vu dans les 5 dernières minutes
}

/**
 * Formate le temps depuis la dernière connexion comme WhatsApp
 */
function formatLastSeen(lastSeen: Date): string {
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
  
  // En ligne si vu dans les 5 dernières minutes
  if (diffInMinutes <= 5) {
    return 'En ligne';
  }
  
  // Formatage du temps comme WhatsApp
  if (diffInMinutes < 60) {
    return `vu pour la dernière fois il y a ${Math.floor(diffInMinutes)} min`;
  }

  const diffInHours = diffInMinutes / 60;
  if (diffInHours < 24) {
    return `vu pour la dernière fois il y a ${Math.floor(diffInHours)} h`;
  }

  const diffInDays = diffInHours / 24;
  if (diffInDays < 7) {
    return `vu pour la dernière fois il y a ${Math.floor(diffInDays)} j`;
  }

  return `vu pour la dernière fois le ${lastSeen.toLocaleDateString('fr-FR')}`;
}

// Exécuter le test
testOnlineStatus().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});