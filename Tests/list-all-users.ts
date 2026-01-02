import { db } from '../src/infrastructure/database/db.js';
import { medecins, patients, utilisateurs, administrateurs } from '../src/infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import { generatePassword } from '../src/infrastructure/auth/email2fa.js';
import { hashPassword } from '../src/infrastructure/auth/hash.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface UserInfo {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  type: 'admin' | 'medecin' | 'patient';
  statut?: string;
  newPassword?: string;
}

async function listAllUsers(generateNewPasswords: boolean = false) {
  try {
    console.log('👥 ═══════════════════════════════════════════════════════════════');
    console.log('👥 LISTE COMPLÈTE DES UTILISATEURS DU SYSTÈME');
    console.log('👥 ═══════════════════════════════════════════════════════════════');
    
    const allUsers: UserInfo[] = [];

    // 1. Récupérer tous les administrateurs
    console.log('\n🔐 ADMINISTRATEURS:');
    console.log('─'.repeat(60));
    
    const adminData = await db
      .select({
        admin: administrateurs,
        utilisateur: utilisateurs
      })
      .from(administrateurs)
      .innerJoin(utilisateurs, eq(administrateurs.id, utilisateurs.id));

    for (const admin of adminData) {
      const userInfo: UserInfo = {
        id: admin.admin.id,
        nom: admin.admin.nom,
        email: admin.utilisateur.mail,
        telephone: admin.utilisateur.telephone,
        type: 'admin'
      };

      if (generateNewPasswords) {
        const newPassword = generatePassword(12);
        const hashedPassword = await hashPassword(newPassword);
        
        await db
          .update(utilisateurs)
          .set({ motDePasse: hashedPassword })
          .where(eq(utilisateurs.id, admin.admin.id));
        
        userInfo.newPassword = newPassword;
      }

      allUsers.push(userInfo);
      
      console.log(`📧 Email: ${userInfo.email}`);
      console.log(`👤 Nom: ${userInfo.nom}`);
      console.log(`📱 Téléphone: ${userInfo.telephone}`);
      if (userInfo.newPassword) {
        console.log(`🔑 Nouveau mot de passe: ${userInfo.newPassword}`);
      }
      console.log('─'.repeat(40));
    }

    // 2. Récupérer tous les médecins
    console.log('\n👨‍⚕️ MÉDECINS:');
    console.log('─'.repeat(60));
    
    const medecinData = await db
      .select({
        medecin: medecins,
        utilisateur: utilisateurs
      })
      .from(medecins)
      .innerJoin(utilisateurs, eq(medecins.id, utilisateurs.id));

    for (const medecin of medecinData) {
      const userInfo: UserInfo = {
        id: medecin.medecin.id,
        nom: medecin.medecin.nom,
        email: medecin.utilisateur.mail,
        telephone: medecin.utilisateur.telephone,
        type: 'medecin',
        statut: medecin.medecin.statutVerification
      };

      if (generateNewPasswords) {
        const newPassword = generatePassword(12);
        const hashedPassword = await hashPassword(newPassword);
        
        await db
          .update(utilisateurs)
          .set({ motDePasse: hashedPassword })
          .where(eq(utilisateurs.id, medecin.medecin.id));
        
        userInfo.newPassword = newPassword;
      }

      allUsers.push(userInfo);
      
      console.log(`📧 Email: ${userInfo.email}`);
      console.log(`👤 Nom: ${userInfo.nom}`);
      console.log(`📱 Téléphone: ${userInfo.telephone}`);
      console.log(`✅ Statut: ${userInfo.statut}`);
      console.log(`🏥 Spécialité: ${medecin.medecin.specialite || 'Non spécifiée'}`);
      if (userInfo.newPassword) {
        console.log(`🔑 Nouveau mot de passe: ${userInfo.newPassword}`);
      }
      console.log('─'.repeat(40));
    }

    // 3. Récupérer tous les patients
    console.log('\n🏥 PATIENTS:');
    console.log('─'.repeat(60));
    
    const patientData = await db
      .select({
        patient: patients,
        utilisateur: utilisateurs
      })
      .from(patients)
      .innerJoin(utilisateurs, eq(patients.id, utilisateurs.id));

    for (const patient of patientData) {
      const userInfo: UserInfo = {
        id: patient.patient.id,
        nom: patient.patient.nom,
        email: patient.utilisateur.mail,
        telephone: patient.utilisateur.telephone,
        type: 'patient'
      };

      if (generateNewPasswords) {
        const newPassword = generatePassword(12);
        const hashedPassword = await hashPassword(newPassword);
        
        await db
          .update(utilisateurs)
          .set({ motDePasse: hashedPassword })
          .where(eq(utilisateurs.id, patient.patient.id));
        
        userInfo.newPassword = newPassword;
      }

      allUsers.push(userInfo);
      
      console.log(`📧 Email: ${userInfo.email}`);
      console.log(`👤 Nom: ${userInfo.nom}`);
      console.log(`📱 Téléphone: ${userInfo.telephone}`);
      console.log(`🎂 Date de naissance: ${patient.patient.dateNaissance || 'Non spécifiée'}`);
      if (userInfo.newPassword) {
        console.log(`🔑 Nouveau mot de passe: ${userInfo.newPassword}`);
      }
      console.log('─'.repeat(40));
    }

    // Résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log('═'.repeat(60));
    console.log(`👥 Total utilisateurs: ${allUsers.length}`);
    console.log(`🔐 Administrateurs: ${allUsers.filter(u => u.type === 'admin').length}`);
    console.log(`👨‍⚕️ Médecins: ${allUsers.filter(u => u.type === 'medecin').length}`);
    console.log(`🏥 Patients: ${allUsers.filter(u => u.type === 'patient').length}`);
    
    if (generateNewPasswords) {
      console.log('\n🔑 NOUVEAUX MOTS DE PASSE GÉNÉRÉS AVEC SUCCÈS!');
      console.log('⚠️  Sauvegardez ces informations en lieu sûr.');
    }
    
    console.log('═'.repeat(60));

    return allUsers;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
}

// Utilisation du script
const args = process.argv.slice(2);
const generatePasswords = args.includes('--generate-passwords');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log('📋 Usage:');
  console.log('  npx tsx list-all-users.ts                    # Lister tous les utilisateurs');
  console.log('  npx tsx list-all-users.ts --generate-passwords # Lister et générer de nouveaux mots de passe');
  console.log('');
  console.log('⚠️  ATTENTION: --generate-passwords va changer tous les mots de passe!');
} else {
  listAllUsers(generatePasswords);
}