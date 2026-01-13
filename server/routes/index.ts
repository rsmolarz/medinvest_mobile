import type { Express } from 'express';
import { createServer, type Server } from 'node:http';

import authRoutes from './auth';
import investmentsRoutes from './investments';
import portfolioRoutes from './portfolio';
import articlesRoutes from './articles';
import usersRoutes from './users';
import messagesRoutes from './messages';
import postsRoutes from './posts';
import roomsRoutes from './rooms';
import dealsRoutes from './deals';
import notificationsRoutes from './notifications';
import aiRoutes from './ai';

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/investments', investmentsRoutes);
  app.use('/api/portfolio', portfolioRoutes);
  app.use('/api/articles', articlesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/feed', postsRoutes);
  app.use('/api/rooms', roomsRoutes);
  app.use('/api/deals', dealsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/ai', aiRoutes);

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
