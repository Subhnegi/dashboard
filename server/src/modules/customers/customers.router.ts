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
  const isActive = req.query.is_active !== undefined ? Number(req.query.is_active) : undefined;

  let query = `
    SELECT
      c.*,
      COUNT(DISTINCT CASE WHEN s.status = 'CONFIRMED' THEN s.id END) AS total_sales_count,
      COALESCE(SUM(CASE WHEN s.status = 'CONFIRMED' THEN s.total_minor ELSE 0 END), 0) AS lifetime_value_minor,
      COALESCE(SUM(CASE WHEN s.status = 'CONFIRMED' THEN MAX(0, s.total_minor - COALESCE(pmt.total_paid, 0)) ELSE 0 END), 0) AS outstanding_balance_minor
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    LEFT JOIN (
      SELECT sale_id, SUM(amount_minor) AS total_paid
      FROM payments
      GROUP BY sale_id
    ) pmt ON pmt.sale_id = s.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (isActive === 0 || isActive === 1) {
    query += ` AND c.is_active = ?`;
    params.push(isActive);
  }

  if (search) {
    query += ` AND (LOWER(c.name) LIKE ? OR LOWER(COALESCE(c.phone, '')) LIKE ? OR LOWER(COALESCE(c.email, '')) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY c.id ORDER BY c.name ASC`;

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

  const created = db.prepare(`
    SELECT
      c.*,
      0 AS total_sales_count,
      0 AS lifetime_value_minor,
      0 AS outstanding_balance_minor
    FROM customers c
    WHERE c.id = ?
  `).get(id);

  res.status(201).json({ customer: created });
});

// GET /api/customers/:id
customersRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const customer = db.prepare(`
    SELECT
      c.*,
      COUNT(DISTINCT CASE WHEN s.status = 'CONFIRMED' THEN s.id END) AS total_sales_count,
      COALESCE(SUM(CASE WHEN s.status = 'CONFIRMED' THEN s.total_minor ELSE 0 END), 0) AS lifetime_value_minor,
      COALESCE(SUM(CASE WHEN s.status = 'CONFIRMED' THEN MAX(0, s.total_minor - COALESCE(pmt.total_paid, 0)) ELSE 0 END), 0) AS outstanding_balance_minor
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    LEFT JOIN (
      SELECT sale_id, SUM(amount_minor) AS total_paid
      FROM payments
      GROUP BY sale_id
    ) pmt ON pmt.sale_id = s.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id) as any;

  if (!customer) {
    throw new NotFoundError(`Customer not found`);
  }

  const sales = db.prepare(`
    SELECT
      s.*,
      COALESCE(pmt.total_paid, 0) AS amount_paid_minor,
      MAX(0, s.total_minor - COALESCE(pmt.total_paid, 0)) AS balance_due_minor
    FROM sales s
    LEFT JOIN (
      SELECT sale_id, SUM(amount_minor) AS total_paid
      FROM payments
      GROUP BY sale_id
    ) pmt ON pmt.sale_id = s.id
    WHERE s.customer_id = ?
    ORDER BY s.sale_date DESC
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

  const updated = db.prepare(`
    SELECT
      c.*,
      COUNT(DISTINCT CASE WHEN s.status = 'CONFIRMED' THEN s.id END) AS total_sales_count,
      COALESCE(SUM(CASE WHEN s.status = 'CONFIRMED' THEN s.total_minor ELSE 0 END), 0) AS lifetime_value_minor,
      COALESCE(SUM(CASE WHEN s.status = 'CONFIRMED' THEN MAX(0, s.total_minor - COALESCE(pmt.total_paid, 0)) ELSE 0 END), 0) AS outstanding_balance_minor
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    LEFT JOIN (
      SELECT sale_id, SUM(amount_minor) AS total_paid
      FROM payments
      GROUP BY sale_id
    ) pmt ON pmt.sale_id = s.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id);

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

// POST /api/customers/:id/reactivate
customersRouter.post('/:id/reactivate', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!existing) {
    throw new NotFoundError(`Customer not found`);
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE customers SET is_active = 1, updated_at = ? WHERE id = ?`).run(now, req.params.id);
  const updated = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  res.json({ customer: updated });
});
