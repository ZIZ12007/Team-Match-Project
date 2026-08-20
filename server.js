import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.js';
import { verifyConnection, executeReadQuery } from './server/db.js';
import { seedDatabase } from './server/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Serve static assets in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Auto-bootstrap and verify DB on startup
async function initServer() {
  console.log('🚀 Starting Startup Team-Matching Graph Server (JavaScript + Node.js)...');
  const health = await verifyConnection();
  if (health.ok) {
    console.log('✅ Connected to CognoDB successfully.');
    // Check if database needs initial seeding
    try {
      const counts = await executeReadQuery('MATCH (p:Person) RETURN count(p) as cnt');
      const count = Number(counts[0]?.cnt || 0);
      if (count === 0) {
        console.log('⚡ Empty graph database detected. Running initial seed...');
        await seedDatabase();
      } else {
        console.log(`📊 Found ${count} Person nodes in CognoDB.`);
      }
    } catch (e) {
      console.warn('Initial count check warning:', e.message);
    }
  } else {
    console.warn('⚠️ CognoDB connection warning on startup:', health.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV === 'production' || !process.env.VITE_DEV) {
  initServer();
}

export { app };
