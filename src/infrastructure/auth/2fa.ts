import { authenticator } from "otplib";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Génère une clé secrète pour l'authentification à deux facteurs
 * @param telephone - Numéro de téléphone de l'utilisateur
 * @returns Clé secrète 2FA
 */
export function generate2FASecret(telephone: string): string {
  return authenticator.generateSecret();
}

/**
 * Génère une URL pour configurer l'authentification 2FA avec une application d'authentification
 * @param telephone - Numéro de téléphone de l'utilisateur
 * @param secret - Clé secrète 2FA
 * @returns URL de configuration 2FA
 */
export function generate2FAUrl(telephone: string, secret: string): string {
  const issuer = process.env.TWO_FACTOR_ISSUER || "Med-Connect";
  return authenticator.keyuri(telephone, issuer, secret);
}

/**
 * Vérifie un code 2FA
 * @param token - Code 2FA à vérifier
 * @param secret - Clé secrète 2FA de l'utilisateur
 * @returns true si le code est valide
 */
export function verify2FA(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

