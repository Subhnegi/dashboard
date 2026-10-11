import { Router, type Request, type Response } from 'express';
import { getDb } from '../../db/connection.js';

export const reportsRouter = Router();

// GET /api/reports/sales
reportsRouter.get('/sales', (req: Request, res: Response) => {
  const db = getDb();
  const from = typeof req.query.from === 'string' ? req.query.from : '';
  const to = typeof req.query.to === 'string' ? req.query.to : '';

  let query = `SELECT * FROM sales WHERE status = 'CONFIRMED'`;
  const params: unknown[] = [];

  if (from) {
    query += ` AND sale_date >= ?`;
    params.push(from);
  }
  if (to) {
    query += ` AND sale_date <= ?`;
    params.push(to);
  }

  query += ` ORDER BY sale_date ASC`;

  const sales = db.prepare(query).all(...(params as any[])) as any[];

  const totalRevenueMinor = sales.reduce((sum, s) => sum + Number(s.total_minor), 0);
  const totalOrders = sales.length;

  // Best selling products in this range
  let itemsQuery = `
    SELECT 
      si.product_id,
      si.product_name_snapshot AS name,
      si.sku_snapshot AS sku,
      SUM(si.quantity) AS total_quantity,
      SUM(si.line_subtotal_minor) AS total_revenue_minor
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'CONFIRMED'
  `;
  const itemsParams: unknown[] = [];
  if (from) {
    itemsQuery += ` AND s.sale_date >= ?`;
    itemsParams.push(from);
  }
  if (to) {
    itemsQuery += ` AND s.sale_date <= ?`;
    itemsParams.push(to);
  }
  itemsQuery += ` GROUP BY si.product_id ORDER BY total_revenue_minor DESC LIMIT 10`;

  const bestSelling = db.prepare(itemsQuery).all(...(itemsParams as any[]));

  res.json({
    summary: {
      total_revenue_minor: totalRevenueMinor,
      total_orders: totalOrders,
      average_order_value_minor: totalOrders > 0 ? Math.round(totalRevenueMinor / totalOrders) : 0,
    },
    best_selling: bestSelling,
  });
});

// GET /api/reports/expenses
reportsRouter.get('/expenses', (req: Request, res: Response) => {
  const db = getDb();
  const from = typeof req.query.from === 'string' ? req.query.from : '';
  const to = typeof req.query.to === 'string' ? req.query.to : '';

  let query = `
    SELECT 
      category,
      COUNT(*) AS count,
      SUM(amount_minor) AS total_amount_minor
    FROM expenses
    WHERE is_deleted = 0
  `;
  const params: unknown[] = [];

  if (from) {
    query += ` AND expense_date >= ?`;
    params.push(from);
  }
  if (to) {
    query += ` AND expense_date <= ?`;
    params.push(to);
  }

  query += ` GROUP BY category ORDER BY total_amount_minor DESC`;

  const categories = db.prepare(query).all(...(params as any[])) as any[];
  const totalExpensesMinor = categories.reduce((sum, c) => sum + Number(c.total_amount_minor), 0);

  res.json({
    summary: {
      total_expenses_minor: totalExpensesMinor,
      category_count: categories.length,
    },
    by_category: categories,
  });
});

// GET /api/reports/inventory
reportsRouter.get('/inventory', (_req: Request, res: Response) => {
  const db = getDb();
  const products = db.prepare(`SELECT * FROM products WHERE is_active = 1`).all() as any[];

  let totalUnits = 0;
  let totalCostValuationMinor = 0;
  let totalRetailValuationMinor = 0;
  const lowStockItems: any[] = [];
  const outOfStockItems: any[] = [];

  for (const p of products) {
    const qty = Number(p.stock_quantity);
    totalUnits += qty;
    totalCostValuationMinor += qty * Number(p.cost_price_minor);
    totalRetailValuationMinor += qty * Number(p.selling_price_minor);

    if (qty === 0) {
      outOfStockItems.push(p);
    } else if (qty <= Number(p.reorder_level)) {
      lowStockItems.push(p);
    }
  }

  res.json({
    summary: {
      total_products: products.length,
      total_units: totalUnits,
      valuation_at_cost_minor: totalCostValuationMinor,
      valuation_at_retail_minor: totalRetailValuationMinor,
      potential_profit_margin_minor: totalRetailValuationMinor - totalCostValuationMinor,
    },
    low_stock: lowStockItems,
    out_of_stock: outOfStockItems,
  });
});
