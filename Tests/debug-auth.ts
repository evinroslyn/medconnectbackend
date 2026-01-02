import { db } from '../src/infrastructure/database/db.js';
import { utilisateurs, administrateurs } from '../src/infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import { comparePassword } from '../src/infrastructure/auth/hash.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function debugAuth() {
  try {
    console.log('🔍 Debug authentification...');
    
    const email = 'vaneck.dongmo@saintjeaningenieur.org';
    const password = '*Eb7%RpwGNGh';
    
    console.log('📧 Email testé:', email);
    console.log('🔑 Mot de passe testé:', password);
    
    // 1. Vérifier si l'utilisateur existe
    const utilisateur = await db
      .select()
      .from(utilisateurs)
      .where(eq(utilisateurs.mail, email))
      .limit(1);
    
    console.log('👤 Utilisateur trouvé:', utilisateur.length > 0);
    if (utilisateur.length > 0) {
      console.log('   ID:', utilisateur[0].id);
      console.log('   Email:', utilisateur[0].mail);
      console.log('   Téléphone:', utilisateur[0].telephone);
      console.log('   Hash mot de passe:', utilisateur[0].motDePasse?.substring(0, 20) + '...');
    }
    
    // 2. Vérifier le mot de passe
    if (utilisateur.length > 0) {
      const isPasswordValid = await comparePassword(password, utilisateur[0].motDePasse);
      console.log('🔐 Mot de passe valide:', isPasswordValid);
    }
    
    // 3. Vérifier si c'est un admin
    if (utilisateur.length > 0) {
      const admin = await db
        .select()
        .from(administrateurs)
        .where(eq(administrateurs.id, utilisateur[0].id))
        .limit(1);
      
      console.log('👑 Est administrateur:', admin.length > 0);
      if (admin.length > 0) {
        console.log('   Nom admin:', admin[0].nom);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur debug:', error);
  }
}

debugAuth();