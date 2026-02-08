const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        const options = {
          hostname: 'localhost',
          port: 5000,
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            host: 'localhost:5000',
          },
        };

        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          console.error('[Metro Proxy] Error:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Backend unavailable' }));
        });

        req.pipe(proxyReq);
        return;
      }
      middleware(req, res, next);
    };
  },
};

module.exports = config;
