import { db } from '../src/infrastructure/database/db.js';
import { medecins, utilisateurs } from '../src/infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import { generatePassword } from '../src/infrastructure/auth/email2fa.js';
import { hashPassword } from '../src/infrastructure/auth/hash.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function resetMedecinPassword(medecinEmail?: string, medecinId?: string) {
  try {
    console.log('🔄 Régénération du mot de passe pour un médecin...');
    
    let medecinData;
    
    if (medecinEmail) {
      // Rechercher par email
      medecinData = await db
        .select({
          medecin: medecins,
          utilisateur: utilisateurs
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(utilisateurs.mail, medecinEmail))
        .limit(1);
    } else if (medecinId) {
      // Rechercher par ID
      medecinData = await db
        .select({
          medecin: medecins,
          utilisateur: utilisateurs
        })
        .from(medecins)
        .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id))
        .where(eq(medecins.id, medecinId))
        .limit(1);
    } else {
      console.error('❌ Veuillez fournir soit un email soit un ID de médecin');
      return;
    }

    if (medecinData.length === 0) {
      console.error('❌ Médecin non trouvé');
      return;
    }

    const medecin = medecinData[0].medecin;
    const utilisateur = medecinData[0].utilisateur;

    // Générer un nouveau mot de passe
    const newPassword = generatePassword(12);
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await db
      .update(utilisateurs)
      .set({ motDePasse: hashedPassword })
      .where(eq(utilisateurs.id, medecin.id));

    console.log('🔐 ═══════════════════════════════════════════════════════════════');
    console.log('🔐 MOT DE PASSE RÉGÉNÉRÉ AVEC SUCCÈS');
    console.log('🔐 ═══════════════════════════════════════════════════════════════');
    console.log(`🔐 Médecin: ${medecin.nom}`);
    console.log(`🔐 Email: ${utilisateur.mail}`);
    console.log(`🔐 Téléphone: ${utilisateur.telephone}`);
    console.log(`🔐 Statut: ${medecin.statutVerification}`);
    console.log(`🔐 NOUVEAU MOT DE PASSE: ${newPassword}`);
    console.log('🔐 ═══════════════════════════════════════════════════════════════');
    console.log('✅ Vous pouvez maintenant vous connecter avec ce mot de passe');

  } catch (error) {
    console.error('❌ Erreur lors de la régénération:', error);
  }
}

// Utilisation du script
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='));
const idArg = args.find(arg => arg.startsWith('--id='));

if (emailArg) {
  const email = emailArg.split('=')[1];
  resetMedecinPassword(email);
} else if (idArg) {
  const id = idArg.split('=')[1];
  resetMedecinPassword(undefined, id);
} else {
  console.log('📋 Usage:');
  console.log('  npx tsx reset-medecin-password.ts --email=medecin@example.com');
  console.log('  npx tsx reset-medecin-password.ts --id=uuid-du-medecin');
  console.log('');
  console.log('💡 Pour lister tous les médecins, utilisez: npx tsx list-medecins.ts');
}