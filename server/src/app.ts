import express from 'express';
import cors from 'cors';
import { productsRouter } from './modules/products/products.router.js';
import { customersRouter } from './modules/customers/customers.router.js';
import { salesRouter } from './modules/sales/sales.router.js';
import { invoicesRouter } from './modules/invoices/invoices.router.js';
import { expensesRouter } from './modules/expenses/expenses.router.js';
import { reportsRouter } from './modules/reports/reports.router.js';
import { dashboardRouter } from './modules/dashboard/dashboard.router.js';
import { settingsRouter } from './modules/settings/settings.router.js';
import { demoRouter } from './modules/demo/demo.router.js';
import { errorHandler, NotFoundError } from './shared/errors.js';
import { getDb } from './db/connection.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

let dbInitialized = false;

export function ensureDatabase(): void {
  if (dbInitialized) return;
  try {
    const db = getDb();
    initializeSchema(db);
    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM products`).get() as any;
    if (!countRow || Number(countRow.cnt) === 0) {
      console.log('[BusinessFlow API] Initializing demo seed data...');
      seedDatabase(db);
    }
  } catch (err) {
    console.warn('[BusinessFlow API] Notice during database initialization:', err);
    try {
      const db = getDb();
      seedDatabase(db);
    } catch (seedErr) {
      console.error('[BusinessFlow API] Database initialization error:', seedErr);
    }
  }
  dbInitialized = true;
}

export function createApp(): express.Application {
  ensureDatabase();
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Router containing all application endpoints
  const apiRouter = express.Router();

  // Root & Health check endpoints
  apiRouter.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'businessflow-api',
      message: 'BusinessFlow API is running',
      version: '1.0.0',
    });
  });

  apiRouter.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'businessflow-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules on apiRouter
  apiRouter.use('/products', productsRouter);
  apiRouter.use('/customers', customersRouter);
  apiRouter.use('/sales', salesRouter);
  apiRouter.use('/sales', invoicesRouter);
  apiRouter.use('/invoices', invoicesRouter);
  apiRouter.use('/expenses', expensesRouter);
  apiRouter.use('/reports', reportsRouter);
  apiRouter.use('/dashboard', dashboardRouter);
  apiRouter.use('/settings', settingsRouter);
  apiRouter.use('/demo', demoRouter);

  // Mount at both /api and / to handle standard paths and path rewrites seamlessly
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // Catch-all 404 handler
  app.use((req, _res, next) => {
    next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized error handling
  app.use(errorHandler);

  return app;
}
