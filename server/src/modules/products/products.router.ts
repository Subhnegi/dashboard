import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb, runTransaction } from '../../db/connection.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors.js';
import { validateBody, validateQuery } from '../../shared/validation.js';

export const productsRouter = Router();

const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  sku: z.string().trim().optional().nullable(),
  category: z.string().trim().min(1, 'Category is required'),
  description: z.string().trim().optional().nullable(),
  selling_price_minor: z.number().int().nonnegative('Selling price must be non-negative integer paise'),
  cost_price_minor: z.number().int().nonnegative('Cost price must be non-negative integer paise'),
  stock_quantity: z.number().int().nonnegative('Stock quantity must be non-negative').default(0),
  reorder_level: z.number().int().nonnegative('Reorder level must be non-negative').default(5),
});

const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sku: z.string().trim().optional().nullable(),
  category: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  selling_price_minor: z.number().int().nonnegative().optional(),
  cost_price_minor: z.number().int().nonnegative().optional(),
  reorder_level: z.number().int().nonnegative().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

const adjustStockSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, 'Adjustment delta cannot be zero'),
  reason: z.string().trim().min(1, 'Adjustment reason is required'),
  note: z.string().trim().optional().nullable(),
});

// GET /api/products
productsRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const stockStatus = typeof req.query.stock_status === 'string' ? req.query.stock_status.trim().toUpperCase() : '';
  const isActive = req.query.is_active !== undefined ? Number(req.query.is_active) : 1;

  let query = `SELECT * FROM products WHERE 1=1`;
  const params: unknown[] = [];

  if (isActive === 0 || isActive === 1) {
    query += ` AND is_active = ?`;
    params.push(isActive);
  }

  if (category && category !== 'ALL') {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (search) {
    query += ` AND (LOWER(name) LIKE ? OR LOWER(sku) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY name ASC`;

  const rows = db.prepare(query).all(...(params as any[])) as any[];

  // Filter stockStatus derived if specified
  const filtered = rows.filter((p) => {
    if (!stockStatus || stockStatus === 'ALL') return true;
    if (stockStatus === 'OUT_OF_STOCK') return p.stock_quantity === 0;
    if (stockStatus === 'LOW_STOCK') return p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level;
    if (stockStatus === 'IN_STOCK') return p.stock_quantity > p.reorder_level;
    return true;
  });

  res.json({ products: filtered });
});

// POST /api/products
productsRouter.post('/', validateBody(createProductSchema), (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;
  const now = new Date().toISOString();
  const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Check unique SKU
  if (body.sku) {
    const existing = db.prepare(`SELECT id FROM products WHERE LOWER(sku) = LOWER(?)`).get(body.sku);
    if (existing) {
      throw new ConflictError(`A product with SKU "${body.sku}" already exists`);
    }
  }

  const created = runTransaction((txDb) => {
    txDb.prepare(`
      INSERT INTO products (
        id, name, sku, category, description, selling_price_minor,
        cost_price_minor, stock_quantity, reorder_level, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      body.name,
      body.sku || null,
      body.category,
      body.description || null,
      body.selling_price_minor,
      body.cost_price_minor,
      body.stock_quantity,
      body.reorder_level,
      now,
      now
    );

    // Record opening stock movement if stock > 0
    if (body.stock_quantity > 0) {
      txDb.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, movement_type, quantity_delta, reason, reference_type, reference_id, note, created_at
        ) VALUES (?, ?, 'OPENING_BALANCE', ?, 'Initial stock registration', 'PRODUCT_CREATION', ?, 'Opening balance recorded at creation', ?)
      `).run(
        `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        id,
        body.stock_quantity,
        id,
        now
      );
    }

    return txDb.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  });

  res.status(201).json({ product: created });
});

// GET /api/products/:id
productsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
  if (!product) {
    throw new NotFoundError(`Product not found`);
  }

  const movements = db.prepare(`
    SELECT * FROM inventory_movements
    WHERE product_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.params.id);

  res.json({ product, movements });
});

// PATCH /api/products/:id
productsRouter.patch('/:id', validateBody(updateProductSchema), (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id) as any;
  if (!existing) {
    throw new NotFoundError(`Product not found`);
  }

  const body = req.body;

  // SKU conflict check
  if (body.sku && body.sku !== existing.sku) {
    const conflict = db.prepare(`SELECT id FROM products WHERE LOWER(sku) = LOWER(?) AND id != ?`).get(body.sku, req.params.id);
    if (conflict) {
      throw new ConflictError(`A product with SKU "${body.sku}" already exists`);
    }
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      sku = CASE WHEN ? IS NOT NULL THEN ? ELSE sku END,
      category = COALESCE(?, category),
      description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END,
      selling_price_minor = COALESCE(?, selling_price_minor),
      cost_price_minor = COALESCE(?, cost_price_minor),
      reorder_level = COALESCE(?, reorder_level),
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ?
  `).run(
    body.name ?? null,
    body.sku !== undefined ? 1 : null,
    body.sku ?? null,
    body.category ?? null,
    body.description !== undefined ? 1 : null,
    body.description ?? null,
    body.selling_price_minor ?? null,
    body.cost_price_minor ?? null,
    body.reorder_level ?? null,
    body.is_active ?? null,
    now,
    req.params.id
  );

  const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
  res.json({ product: updated });
});

// POST /api/products/:id/adjust-stock
productsRouter.post('/:id/adjust-stock', validateBody(adjustStockSchema), (req: Request, res: Response) => {
  const { delta, reason, note } = req.body;

  const result = runTransaction((txDb) => {
    const product = txDb.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id) as any;
    if (!product) {
      throw new NotFoundError(`Product not found`);
    }

    const newQuantity = product.stock_quantity + delta;
    if (newQuantity < 0) {
      throw new BadRequestError(`Cannot adjust stock below 0. Current quantity is ${product.stock_quantity}, adjustment is ${delta}.`);
    }

    const now = new Date().toISOString();

    txDb.prepare(`
      UPDATE products SET
        stock_quantity = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newQuantity, now, req.params.id);

    const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    txDb.prepare(`
      INSERT INTO inventory_movements (
        id, product_id, movement_type, quantity_delta, reason, reference_type, reference_id, note, created_at
      ) VALUES (?, ?, 'MANUAL_ADJUSTMENT', ?, ?, 'MANUAL_ADJUSTMENT', ?, ?, ?)
    `).run(
      movId,
      req.params.id,
      delta,
      reason,
      movId,
      note || null,
      now
    );

    const updatedProduct = txDb.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    return { product: updatedProduct, movementId: movId };
  });

  res.json(result);
});

// POST /api/products/:id/deactivate
productsRouter.post('/:id/deactivate', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
  if (!existing) {
    throw new NotFoundError(`Product not found`);
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?`).run(now, req.params.id);
  const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
  res.json({ product: updated });
});
