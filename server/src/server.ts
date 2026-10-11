import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { getDb } from './db/connection.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

const PORT = Number(process.env.PORT) || 4000;

function bootstrap() {
  const db = getDb();
  initializeSchema(db);

  // If products table is empty, auto-seed with initial records
  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM products`).get() as any;
  if (Number(countRow.cnt) === 0) {
    console.log('[Bootstrap] Initializing demo seed data...');
    seedDatabase(db);
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[BusinessFlow API] Server listening on http://localhost:${PORT}`);
    console.log(`[BusinessFlow API] Health check at http://localhost:${PORT}/api/health`);
  });

  const shutdown = () => {
    console.log('\n[BusinessFlow API] Shutting down gracefully...');
    server.close(() => {
      console.log('[BusinessFlow API] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
