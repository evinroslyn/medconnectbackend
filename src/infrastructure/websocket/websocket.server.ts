import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { verifyToken, JWTPayload } from "../auth/jwt";
import { URL } from "url";

/**
 * Interface pour les connexions WebSocket avec informations utilisateur
 */
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userType?: string;
  isAlive?: boolean;
}

/**
 * Interface pour les messages WebSocket
 */
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

/**
 * Gestionnaire de serveur WebSocket
 */
export class WebSocketServerManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map(); // userId -> Set of connections

  constructor(httpServer: HttpServer) {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: "/", // Accepter les connexions sur la racine
    });

    this.setupWebSocketServer();
  }

  /**
   * Configure le serveur WebSocket
   */
  private setupWebSocketServer(): void {
    this.wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
      // Extraire le token de l'URL
      const urlString = req.url || "";
      let token: string | null = null;
      
      try {
        // Parser l'URL pour extraire le token
        const url = new URL(urlString, `http://${req.headers.host || "localhost:3000"}`);
        token = url.searchParams.get("token");
      } catch (error) {
        // Si l'URL est invalide, essayer d'extraire le token manuellement
        const match = urlString.match(/[?&]token=([^&]+)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }

      if (!token) {
        console.warn("⚠️ Connexion WebSocket rejetée: token manquant");
        ws.close(1008, "Token d'authentification manquant");
        return;
      }

      // Vérifier le token
      let payload: JWTPayload;
      try {
        payload = verifyToken(token);
      } catch (error) {
        console.warn("⚠️ Connexion WebSocket rejetée: token invalide", error);
        ws.close(1008, "Token invalide ou expiré");
        return;
      }

      // Authentification réussie
      ws.userId = payload.userId;
      ws.userType = payload.typeUtilisateur;
      ws.isAlive = true;

      // Ajouter le client à la liste des connexions
      if (!this.clients.has(payload.userId)) {
        this.clients.set(payload.userId, new Set());
      }
      this.clients.get(payload.userId)!.add(ws);

      console.log(
        `✅ WebSocket connecté: ${payload.userId} (${payload.typeUtilisateur})`
      );

      // Envoyer un message de bienvenue
      this.sendToClient(ws, {
        type: "connected",
        data: { message: "Connexion WebSocket établie" },
        timestamp: Date.now(),
      });

      // Gérer les messages entrants
      ws.on("message", (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("❌ Erreur lors du parsing du message WebSocket:", error);
          this.sendToClient(ws, {
            type: "error",
            data: { error: "Format de message invalide" },
            timestamp: Date.now(),
          });
        }
      });

      // Gérer les pings pour maintenir la connexion active
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Gérer la fermeture de connexion
      ws.on("close", () => {
        console.log(
          `🔌 WebSocket déconnecté: ${payload.userId} (${payload.typeUtilisateur})`
        );
        if (ws.userId) {
          const userConnections = this.clients.get(ws.userId);
          if (userConnections) {
            userConnections.delete(ws);
            if (userConnections.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
        }
      });

      // Gérer les erreurs
      ws.on("error", (error) => {
        console.error("❌ Erreur WebSocket:", error);
      });
    });

    // Ping périodique pour maintenir les connexions actives
    const pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Ping toutes les 30 secondes

    // Nettoyer l'intervalle lors de la fermeture du serveur
    this.wss.on("close", () => {
      clearInterval(pingInterval);
    });

    console.log("🔌 Serveur WebSocket initialisé");
  }

  /**
   * Gère les messages entrants
   */
  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    console.log(`📨 Message WebSocket reçu de ${ws.userId}:`, message);

    // Gérer les différents types de messages
    switch (message.type) {
      case "heartbeat":
      case "connexion":
        // Répondre aux heartbeats
        this.sendToClient(ws, {
          type: "connexion",
          data: { type: "heartbeat-ack" },
          timestamp: Date.now(),
        });
        break;

      default:
        // Pour les autres types de messages, on peut les traiter ici ou les diffuser
        console.log(`📤 Message de type '${message.type}' reçu`);
        break;
    }
  }

  /**
   * Envoie un message à un client spécifique
   */
  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Envoie un message à un utilisateur spécifique (toutes ses connexions)
   */
  public sendToUser(userId: string, message: WebSocketMessage): void {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.forEach((ws) => {
        this.sendToClient(ws, message);
      });
    }
  }

  /**
   * Envoie un message à tous les utilisateurs d'un type spécifique
   */
  public sendToUserType(
    userType: "patient" | "medecin" | "administrateur",
    message: WebSocketMessage
  ): void {
    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.userType === userType && ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, message);
      }
    });
  }

  /**
   * Diffuse un message à tous les clients connectés
   */
  public broadcast(message: WebSocketMessage): void {
    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, message);
      }
    });
  }

  /**
   * Ferme le serveur WebSocket
   */
  public close(): void {
    this.wss.close();
  }

  /**
   * Obtient le nombre de clients connectés
   */
  public getClientCount(): number {
    return this.wss.clients.size;
  }

  /**
   * Obtient le nombre de connexions pour un utilisateur spécifique
   */
  public getUserConnectionCount(userId: string): number {
    return this.clients.get(userId)?.size || 0;
  }
}

