import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../../db/connection.js';
import { NotFoundError } from '../../shared/errors.js';
import { validateBody } from '../../shared/validation.js';

export const customersRouter = Router();

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  billing_address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  billing_address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  is_active: z.number().int().min(0).max(1).optional(),
});

// GET /api/customers
customersRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const isActive = req.query.is_active !== undefined ? Number(req.query.is_active) : 1;

  let query = `SELECT * FROM customers WHERE 1=1`;
  const params: unknown[] = [];

  if (isActive === 0 || isActive === 1) {
    query += ` AND is_active = ?`;
    params.push(isActive);
  }

  if (search) {
    query += ` AND (LOWER(name) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(email) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY name ASC`;

  const customers = db.prepare(query).all(...(params as any[]));
  res.json({ customers });
});

// POST /api/customers
customersRouter.post('/', validateBody(createCustomerSchema), (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;
  const now = new Date().toISOString();
  const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  db.prepare(`
    INSERT INTO customers (
      id, name, phone, email, billing_address, notes, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id,
    body.name,
    body.phone || null,
    body.email || null,
    body.billing_address || null,
    body.notes || null,
    now,
    now
  );

  const created = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id);
  res.status(201).json({ customer: created });
});

// GET /api/customers/:id
customersRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!customer) {
    throw new NotFoundError(`Customer not found`);
  }

  const sales = db.prepare(`
    SELECT * FROM sales
    WHERE customer_id = ?
    ORDER BY sale_date DESC
    LIMIT 50
  `).all(req.params.id);

  res.json({ customer, sales });
});

// PATCH /api/customers/:id
customersRouter.patch('/:id', validateBody(updateCustomerSchema), (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!existing) {
    throw new NotFoundError(`Customer not found`);
  }

  const body = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE customers SET
      name = COALESCE(?, name),
      phone = CASE WHEN ? IS NOT NULL THEN ? ELSE phone END,
      email = CASE WHEN ? IS NOT NULL THEN ? ELSE email END,
      billing_address = CASE WHEN ? IS NOT NULL THEN ? ELSE billing_address END,
      notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ?
  `).run(
    body.name ?? null,
    body.phone !== undefined ? 1 : null,
    body.phone ?? null,
    body.email !== undefined ? 1 : null,
    body.email ?? null,
    body.billing_address !== undefined ? 1 : null,
    body.billing_address ?? null,
    body.notes !== undefined ? 1 : null,
    body.notes ?? null,
    body.is_active ?? null,
    now,
    req.params.id
  );

  const updated = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  res.json({ customer: updated });
});

// POST /api/customers/:id/deactivate
customersRouter.post('/:id/deactivate', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!existing) {
    throw new NotFoundError(`Customer not found`);
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE customers SET is_active = 0, updated_at = ? WHERE id = ?`).run(now, req.params.id);
  const updated = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  res.json({ customer: updated });
});
