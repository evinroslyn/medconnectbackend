import express, { Application, Request, Response, NextFunction } from "express";
import { createServer, Server as HttpServer } from "http";
import cors from "cors";
import path from "path";
import * as dotenv from "dotenv";
import { closeDatabase, testConnection, createTablesIfNotExists } from "./infrastructure/database/db";
import { WebSocketServerManager } from "./infrastructure/websocket/websocket.server";

// Importation des routes
import authRoutes from "./presentation/routes/auth.routes";
import adminRoutes from "./presentation/routes/admin.routes";
import filesRoutes from "./presentation/routes/files.routes";
import dossierMedicalRoutes from "./presentation/routes/dossier-medical.routes";
import documentMedicalRoutes from "./presentation/routes/document-medical.routes";
import partageMedicalRoutes from "./presentation/routes/partage-medical.routes";
import connexionRoutes from "./presentation/routes/connexion.routes";
import messageRoutes from "./presentation/routes/message.routes";
import medecinRoutes from "./presentation/routes/medecin.routes";
import patientRoutes from "./presentation/routes/patient.routes";
import rendezVousRoutes from "./presentation/routes/rendez-vous.routes";
import commentaireRoutes from "./presentation/routes/commentaire.routes";
import allergieTraitementRoutes from "./presentation/routes/allergie-traitement.routes";

dotenv.config();

/**
 * Application Express principale
 */
const app: Application = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Configuration CORS
// En développement, autoriser toutes les origines pour faciliter les tests
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(",") 
    : (process.env.NODE_ENV === "production" 
      ? ["http://localhost:4200", "http://localhost:8081"] 
      : true), // Autoriser toutes les origines en développement
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Configuration des body parsers
// express.json() et express.urlencoded() ne parseront PAS automatiquement multipart/form-data
// Multer gère le parsing des multipart/form-data
// IMPORTANT: Ces middlewares doivent être avant les routes pour parser le body
app.use(express.json({ 
  limit: "50mb"
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: "50mb"
}));

// Middleware de logging pour debug
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    const logData: Record<string, unknown> = {
      origin: req.headers.origin,
      authorization: req.headers.authorization ? "Present" : "Missing",
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    };
    
    // Pour les requêtes POST/PATCH/PUT, logger aussi le body (si JSON)
    if (["POST", "PATCH", "PUT"].includes(req.method)) {
      logData.hasBody = !!req.body;
      if (req.body) {
        logData.bodyType = typeof req.body;
        logData.bodyKeys = Object.keys(req.body as Record<string, unknown>);
        // Logger le body complet pour debug (limité à 500 caractères)
        const bodyStr = JSON.stringify(req.body);
        logData.bodyPreview = bodyStr.length > 500 ? bodyStr.substring(0, 500) + "..." : bodyStr;
      } else {
        logData.bodyPreview = "body is null/undefined";
      }
    }
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, logData);
    next();
  });
}

// Servir les fichiers statiques (uploads) avec CORS pour permettre l'accès depuis le mobile
app.use("/uploads", (req, res, next) => {
  // Définir les headers CORS pour les fichiers statiques
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
}, express.static(path.join(process.cwd(), "uploads")));

// Route de santé pour vérifier que l'API fonctionne
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "Med-Connect API est opérationnelle",
    timestamp: new Date().toISOString(),
  });
});

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/dossiers-medicaux", dossierMedicalRoutes);
// #region agent log
app.use("/api/documents-medicaux", (req, res, next) => {
  fetch('http://127.0.0.1:7242/ingest/7182a11c-95b2-469e-bf23-be365d7d7a16',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:115',message:'Route /api/documents-medicaux matched in main app',data:{path:req.path,url:req.url,method:req.method,originalUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  next();
}, documentMedicalRoutes);
// #endregion
app.use("/api/partages-medicaux", partageMedicalRoutes);
app.use("/api/connexions", connexionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/medecins", medecinRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/rendez-vous", rendezVousRoutes);
app.use("/api/commentaires", commentaireRoutes);
app.use("/api", allergieTraitementRoutes);

// Gestion des erreurs 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route non trouvée",
    message: "L'endpoint demandé n'existe pas",
  });
});

// Gestionnaire d'erreurs global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Erreur:", err);
  res.status(500).json({
    error: "Erreur interne du serveur",
    message: process.env.NODE_ENV === "development" ? err.message : "Une erreur est survenue",
  });
});

// Créer le serveur HTTP à partir de l'application Express
const httpServer: HttpServer = createServer(app);

// Initialiser le serveur WebSocket
let wsServer: WebSocketServerManager | null = null;
try {
  wsServer = new WebSocketServerManager(httpServer);
} catch (error) {
  console.error("❌ Erreur lors de l'initialisation du serveur WebSocket:", error);
}

// Démarrage du serveur
// Écouter sur 0.0.0.0 pour permettre les connexions depuis l'émulateur Android (10.0.2.2)
const HOST = process.env.HOST || "0.0.0.0";
httpServer.listen(PORT, HOST, async () => {
  console.log(`🚀 Serveur Med-Connect démarré sur ${HOST}:${PORT}`);
  console.log(`📝 Environnement: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Pour l'émulateur Android: http://10.0.2.2:${PORT}/api`);
  console.log(`🔌 WebSocket disponible sur ws://localhost:${PORT}`);
  
  // Test de la connexion MySQL et création des tables
  try {
    await testConnection();
    await createTablesIfNotExists();
  } catch (error) {
    console.error("Impossible de se connecter à MySQL. Vérifiez votre configuration.");
  }
});

// Gestion propre de l'arrêt du serveur
process.on("SIGTERM", async () => {
  console.log("Arrêt du serveur...");
  if (wsServer) {
    wsServer.close();
  }
  httpServer.close();
  await closeDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Arrêt du serveur...");
  if (wsServer) {
    wsServer.close();
  }
  httpServer.close();
  await closeDatabase();
  process.exit(0);
});

export default app;

