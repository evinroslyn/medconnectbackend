import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

/**
 * Clé de chiffrement pour les messages
 * En production, cette clé devrait être stockée dans une variable d'environnement
 */
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || "medconnect-secret-key-32-chars!!";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes pour AES
const SALT_LENGTH = 64; // 64 bytes pour le salt
const TAG_LENGTH = 16; // 16 bytes pour l'authentication tag

/**
 * Génère une clé de chiffrement à partir d'un mot de passe
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  const scryptAsync = promisify(scrypt);
  return (await scryptAsync(password, salt, 32)) as Buffer;
}

/**
 * Chiffre un message
 * @param text - Texte en clair à chiffrer
 * @returns Message chiffré au format base64 (iv:salt:tag:encrypted)
 */
export async function encryptMessage(text: string): Promise<string> {
  try {
    // Générer un IV (Initialization Vector) aléatoire
    const iv = randomBytes(IV_LENGTH);
    
    // Générer un salt aléatoire
    const salt = randomBytes(SALT_LENGTH);
    
    // Dériver la clé à partir du mot de passe et du salt
    const key = await deriveKey(ENCRYPTION_KEY, salt);
    
    // Créer le cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    // Chiffrer le texte
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Récupérer l'authentication tag
    const tag = cipher.getAuthTag();
    
    // Combiner IV, salt, tag et texte chiffré
    const combined = Buffer.concat([
      iv,
      salt,
      tag,
      Buffer.from(encrypted, "hex")
    ]);
    
    // Retourner en base64 pour faciliter le stockage
    return combined.toString("base64");
  } catch (error) {
    console.error("Erreur lors du chiffrement:", error);
    throw new Error("Impossible de chiffrer le message");
  }
}

/**
 * Déchiffre un message
 * @param encryptedText - Message chiffré au format base64 (iv:salt:tag:encrypted) ou texte en clair (pour compatibilité)
 * @returns Texte en clair
 */
export async function decryptMessage(encryptedText: string): Promise<string> {
  try {
    // Vérifier si le texte est déjà en clair (pour compatibilité avec les anciens messages)
    // Si le texte ne commence pas par un caractère base64 valide ou est trop court, c'est probablement du texte en clair
    if (!encryptedText || encryptedText.length < 50) {
      // Probablement un ancien message non chiffré
      return encryptedText;
    }

    // Essayer de décoder depuis base64
    let combined: Buffer;
    try {
      combined = Buffer.from(encryptedText, "base64");
    } catch (error) {
      // Si ce n'est pas du base64 valide, c'est probablement du texte en clair
      return encryptedText;
    }

    // Vérifier que la taille est suffisante pour contenir IV + salt + tag
    if (combined.length < IV_LENGTH + SALT_LENGTH + TAG_LENGTH) {
      // Probablement un ancien message non chiffré
      return encryptedText;
    }
    
    // Extraire les composants
    const iv = combined.subarray(0, IV_LENGTH);
    const salt = combined.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
    const tag = combined.subarray(IV_LENGTH + SALT_LENGTH, IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
    
    // Dériver la clé à partir du mot de passe et du salt
    const key = await deriveKey(ENCRYPTION_KEY, salt);
    
    // Créer le decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Déchiffrer le texte
    let decrypted = decipher.update(encrypted, null, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    // Si le déchiffrement échoue, c'est probablement un ancien message non chiffré
    console.warn("Tentative de déchiffrement échouée, retour du texte original:", error);
    return encryptedText;
  }
}
