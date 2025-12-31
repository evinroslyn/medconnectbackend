import bcrypt from "bcryptjs";

/**
 * Hash un mot de passe avec bcrypt
 * @param password - Mot de passe en clair
 * @returns Mot de passe hashé
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare un mot de passe en clair avec un hash
 * @param password - Mot de passe en clair
 * @param hash - Mot de passe hashé
 * @returns true si les mots de passe correspondent
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

