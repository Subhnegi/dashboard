import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../../db/connection.js';
import { NotFoundError } from '../../shared/errors.js';
import { validateBody } from '../../shared/validation.js';

export const expensesRouter = Router();

const createExpenseSchema = z.object({
  description: z.string().trim().min(1, 'Description is required'),
  category: z.string().trim().min(1, 'Category is required'),
  amount_minor: z.number().int().positive('Amount must be positive integer paise'),
  expense_date: z.string().trim().optional(),
  payment_method: z.string().trim().optional().nullable(),
  vendor: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const updateExpenseSchema = z.object({
  description: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  amount_minor: z.number().int().positive().optional(),
  expense_date: z.string().trim().optional(),
  payment_method: z.string().trim().optional().nullable(),
  vendor: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

// GET /api/expenses
expensesRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

  let query = `SELECT * FROM expenses WHERE is_deleted = 0`;
  const params: unknown[] = [];

  if (category && category !== 'ALL') {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (search) {
    query += ` AND (LOWER(description) LIKE ? OR LOWER(vendor) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY expense_date DESC`;

  const expenses = db.prepare(query).all(...(params as any[]));
  res.json({ expenses });
});

// POST /api/expenses
expensesRouter.post('/', validateBody(createExpenseSchema), (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;
  const now = new Date().toISOString();
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const date = body.expense_date || now;

  db.prepare(`
    INSERT INTO expenses (
      id, description, category, amount_minor, expense_date, payment_method,
      vendor, notes, is_deleted, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id,
    body.description,
    body.category,
    body.amount_minor,
    date,
    body.payment_method || null,
    body.vendor || null,
    body.notes || null,
    now,
    now
  );

  const created = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(id);
  res.status(201).json({ expense: created });
});

// PATCH /api/expenses/:id
expensesRouter.patch('/:id', validateBody(updateExpenseSchema), (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM expenses WHERE id = ? AND is_deleted = 0`).get(req.params.id);
  if (!existing) {
    throw new NotFoundError(`Expense not found`);
  }

  const body = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE expenses SET
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      amount_minor = COALESCE(?, amount_minor),
      expense_date = COALESCE(?, expense_date),
      payment_method = CASE WHEN ? IS NOT NULL THEN ? ELSE payment_method END,
      vendor = CASE WHEN ? IS NOT NULL THEN ? ELSE vendor END,
      notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
      updated_at = ?
    WHERE id = ?
  `).run(
    body.description ?? null,
    body.category ?? null,
    body.amount_minor ?? null,
    body.expense_date ?? null,
    body.payment_method !== undefined ? 1 : null,
    body.payment_method ?? null,
    body.vendor !== undefined ? 1 : null,
    body.vendor ?? null,
    body.notes !== undefined ? 1 : null,
    body.notes ?? null,
    now,
    req.params.id
  );

  const updated = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(req.params.id);
  res.json({ expense: updated });
});

// DELETE /api/expenses/:id (Soft-delete)
expensesRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM expenses WHERE id = ? AND is_deleted = 0`).get(req.params.id);
  if (!existing) {
    throw new NotFoundError(`Expense not found`);
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE expenses SET is_deleted = 1, updated_at = ? WHERE id = ?`).run(now, req.params.id);
  res.json({ success: true, message: 'Expense deleted' });
});
