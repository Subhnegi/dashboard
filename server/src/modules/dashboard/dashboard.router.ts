import { Router, type Request, type Response } from 'express';
import { getDb } from '../../db/connection.js';

export const dashboardRouter = Router();

// GET /api/dashboard
dashboardRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const range = typeof req.query.range === 'string' ? req.query.range : '30d';

  let days = 30;
  if (range === '7d') days = 7;
  if (range === 'today' || range === '1d') days = 1;
  if (range === '90d') days = 90;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // 1. Sales metrics
  const salesRows = db.prepare(`
    SELECT s.*, COALESCE(SUM(p.amount_minor), 0) AS paid_minor
    FROM sales s
    LEFT JOIN payments p ON p.sale_id = s.id
    WHERE s.status = 'CONFIRMED' AND s.sale_date >= ?
    GROUP BY s.id
  `).all(cutoff) as any[];

  const salesRevenueMinor = salesRows.reduce((sum, s) => sum + Number(s.total_minor), 0);
  const totalOrders = salesRows.length;

  // 2. Cost of goods sold (COGS) for these sales
  const cogsRow = db.prepare(`
    SELECT COALESCE(SUM(si.quantity * COALESCE(si.unit_cost_minor, 0)), 0) AS total_cogs_minor
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'CONFIRMED' AND s.sale_date >= ?
  `).get(cutoff) as any;
  const cogsMinor = Number(cogsRow.total_cogs_minor);

  // 3. Expenses
  const expensesRow = db.prepare(`
    SELECT COALESCE(SUM(amount_minor), 0) AS total_expenses_minor
    FROM expenses
    WHERE is_deleted = 0 AND expense_date >= ?
  `).get(cutoff) as any;
  const expensesMinor = Number(expensesRow.total_expenses_minor);

  // 4. Net estimated operating profit
  const grossProfitMinor = salesRevenueMinor - cogsMinor;
  const netEstimatedProfitMinor = grossProfitMinor - expensesMinor;

  // 5. Customer count
  const customerCountRow = db.prepare(`SELECT COUNT(*) AS cnt FROM customers WHERE is_active = 1`).get() as any;
  const totalCustomers = Number(customerCountRow.cnt);

  // 6. Product count & Stock Alerts
  const products = db.prepare(`SELECT * FROM products WHERE is_active = 1`).all() as any[];
  const lowOrOutStock = products.filter((p) => p.stock_quantity <= p.reorder_level);

  // 7. Recent Sales (latest 5)
  const recentSales = db.prepare(`
    SELECT 
      s.*,
      COALESCE(SUM(p.amount_minor), 0) AS amount_paid_minor
    FROM sales s
    LEFT JOIN payments p ON p.sale_id = s.id
    GROUP BY s.id
    ORDER BY s.sale_date DESC
    LIMIT 5
  `).all() as any[];

  const formattedRecentSales = recentSales.map((s) => {
    const paid = Number(s.amount_paid_minor);
    const total = Number(s.total_minor);
    let status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
    if (paid >= total && total > 0) status = 'PAID';
    else if (paid > 0) status = 'PARTIALLY_PAID';
    else status = 'UNPAID';

    return {
      ...s,
      amount_paid_minor: paid,
      balance_due_minor: Math.max(0, total - paid),
      payment_status: status,
    };
  });

  res.json({
    kpis: {
      sales_revenue_minor: salesRevenueMinor,
      expenses_minor: expensesMinor,
      gross_profit_minor: grossProfitMinor,
      estimated_profit_minor: netEstimatedProfitMinor,
      total_orders: totalOrders,
      total_customers: totalCustomers,
      total_products: products.length,
      low_stock_count: lowOrOutStock.length,
    },
    recent_sales: formattedRecentSales,
    low_stock_products: lowOrOutStock.slice(0, 5),
  });
});
