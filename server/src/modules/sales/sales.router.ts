import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb, runTransaction } from '../../db/connection.js';
import { NotFoundError, BadRequestError, InsufficientStockError } from '../../shared/errors.js';
import { validateBody } from '../../shared/validation.js';

export const salesRouter = Router();

const createSaleSchema = z.object({
  customer_id: z.string().trim().optional().nullable(),
  customer_name: z.string().trim().min(1, 'Customer name is required'),
  customer_contact: z.string().trim().optional().nullable(),
  sale_date: z.string().trim().optional(),
  discount_minor: z.number().int().nonnegative().default(0),
  tax_minor: z.number().int().nonnegative().default(0),
  notes: z.string().trim().optional().nullable(),
  items: z.array(
    z.object({
      product_id: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().positive('Quantity must be greater than zero'),
      unit_price_minor: z.number().int().nonnegative().optional(),
    })
  ).min(1, 'At least one line item is required'),
  initial_payment: z.object({
    amount_minor: z.number().int().positive(),
    method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'OTHER']),
    reference: z.string().trim().optional().nullable(),
    note: z.string().trim().optional().nullable(),
  }).optional(),
});

const cancelSaleSchema = z.object({
  reason: z.string().trim().min(1, 'Cancellation reason is required'),
});

// GET /api/sales
salesRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : '';
  const paymentFilter = typeof req.query.payment_status === 'string' ? req.query.payment_status.trim().toUpperCase() : '';

  let query = `
    SELECT 
      s.*,
      COALESCE(SUM(p.amount_minor), 0) AS amount_paid_minor
    FROM sales s
    LEFT JOIN payments p ON p.sale_id = s.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (status && status !== 'ALL') {
    query += ` AND s.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (LOWER(s.sale_number) LIKE ? OR LOWER(s.customer_name_snapshot) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY s.id ORDER BY s.sale_date DESC`;

  const rows = db.prepare(query).all(...(params as any[])) as any[];

  const salesWithStatus = rows.map((s) => {
    const paid = Number(s.amount_paid_minor);
    const total = Number(s.total_minor);
    const balance = Math.max(0, total - paid);

    let derivedPaymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
    if (paid >= total && total > 0) {
      derivedPaymentStatus = 'PAID';
    } else if (paid > 0) {
      derivedPaymentStatus = 'PARTIALLY_PAID';
    } else {
      derivedPaymentStatus = 'UNPAID';
    }

    return {
      ...s,
      amount_paid_minor: paid,
      balance_due_minor: balance,
      payment_status: derivedPaymentStatus,
    };
  });

  const filtered = salesWithStatus.filter((s) => {
    if (!paymentFilter || paymentFilter === 'ALL') return true;
    return s.payment_status === paymentFilter;
  });

  res.json({ sales: filtered });
});

// POST /api/sales
salesRouter.post('/', validateBody(createSaleSchema), (req: Request, res: Response) => {
  const body = req.body;

  const result = runTransaction((txDb) => {
    const now = new Date().toISOString();
    const saleDate = body.sale_date || now;
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Generate unique sequential order number
    const year = new Date(saleDate).getFullYear();
    const countRow = txDb.prepare(`SELECT COUNT(*) as cnt FROM sales`).get() as any;
    const orderIndex = Number(countRow.cnt) + 1;
    const saleNumber = `ORD-${year}-${String(orderIndex).padStart(3, '0')}`;

    // 1. Validate all products and stock availability
    interface PreparedItem {
      product: any;
      quantity: number;
      unit_price_minor: number;
      unit_cost_minor: number;
      line_subtotal_minor: number;
    }

    const preparedItems: PreparedItem[] = [];
    let subtotalMinor = 0;

    for (const item of body.items) {
      const product = txDb.prepare(`SELECT * FROM products WHERE id = ?`).get(item.product_id) as any;
      if (!product) {
        throw new NotFoundError(`Product not found: ${item.product_id}`);
      }
      if (!product.is_active) {
        throw new BadRequestError(`Product "${product.name}" is deactivated and cannot be sold.`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}.`
        );
      }

      const unitPrice = item.unit_price_minor !== undefined ? item.unit_price_minor : product.selling_price_minor;
      const lineSubtotal = unitPrice * item.quantity;
      subtotalMinor += lineSubtotal;

      preparedItems.push({
        product,
        quantity: item.quantity,
        unit_price_minor: unitPrice,
        unit_cost_minor: product.cost_price_minor,
        line_subtotal_minor: lineSubtotal,
      });
    }

    const discountMinor = body.discount_minor || 0;
    const taxMinor = body.tax_minor || 0;
    const totalMinor = Math.max(0, subtotalMinor - discountMinor + taxMinor);

    // 2. Insert Sale
    txDb.prepare(`
      INSERT INTO sales (
        id, sale_number, customer_id, customer_name_snapshot, customer_contact_snapshot,
        sale_date, status, subtotal_minor, discount_minor, tax_minor, total_minor,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      saleNumber,
      body.customer_id || null,
      body.customer_name,
      body.customer_contact || null,
      saleDate,
      subtotalMinor,
      discountMinor,
      taxMinor,
      totalMinor,
      body.notes || null,
      now,
      now
    );

    // 3. Insert Sale Items, Decrement Product Stock, & Record Inventory Movements
    for (const pItem of preparedItems) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      txDb.prepare(`
        INSERT INTO sale_items (
          id, sale_id, product_id, product_name_snapshot, sku_snapshot,
          quantity, unit_price_minor, unit_cost_minor, line_subtotal_minor, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        saleId,
        pItem.product.id,
        pItem.product.name,
        pItem.product.sku,
        pItem.quantity,
        pItem.unit_price_minor,
        pItem.unit_cost_minor,
        pItem.line_subtotal_minor,
        now
      );

      // Decrement stock atomically
      txDb.prepare(`
        UPDATE products SET
          stock_quantity = stock_quantity - ?,
          updated_at = ?
        WHERE id = ?
      `).run(pItem.quantity, now, pItem.product.id);

      // Record inventory movement
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      txDb.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, movement_type, quantity_delta, reason, reference_type, reference_id, note, created_at
        ) VALUES (?, ?, 'SALE_FULFILLMENT', ?, 'Order fulfillment', 'SALE', ?, ?, ?)
      `).run(
        movId,
        pItem.product.id,
        -pItem.quantity,
        saleId,
        `Fulfilled in sale #${saleNumber}`,
        now
      );
    }

    // 4. Initial Payment if provided
    if (body.initial_payment && body.initial_payment.amount_minor > 0) {
      const payAmount = Math.min(body.initial_payment.amount_minor, totalMinor);
      const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      txDb.prepare(`
        INSERT INTO payments (
          id, sale_id, amount_minor, payment_date, method, reference, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        payId,
        saleId,
        payAmount,
        saleDate,
        body.initial_payment.method,
        body.initial_payment.reference || null,
        body.initial_payment.note || 'Settled upon order placement',
        now
      );
    }

    const createdSale = txDb.prepare(`SELECT * FROM sales WHERE id = ?`).get(saleId);
    const items = txDb.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(saleId);
    const payments = txDb.prepare(`SELECT * FROM payments WHERE sale_id = ?`).all(saleId);

    return { sale: createdSale, items, payments };
  });

  res.status(201).json(result);
});

// GET /api/sales/:id
salesRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(req.params.id) as any;
  if (!sale) {
    throw new NotFoundError(`Sale not found`);
  }

  const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(req.params.id);
  const payments = db.prepare(`SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date ASC`).all(req.params.id) as any[];

  const amountPaidMinor = payments.reduce((sum, p) => sum + Number(p.amount_minor), 0);
  const balanceDueMinor = Math.max(0, Number(sale.total_minor) - amountPaidMinor);

  let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  if (amountPaidMinor >= Number(sale.total_minor) && Number(sale.total_minor) > 0) {
    paymentStatus = 'PAID';
  } else if (amountPaidMinor > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  } else {
    paymentStatus = 'UNPAID';
  }

  res.json({
    sale: {
      ...sale,
      amount_paid_minor: amountPaidMinor,
      balance_due_minor: balanceDueMinor,
      payment_status: paymentStatus,
    },
    items,
    payments,
  });
});

// POST /api/sales/:id/cancel
salesRouter.post('/:id/cancel', validateBody(cancelSaleSchema), (req: Request, res: Response) => {
  const { reason } = req.body;

  const result = runTransaction((txDb) => {
    const sale = txDb.prepare(`SELECT * FROM sales WHERE id = ?`).get(req.params.id) as any;
    if (!sale) {
      throw new NotFoundError(`Sale not found`);
    }

    if (sale.status === 'CANCELLED') {
      throw new BadRequestError(`Sale is already cancelled.`);
    }

    const items = txDb.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(req.params.id) as any[];
    const now = new Date().toISOString();

    // Restore stock and create reversal inventory movements
    for (const item of items) {
      if (item.product_id) {
        txDb.prepare(`
          UPDATE products SET
            stock_quantity = stock_quantity + ?,
            updated_at = ?
          WHERE id = ?
        `).run(item.quantity, now, item.product_id);

        const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        txDb.prepare(`
          INSERT INTO inventory_movements (
            id, product_id, movement_type, quantity_delta, reason, reference_type, reference_id, note, created_at
          ) VALUES (?, ?, 'SALE_CANCELLATION', ?, 'Order cancelled reversal', 'SALE', ?, ?, ?)
        `).run(
          movId,
          item.product_id,
          item.quantity,
          sale.id,
          `Stock restored: order #${sale.sale_number} cancelled (${reason})`,
          now
        );
      }
    }

    // Update sale status
    txDb.prepare(`
      UPDATE sales SET
        status = 'CANCELLED',
        cancelled_at = ?,
        cancellation_reason = ?,
        updated_at = ?
      WHERE id = ?
    `).run(now, reason, now, req.params.id);

    const updatedSale = txDb.prepare(`SELECT * FROM sales WHERE id = ?`).get(req.params.id);
    return { sale: updatedSale };
  });

  res.json(result);
});
