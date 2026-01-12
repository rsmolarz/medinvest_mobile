import type { Express } from 'express';
import { createServer, type Server } from 'node:http';

import authRoutes from './auth';
import investmentsRoutes from './investments';
import portfolioRoutes from './portfolio';
import articlesRoutes from './articles';
import usersRoutes from './users';
import messagesRoutes from './messages';

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

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
