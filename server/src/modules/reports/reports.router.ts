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
  const byCategoryMap: Record<string, { category: string; count: number; units: number; cost_minor: number; retail_minor: number }> = {};

  for (const p of products) {
    const qty = Number(p.stock_quantity);
    totalUnits += qty;
    const costVal = qty * Number(p.cost_price_minor);
    const retailVal = qty * Number(p.selling_price_minor);
    totalCostValuationMinor += costVal;
    totalRetailValuationMinor += retailVal;

    const cat = p.category || 'Uncategorized';
    if (!byCategoryMap[cat]) {
      byCategoryMap[cat] = { category: cat, count: 0, units: 0, cost_minor: 0, retail_minor: 0 };
    }
    byCategoryMap[cat].count += 1;
    byCategoryMap[cat].units += qty;
    byCategoryMap[cat].cost_minor += costVal;
    byCategoryMap[cat].retail_minor += retailVal;

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
    by_category: Object.values(byCategoryMap),
    low_stock: lowStockItems,
    out_of_stock: outOfStockItems,
  });
});

// GET /api/reports/receivables
reportsRouter.get('/receivables', (_req: Request, res: Response) => {
  const db = getDb();

  // All sales with payments
  const sales = db.prepare(`
    SELECT 
      s.id,
      s.sale_number,
      s.customer_id,
      s.customer_name_snapshot,
      s.customer_contact_snapshot,
      s.sale_date,
      s.total_minor,
      s.status,
      COALESCE(SUM(p.amount_minor), 0) AS amount_paid_minor
    FROM sales s
    LEFT JOIN payments p ON p.sale_id = s.id
    WHERE s.status = 'CONFIRMED'
    GROUP BY s.id
    ORDER BY s.sale_date DESC
  `).all() as any[];

  let totalBilledMinor = 0;
  let totalCollectedMinor = 0;
  let totalOutstandingMinor = 0;

  const now = Date.now();
  let agingCurrentMinor = 0; // <= 15 days
  let aging15To30Minor = 0; // 16 - 30 days
  let agingOver30Minor = 0; // > 30 days

  const unpaidSales: any[] = [];
  const customerBalancesMap: Record<string, { customer_name: string; contact?: string; total_orders: number; outstanding_minor: number; billed_minor: number }> = {};

  for (const s of sales) {
    const total = Number(s.total_minor);
    const paid = Number(s.amount_paid_minor);
    const balance = Math.max(0, total - paid);

    totalBilledMinor += total;
    totalCollectedMinor += paid;
    totalOutstandingMinor += balance;

    if (balance > 0) {
      const daysAge = Math.floor((now - new Date(s.sale_date).getTime()) / (24 * 60 * 60 * 1000));
      if (daysAge <= 15) {
        agingCurrentMinor += balance;
      } else if (daysAge <= 30) {
        aging15To30Minor += balance;
      } else {
        agingOver30Minor += balance;
      }

      unpaidSales.push({
        ...s,
        balance_due_minor: balance,
        days_aged: daysAge,
      });

      const custName = s.customer_name_snapshot || 'Walk-in Customer';
      if (!customerBalancesMap[custName]) {
        customerBalancesMap[custName] = {
          customer_name: custName,
          contact: s.customer_contact_snapshot,
          total_orders: 0,
          outstanding_minor: 0,
          billed_minor: 0,
        };
      }
      customerBalancesMap[custName].total_orders += 1;
      customerBalancesMap[custName].outstanding_minor += balance;
      customerBalancesMap[custName].billed_minor += total;
    }
  }

  const collectionRatePct = totalBilledMinor > 0
    ? Math.round((totalCollectedMinor / totalBilledMinor) * 100)
    : 100;

  res.json({
    summary: {
      total_billed_minor: totalBilledMinor,
      total_collected_minor: totalCollectedMinor,
      total_outstanding_minor: totalOutstandingMinor,
      collection_rate_pct: collectionRatePct,
      customers_with_balance: Object.keys(customerBalancesMap).length,
    },
    aging: {
      current_15d_minor: agingCurrentMinor,
      aging_16_to_30d_minor: aging15To30Minor,
      aging_over_30d_minor: agingOver30Minor,
    },
    by_customer: Object.values(customerBalancesMap).sort((a, b) => b.outstanding_minor - a.outstanding_minor),
    unpaid_orders: unpaidSales,
  });
});

