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

  app.get('/api/oauth-debug', (req, res) => {
    const forwardedProto = req.header('x-forwarded-proto') || req.protocol || 'https';
    const forwardedHost = req.header('x-forwarded-host') || req.get('host');
    const currentOrigin = `${forwardedProto}://${forwardedHost}`;
    const callbackUri = `${currentOrigin}/api/auth/callback`;
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    const pubDomains = process.env.REPLIT_DOMAINS;
    const uris: string[] = [callbackUri];
    if (devDomain) uris.push(`https://${devDomain}/api/auth/callback`);
    if (pubDomains) {
      for (const d of pubDomains.split(',')) {
        const u = `https://${d.trim()}/api/auth/callback`;
        if (!uris.includes(u)) uris.push(u);
      }
    }
    for (const d of ['themedicineandmoneyshow.com', 'medinvest-mobile--rsmolarz.replit.app']) {
      const u = `https://${d}/api/auth/callback`;
      if (!uris.includes(u)) uris.push(u);
    }
    const origins = [...new Set(uris.map(u => u.replace('/api/auth/callback', '')))];
    res.send(`<!DOCTYPE html><html><head><title>OAuth Debug</title>
    <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;background:#1a1a2e;color:#e0e0e0}
    h1{color:#00a86b}h2{color:#0066cc;margin-top:20px}code{background:#2d2d44;padding:4px 8px;border-radius:4px;display:block;margin:5px 0;word-break:break-all;font-size:14px}
    .s{background:#2d2d44;padding:15px;border-radius:8px;margin:10px 0}
    .ok{color:#00a86b}.miss{color:#cc4444}</style></head>
    <body><h1>OAuth Redirect URI Setup Guide</h1>
    <div class="s"><h2>Step 1: Copy These Redirect URIs</h2>
    <p>Add ALL of these to each OAuth provider:</p>
    ${uris.map(u => `<code>${u}</code>`).join('')}</div>
    <div class="s"><h2>Step 2: Google Cloud Console</h2>
    <p><a href="https://console.cloud.google.com/apis/credentials" style="color:#00a86b">Open Google Cloud Console</a></p>
    <p><b>Authorized JavaScript Origins:</b></p>
    ${origins.map(u => `<code>${u}</code>`).join('')}
    <p><b>Authorized Redirect URIs:</b></p>
    ${uris.map(u => `<code>${u}</code>`).join('')}
    <p><b>IMPORTANT:</b> OAuth consent screen must be "External" type. If in "Testing" mode, add your Google email as a test user.</p></div>
    <div class="s"><h2>Step 3: GitHub Developer Settings</h2>
    <p><a href="https://github.com/settings/developers" style="color:#00a86b">Open GitHub Developer Settings</a></p>
    <p><b>Authorization callback URL:</b> (only supports ONE)</p>
    <code>${callbackUri}</code></div>
    <div class="s"><h2>Step 4: Facebook Developers</h2>
    <p><a href="https://developers.facebook.com" style="color:#00a86b">Open Facebook Developers</a> → Your App → Use Cases → Facebook Login → Customize → Settings</p>
    <p><b>Valid OAuth Redirect URIs:</b></p>
    ${uris.map(u => `<code>${u}</code>`).join('')}</div>
    <div class="s"><h2>Provider Credentials Status</h2>
    <p>Google: <span class="${process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'ok' : 'miss'}">${process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'Configured' : 'Missing'}</span></p>
    <p>GitHub: <span class="${process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ? 'ok' : 'miss'}">${process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ? 'Configured' : 'Missing'}</span></p>
    <p>Facebook: <span class="${process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ? 'ok' : 'miss'}">${process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ? 'Configured' : 'Missing'}</span></p></div>
    </body></html>`);
  });

  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
