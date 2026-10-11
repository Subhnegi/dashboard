import { Router, type Request, type Response } from 'express';
import { runTransaction } from '../../db/connection.js';
import { seedDatabase } from '../../db/seed.js';

export const demoRouter = Router();

// POST /api/demo/reset
demoRouter.post('/reset', (_req: Request, res: Response) => {
  runTransaction((txDb) => {
    seedDatabase(txDb);
  });
  res.json({
    success: true,
    message: 'Demo workspace has been reset to initial seed state.',
  });
});
