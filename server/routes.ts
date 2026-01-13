import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerChatRoutes } from "./replit_integrations/chat";

import authRoutes from './routes/auth';
import investmentsRoutes from './routes/investments';
import portfolioRoutes from './routes/portfolio';
import articlesRoutes from './routes/articles';
import usersRoutes from './routes/users';
import aiRoutes from './routes/ai';
import postsRoutes from './routes/posts';
import roomsRoutes from './routes/rooms';
import dealsRoutes from './routes/deals';
import notificationsRoutes from './routes/notifications';
import messagesRoutes from './routes/messages';

export async function registerRoutes(app: Express): Promise<Server> {
  registerChatRoutes(app);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/investments', investmentsRoutes);
  app.use('/api/portfolio', portfolioRoutes);
  app.use('/api/articles', articlesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/rooms', roomsRoutes);
  app.use('/api/deals', dealsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/messages', messagesRoutes);
  
  // Feed aliases - redirect to postsRoutes feed endpoints
  app.get('/api/feed', (req, res, next) => {
    req.url = '/feed';
    postsRoutes(req, res, next);
  });
  app.get('/api/feed/trending', (req, res, next) => {
    req.url = '/feed/trending';
    postsRoutes(req, res, next);
  });

  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
