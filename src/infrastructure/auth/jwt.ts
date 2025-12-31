import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Interface pour le payload JWT
 */
export interface JWTPayload {
  userId: string;
  telephone: string;
  typeUtilisateur: "patient" | "medecin" | "administrateur";
  iat?: number;
  exp?: number;
}

/**
 * Génère un token JWT pour un utilisateur authentifié
 * @param payload - Données à inclure dans le token
 * @returns Token JWT signé
 */
export function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET n'est pas défini dans les variables d'environnement");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: "med-connect",
    audience: "med-connect-api",
  });
}

/**
 * Vérifie et décode un token JWT
 * @param token - Token JWT à vérifier
 * @returns Payload décodé du token
 * @throws Error si le token est invalide ou expiré
 */
export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET n'est pas défini dans les variables d'environnement");
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: "med-connect",
      audience: "med-connect-api",
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expiré");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Token invalide");
    }
    throw error;
  }
}

/**
 * Extrait le token du header Authorization
 * @param authHeader - Header Authorization (format: "Bearer <token>")
 * @returns Token extrait ou null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

