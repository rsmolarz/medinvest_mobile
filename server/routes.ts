import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerChatRoutes } from "./replit_integrations/chat";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register AI chat routes
  registerChatRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
