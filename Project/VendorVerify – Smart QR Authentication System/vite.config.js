import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle /api/ routes locally since Vite doesn't by default
const apiPlugin = () => ({
  name: 'api-handler',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        try {
          // Remove query params and .js if present, then append .js
          const urlBase = req.url.split('?')[0];
          const apiPath = urlBase.replace(/^\/api\//, '');

          // Try to find the file
          let filePath = path.resolve(process.cwd(), 'api', apiPath + '.js');

          // Handle directory-style routes (e.g., /api/vendor/qr/create -> api/vendor/qr/create.js)
          if (!fs.existsSync(filePath)) {
            // Check if it's already a full path
            if (fs.existsSync(apiPath)) {
              filePath = apiPath;
            } else {
              // Let Vite handle it (next) if nothing found
              return next();
            }
          }

          // Import the serverless function
          // We use a timestamp to avoid caching during development
          const module = await server.ssrLoadModule(filePath);

          if (module.default) {
            // Mock the Express-like req and res objects Vercel uses
            const mockRes = {
              status: (code) => {
                res.statusCode = code;
                return mockRes;
              },
              json: (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return mockRes;
              },
              send: (data) => {
                res.end(data);
                return mockRes;
              }
            };

            // Collect body data for POST requests
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  req.body = body ? JSON.parse(body) : {};
                  await module.default(req, mockRes);
                } catch (e) {
                  mockRes.status(500).json({ error: 'Handler Error', details: e.message });
                }
              });
            } else {
              await module.default(req, mockRes);
            }
            return;
          }
        } catch (error) {
          console.error('API Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'API execution failed', message: error.message }));
          return;
        }
      }
      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})
