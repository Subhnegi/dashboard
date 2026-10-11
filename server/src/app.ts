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

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'businessflow-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use('/api/products', productsRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/sales', salesRouter);
  app.use('/api/sales', invoicesRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/demo', demoRouter);

  // Catch-all 404 handler
  app.use((req, _res, next) => {
    next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized error handling
  app.use(errorHandler);

  return app;
}
