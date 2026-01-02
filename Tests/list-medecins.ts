import { db } from '../src/infrastructure/database/db.js';
import { medecins, utilisateurs } from '../src/infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function listMedecins() {
  try {
    console.log('👨‍⚕️ Liste de tous les médecins...\n');
    
    const allMedecins = await db
      .select({
        id: medecins.id,
        nom: medecins.nom,
        email: utilisateurs.mail,
        telephone: utilisateurs.telephone,
        specialite: medecins.specialite,
        numeroLicence: medecins.numeroLicence,
        statutVerification: medecins.statutVerification,
        dateCreation: utilisateurs.dateCreation,
        dateValidation: medecins.dateValidation,
      })
      .from(medecins)
      .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id));

    if (allMedecins.length === 0) {
      console.log('❌ Aucun médecin trouvé dans la base de données');
      return;
    }

    console.log(`📊 Total: ${allMedecins.length} médecin(s) trouvé(s)\n`);

    // Grouper par statut
    const enAttente = allMedecins.filter(m => m.statutVerification === 'en_attente');
    const valides = allMedecins.filter(m => m.statutVerification === 'valide');
    const rejetes = allMedecins.filter(m => m.statutVerification === 'rejete');

    console.log('📈 STATISTIQUES:');
    console.log(`  🟡 En attente: ${enAttente.length}`);
    console.log(`  🟢 Validés: ${valides.length}`);
    console.log(`  🔴 Rejetés: ${rejetes.length}\n`);

    // Afficher tous les médecins
    allMedecins.forEach((medecin, index) => {
      const statusIcon = medecin.statutVerification === 'valide' ? '🟢' : 
                        medecin.statutVerification === 'rejete' ? '🔴' : '🟡';
      
      console.log(`${index + 1}. ${statusIcon} ${medecin.nom}`);
      console.log(`   📧 Email: ${medecin.email}`);
      console.log(`   📱 Téléphone: ${medecin.telephone}`);
      console.log(`   🏥 Spécialité: ${medecin.specialite}`);
      console.log(`   🆔 ID: ${medecin.id}`);
      console.log(`   📋 Statut: ${medecin.statutVerification}`);
      console.log(`   📅 Créé le: ${medecin.dateCreation?.toLocaleDateString('fr-FR')}`);
      if (medecin.dateValidation) {
        console.log(`   ✅ Validé le: ${medecin.dateValidation.toLocaleDateString('fr-FR')}`);
      }
      console.log('');
    });

    console.log('💡 Pour régénérer le mot de passe d\'un médecin:');
    console.log('   npx tsx reset-medecin-password.ts --email=email@example.com');
    console.log('   npx tsx reset-medecin-password.ts --id=uuid-du-medecin');

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des médecins:', error);
  }
}

listMedecins();