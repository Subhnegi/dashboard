import { Router, type Request, type Response } from 'express';
import { getDb } from '../../db/connection.js';

export const dashboardRouter = Router();

// GET /api/dashboard
dashboardRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const range = typeof req.query.range === 'string' ? req.query.range.toLowerCase() : '30d';

  const now = new Date();
  let days = 30;
  let rangeLabel = 'Last 30 Days';

  if (range === 'today' || range === '1d' || range === '1h') {
    days = 1;
    rangeLabel = 'Today';
  } else if (range === '7d' || range === 'week') {
    days = 7;
    rangeLabel = 'Last 7 Days';
  } else if (range === 'month') {
    // days since first of current month
    days = Math.max(1, now.getDate());
    rangeLabel = 'This Month';
  } else if (range === '90d') {
    days = 90;
    rangeLabel = 'Last 90 Days';
  } else if (range === 'year' || range === '2025' || range === '365d') {
    days = 365;
    rangeLabel = 'This Year';
  }

  const durationMs = days * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - durationMs).toISOString();
  const prevCutoff = new Date(Date.now() - 2 * durationMs).toISOString();

  // 1. Current Period Sales
  const salesRows = db.prepare(`
    SELECT s.*, COALESCE(SUM(p.amount_minor), 0) AS paid_minor
    FROM sales s
    LEFT JOIN payments p ON p.sale_id = s.id
    WHERE s.status = 'CONFIRMED' AND s.sale_date >= ?
    GROUP BY s.id
    ORDER BY s.sale_date ASC
  `).all(cutoff) as any[];

  const salesRevenueMinor = salesRows.reduce((sum, s) => sum + Number(s.total_minor), 0);
  const totalOrders = salesRows.length;

  // 2. Cost of goods sold (COGS)
  const cogsRow = db.prepare(`
    SELECT COALESCE(SUM(si.quantity * COALESCE(si.unit_cost_minor, 0)), 0) AS total_cogs_minor
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'CONFIRMED' AND s.sale_date >= ?
  `).get(cutoff) as any;
  const cogsMinor = Number(cogsRow?.total_cogs_minor || 0);

  // 3. Expenses
  const expensesRow = db.prepare(`
    SELECT COALESCE(SUM(amount_minor), 0) AS total_expenses_minor
    FROM expenses
    WHERE is_deleted = 0 AND expense_date >= ?
  `).get(cutoff) as any;
  const expensesMinor = Number(expensesRow?.total_expenses_minor || 0);

  // 4. Gross & Estimated Net Operating Profit
  const grossProfitMinor = salesRevenueMinor - cogsMinor;
  const netEstimatedProfitMinor = grossProfitMinor - expensesMinor;

  // 5. Preceding Period Comparison for Real Trends
  const prevSalesRows = db.prepare(`
    SELECT total_minor FROM sales
    WHERE status = 'CONFIRMED' AND sale_date >= ? AND sale_date < ?
  `).all(prevCutoff, cutoff) as any[];
  const prevSalesRevenueMinor = prevSalesRows.reduce((sum, s) => sum + Number(s.total_minor), 0);
  const prevOrdersCount = prevSalesRows.length;

  const prevExpensesRow = db.prepare(`
    SELECT COALESCE(SUM(amount_minor), 0) AS total_expenses_minor
    FROM expenses
    WHERE is_deleted = 0 AND expense_date >= ? AND expense_date < ?
  `).get(prevCutoff, cutoff) as any;
  const prevExpensesMinor = Number(prevExpensesRow?.total_expenses_minor || 0);

  const prevCogsRow = db.prepare(`
    SELECT COALESCE(SUM(si.quantity * COALESCE(si.unit_cost_minor, 0)), 0) AS total_cogs_minor
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'CONFIRMED' AND s.sale_date >= ? AND s.sale_date < ?
  `).get(prevCutoff, cutoff) as any;
  const prevCogsMinor = Number(prevCogsRow?.total_cogs_minor || 0);
  const prevEstimatedProfitMinor = (prevSalesRevenueMinor - prevCogsMinor) - prevExpensesMinor;

  const calcPctChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  const revenueGrowthPct = calcPctChange(salesRevenueMinor, prevSalesRevenueMinor);
  const ordersGrowthPct = calcPctChange(totalOrders, prevOrdersCount);
  const profitGrowthPct = calcPctChange(netEstimatedProfitMinor, prevEstimatedProfitMinor);
  const expensesGrowthPct = calcPctChange(expensesMinor, prevExpensesMinor);

  // 6. Customers & Products Count
  const customerCountRow = db.prepare(`SELECT COUNT(*) AS cnt FROM customers WHERE is_active = 1`).get() as any;
  const totalCustomers = Number(customerCountRow?.cnt || 0);

  const products = db.prepare(`SELECT * FROM products WHERE is_active = 1`).all() as any[];
  const lowOrOutStock = products.filter((p) => p.stock_quantity <= p.reorder_level);

  // 7. Time Series for Area/Line Chart (12 data points bucketed evenly)
  const numBuckets = days <= 7 ? Math.max(days, 7) : 12;
  const bucketDurationMs = durationMs / numBuckets;
  const timeSeries: Array<{ label: string; date: string; revenue_minor: number; orders_count: number }> = [];

  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = new Date(Date.now() - durationMs + i * bucketDurationMs);
    const bucketEnd = new Date(Date.now() - durationMs + (i + 1) * bucketDurationMs);

    let label = '';
    if (days <= 1) {
      label = `${bucketStart.getHours()}:00`;
    } else if (days <= 7) {
      label = bucketStart.toLocaleDateString('en-IN', { weekday: 'short' });
    } else if (days <= 90) {
      label = `${bucketStart.getDate()} ${bucketStart.toLocaleDateString('en-IN', { month: 'short' })}`;
    } else {
      label = bucketStart.toLocaleDateString('en-IN', { month: 'short' });
    }

    const bucketSales = salesRows.filter((s) => {
      const d = new Date(s.sale_date).getTime();
      return d >= bucketStart.getTime() && d < bucketEnd.getTime();
    });

    const bucketRev = bucketSales.reduce((acc, s) => acc + Number(s.total_minor), 0);
    timeSeries.push({
      label,
      date: bucketStart.toISOString(),
      revenue_minor: bucketRev,
      orders_count: bucketSales.length,
    });
  }

  // 8. Weekly Distribution (Last 7 Days, Monday to Sunday)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyDistribution: Array<{ day: string; date: string; revenue_minor: number; orders_count: number; is_today: boolean }> = [];
  const sevenDaysCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const sevenDaysSales = db.prepare(`
    SELECT total_minor, sale_date FROM sales
    WHERE status = 'CONFIRMED' AND sale_date >= ?
  `).all(sevenDaysCutoff.toISOString()) as any[];

  for (let d = 6; d >= 0; d--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - d);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const dayName = dayNames[targetDate.getDay()];

    const matching = sevenDaysSales.filter((s) => s.sale_date.startsWith(dateStr));
    const dayRev = matching.reduce((acc, s) => acc + Number(s.total_minor), 0);

    weeklyDistribution.push({
      day: dayName,
      date: dateStr,
      revenue_minor: dayRev,
      orders_count: matching.length,
      is_today: d === 0,
    });
  }

  const weeklyTotalMinor = weeklyDistribution.reduce((acc, w) => acc + w.revenue_minor, 0);

  // 9. Sales By Category
  const categorySales = db.prepare(`
    SELECT 
      p.category,
      SUM(si.quantity) as items_sold,
      SUM(si.line_subtotal_minor) as revenue_minor
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.status = 'CONFIRMED' AND s.sale_date >= ?
    GROUP BY p.category
    ORDER BY revenue_minor DESC
  `).all(cutoff) as any[];

  const totalCatRevenue = categorySales.reduce((acc, c) => acc + Number(c.revenue_minor), 0);
  const formattedCategorySales = categorySales.map((c) => ({
    category: c.category,
    items_sold: Number(c.items_sold),
    revenue_minor: Number(c.revenue_minor),
    percentage: totalCatRevenue > 0 ? Math.round((Number(c.revenue_minor) / totalCatRevenue) * 100) : 0,
  }));

  // 10. Top Products in range
  const topProducts = db.prepare(`
    SELECT 
      si.product_id,
      si.product_name_snapshot as name,
      si.sku_snapshot as sku,
      p.category,
      SUM(si.quantity) as quantity_sold,
      SUM(si.line_subtotal_minor) as total_revenue_minor
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    LEFT JOIN products p ON p.id = si.product_id
    WHERE s.status = 'CONFIRMED' AND s.sale_date >= ?
    GROUP BY si.product_id
    ORDER BY total_revenue_minor DESC
    LIMIT 6
  `).all(cutoff) as any[];

  // 11. Recent Sales (latest 6)
  const recentSales = db.prepare(`
    SELECT 
      s.*,
      COALESCE(SUM(p.amount_minor), 0) AS amount_paid_minor,
      (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) AS items_count,
      (SELECT product_name_snapshot FROM sale_items WHERE sale_id = s.id LIMIT 1) AS primary_product_name,
      (SELECT sku_snapshot FROM sale_items WHERE sale_id = s.id LIMIT 1) AS primary_sku
    FROM sales s
    LEFT JOIN payments p ON p.sale_id = s.id
    GROUP BY s.id
    ORDER BY s.sale_date DESC
    LIMIT 6
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
    range,
    range_label: rangeLabel,
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
    comparisons: {
      revenue_growth_percent: revenueGrowthPct,
      orders_growth_percent: ordersGrowthPct,
      profit_growth_percent: profitGrowthPct,
      expenses_growth_percent: expensesGrowthPct,
      prev_sales_revenue_minor: prevSalesRevenueMinor,
      prev_expenses_minor: prevExpensesMinor,
      prev_orders: prevOrdersCount,
      prev_estimated_profit_minor: prevEstimatedProfitMinor,
    },
    time_series: timeSeries,
    weekly_distribution: {
      days: weeklyDistribution,
      total_minor: weeklyTotalMinor,
      average_daily_minor: Math.round(weeklyTotalMinor / 7),
    },
    sales_by_category: formattedCategorySales,
    top_products: topProducts,
    recent_sales: formattedRecentSales,
    low_stock_products: lowOrOutStock.slice(0, 5),
  });
});

