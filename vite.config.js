import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import { defineConfig } from 'vite';
import { apiRouter } from './server/routes.js';
import { verifyConnection, executeReadQuery } from './server/db.js';
import { seedDatabase } from './server/seed.js';

function expressPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(express.json());
      app.use('/api', apiRouter);

      server.middlewares.use(app);

      // Auto-check DB connection on dev startup and seed if empty
      (async () => {
        try {
          const health = await verifyConnection();
          if (health.ok) {
            console.log('✅ Connected to CognoDB successfully.');
            const counts = await executeReadQuery('MATCH (p:Person) RETURN count(p) as cnt');
            const count = Number(counts[0]?.cnt || 0);
            if (count === 0) {
              console.log('🌱 Graph database is empty. Seeding initial data...');
              await seedDatabase();
            } else {
              console.log(`📊 CognoDB is ready with ${count} people nodes.`);
            }
          }
        } catch (e) {
          console.warn('Initial CognoDB connection test:', e.message);
        }
      })();
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
