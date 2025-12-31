import { Request, Response, NextFunction } from "express";
import { verifyToken, extractTokenFromHeader, JWTPayload } from "./jwt";

/**
 * Interface pour étendre Request avec les informations utilisateur
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT dans les headers
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:19',message:'authenticateToken middleware called',data:{path:req.path,method:req.method,hasAuthHeader:!!req.headers.authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:28',message:'No token found, returning 401',data:{path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      res.status(401).json({
        error: "Non autorisé",
        message: "Token d'authentification manquant",
      });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:37',message:'Token verified, calling next',data:{path:req.path,userId:payload.userId,userType:payload.typeUtilisateur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    next();
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:39',message:'Token verification failed, returning 401',data:{path:req.path,error:error instanceof Error ? error.message : 'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    res.status(401).json({
      error: "Non autorisé",
      message: error instanceof Error ? error.message : "Token invalide",
    });
  }
}

/**
 * Middleware pour vérifier le type d'utilisateur
 * @param allowedTypes - Types d'utilisateurs autorisés
 */
export function requireUserType(
  ...allowedTypes: Array<"patient" | "medecin" | "administrateur">
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Non autorisé",
        message: "Authentification requise",
      });
      return;
    }

    if (!allowedTypes.includes(req.user.typeUtilisateur)) {
      res.status(403).json({
        error: "Accès interdit",
        message: "Vous n'avez pas les permissions nécessaires",
      });
      return;
    }

    next();
  };
}

/**
 * Middleware pour vérifier que l'utilisateur est un patient
 */
export const requirePatient = requireUserType("patient");

/**
 * Middleware pour vérifier que l'utilisateur est un médecin
 */
export const requireMedecin = requireUserType("medecin");

/**
 * Middleware pour vérifier que l'utilisateur est un administrateur
 */
export const requireAdmin = requireUserType("administrateur");

/**
 * Middleware optionnel d'authentification
 * N'interrompt pas la requête si le token est absent, mais l'ajoute s'il est présent
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token invalide, mais on continue sans authentification
    }
  }

  next();
}

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres données
 */
export function requireOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Non authentifié",
      message: "Authentification requise",
    });
    return;
  }

  const resourceUserId = req.params.userId || req.params.id;
  
  if (req.user.userId !== resourceUserId && req.user.typeUtilisateur !== "administrateur") {
    res.status(403).json({
      success: false,
      error: "Accès refusé",
      message: "Vous ne pouvez accéder qu'à vos propres données",
    });
    return;
  }

  next();
}