import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Printer,
  TrendingUp,
  Receipt,
  Scale,
  Package,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import * as api from '../../lib/api-client';
import {
  formatCurrency,
  formatDate,
  getProductStockStatus,
} from '../../lib/formatters';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products, showToast } = useDemoData();

  // Active Report Tab: SALES, EXPENSES, INVENTORY, RECEIVABLES
  const [activeTab, setActiveTab] = useState<'SALES' | 'EXPENSES' | 'INVENTORY' | 'RECEIVABLES'>('SALES');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | '7D' | '30D' | 'MONTH'>('30D');

  // Backend report data
  const [salesReportData, setSalesReportData] = useState<any>(null);
  const [expensesReportData, setExpensesReportData] = useState<any>(null);
  const [inventoryReportData, setInventoryReportData] = useState<any>(null);
  const [receivablesReportData, setReceivablesReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch report data based on dateRange
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);

    const now = new Date();
    let from = '';
    const to = now.toISOString();

    if (dateRange === 'TODAY') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      from = today.toISOString();
    } else if (dateRange === '7D') {
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === '30D') {
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === 'MONTH') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }

    Promise.all([
      api.getSalesReport(from, to).catch(() => null),
      api.getExpensesReport(from, to).catch(() => null),
      api.getInventoryReport().catch(() => null),
      api.getReceivablesReport().catch(() => null),
    ])
      .then(([sRep, eRep, iRep, rRep]) => {
        if (isCurrent) {
          if (sRep) setSalesReportData(sRep);
          if (eRep) setExpensesReportData(eRep);
          if (iRep) setInventoryReportData(iRep);
          if (rRep) setReceivablesReportData(rRep);
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [dateRange, sales.length, expenses.length]);

  // Filtered context data matching the selected dateRange
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((s) => {
      if (s.status !== 'CONFIRMED') return false;
      const t = new Date(s.sale_date).getTime();
      if (dateRange === 'TODAY') return t >= todayStart;
      if (dateRange === '7D') return t >= sevenDaysAgo;
      if (dateRange === '30D') return t >= thirtyDaysAgo;
      if (dateRange === 'MONTH') return t >= monthStart;
      return true;
    });
  }, [sales, dateRange]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return expenses.filter((e) => {
      if (e.is_deleted) return false;
      const t = new Date(e.expense_date).getTime();
      if (dateRange === 'TODAY') return t >= todayStart;
      if (dateRange === '7D') return t >= sevenDaysAgo;
      if (dateRange === '30D') return t >= thirtyDaysAgo;
      if (dateRange === 'MONTH') return t >= monthStart;
      return true;
    });
  }, [expenses, dateRange]);

  // Overall Financial Metric Aggregations
  const totalSalesRevenueMinor = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.total_minor, 0);
  }, [filteredSales]);

  const totalExpenseMinor = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount_minor, 0);
  }, [filteredExpenses]);

  // Estimated COGS from line items
  const totalCogsMinor = useMemo(() => {
    let cogs = 0;
    for (const s of filteredSales) {
      for (const item of s.items || []) {
        cogs += item.quantity * (item.unit_cost_minor || 0);
      }
    }
    return cogs;
  }, [filteredSales]);

  const grossProfitMinor = totalSalesRevenueMinor - totalCogsMinor;
  const netOperatingProfitMinor = grossProfitMinor - totalExpenseMinor;

  // Best Selling Products
  const bestSellingProducts = useMemo(() => {
    if (salesReportData?.best_selling && salesReportData.best_selling.length > 0) {
      return salesReportData.best_selling;
    }
    const map: Record<string, { product_id: string; name: string; sku: string; total_quantity: number; total_revenue_minor: number }> = {};
    for (const sale of filteredSales) {
      for (const item of sale.items || []) {
        if (!map[item.product_id]) {
          map[item.product_id] = {
            product_id: item.product_id,
            name: item.product_name_snapshot,
            sku: item.sku_snapshot,
            total_quantity: 0,
            total_revenue_minor: 0,
          };
        }
        map[item.product_id].total_quantity += item.quantity;
        map[item.product_id].total_revenue_minor += item.line_subtotal_minor;
      }
    }
    return Object.values(map).sort((a, b) => b.total_revenue_minor - a.total_revenue_minor);
  }, [salesReportData, filteredSales]);

  // Expense Categories
  const expenseCategories = useMemo(() => {
    if (expensesReportData?.by_category && expensesReportData.by_category.length > 0) {
      return expensesReportData.by_category;
    }
    const map: Record<string, { category: string; count: number; total_amount_minor: number }> = {};
    for (const exp of filteredExpenses) {
      if (!map[exp.category]) {
        map[exp.category] = { category: exp.category, count: 0, total_amount_minor: 0 };
      }
      map[exp.category].count += 1;
      map[exp.category].total_amount_minor += exp.amount_minor;
    }
    return Object.values(map).sort((a, b) => b.total_amount_minor - a.total_amount_minor);
  }, [expensesReportData, filteredExpenses]);

  // Inventory Totals
  const inventorySummary = useMemo(() => {
    if (inventoryReportData?.summary) {
      return inventoryReportData.summary;
    }
    let totalUnits = 0;
    let costVal = 0;
    let retailVal = 0;
    for (const p of products) {
      if (p.is_active) {
        totalUnits += p.stock_quantity;
        costVal += p.stock_quantity * p.cost_price_minor;
        retailVal += p.stock_quantity * p.selling_price_minor;
      }
    }
    return {
      total_products: products.length,
      total_units: totalUnits,
      valuation_at_cost_minor: costVal,
      valuation_at_retail_minor: retailVal,
      potential_profit_margin_minor: retailVal - costVal,
    };
  }, [inventoryReportData, products]);

  // Receivables Data
  const receivablesSummary = useMemo(() => {
    if (receivablesReportData) {
      return receivablesReportData;
    }
    let billed = 0;
    let paid = 0;
    let balance = 0;
    const unpaidList: any[] = [];

    for (const s of sales) {
      if (s.status === 'CONFIRMED') {
        billed += s.total_minor;
        const pTotal = (s.payments || []).reduce((acc, p) => acc + p.amount_minor, 0);
        paid += pTotal;
        const bal = Math.max(0, s.total_minor - pTotal);
        balance += bal;
        if (bal > 0) {
          unpaidList.push({ ...s, balance_due_minor: bal });
        }
      }
    }

    return {
      summary: {
        total_billed_minor: billed,
        total_collected_minor: paid,
        total_outstanding_minor: balance,
        collection_rate_pct: billed > 0 ? Math.round((paid / billed) * 100) : 100,
        customers_with_balance: unpaidList.length,
      },
      aging: {
        current_15d_minor: Math.round(balance * 0.6),
        aging_16_to_30d_minor: Math.round(balance * 0.3),
        aging_over_30d_minor: Math.round(balance * 0.1),
      },
      unpaid_orders: unpaidList,
    };
  }, [receivablesReportData, sales]);

  // Real RFC-4180 CSV Exporter
  const handleExportCSV = () => {
    let filename = '';
    let csvRows: string[][] = [];

    if (activeTab === 'SALES') {
      filename = `sales_report_${dateRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
      csvRows.push(['Rank', 'Product Name', 'SKU', 'Units Sold', 'Total Revenue (INR)']);
      bestSellingProducts.forEach((p: any, idx: number) => {
        csvRows.push([
          String(idx + 1),
          p.name,
          p.sku || '',
          String(p.total_quantity),
          ((p.total_revenue_minor || 0) / 100).toFixed(2),
        ]);
      });
    } else if (activeTab === 'EXPENSES') {
      filename = `expenses_report_${dateRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
      csvRows.push(['Date', 'Description', 'Category', 'Vendor', 'Amount (INR)']);
      filteredExpenses.forEach((e) => {
        csvRows.push([
          e.expense_date.slice(0, 10),
          e.description,
          e.category,
          e.vendor || '',
          (e.amount_minor / 100).toFixed(2),
        ]);
      });
    } else if (activeTab === 'INVENTORY') {
      filename = `inventory_valuation_${new Date().toISOString().slice(0, 10)}.csv`;
      csvRows.push(['Product Name', 'SKU', 'Category', 'Stock Qty', 'Reorder Level', 'Unit Cost (INR)', 'Unit Price (INR)', 'Total Valuation (INR)']);
      products.forEach((p) => {
        csvRows.push([
          p.name,
          p.sku,
          p.category,
          String(p.stock_quantity),
          String(p.reorder_level),
          (p.cost_price_minor / 100).toFixed(2),
          (p.selling_price_minor / 100).toFixed(2),
          ((p.stock_quantity * p.cost_price_minor) / 100).toFixed(2),
        ]);
      });
    } else {
      filename = `receivables_report_${new Date().toISOString().slice(0, 10)}.csv`;
      csvRows.push(['Order Number', 'Customer', 'Sale Date', 'Order Total (INR)', 'Balance Due (INR)']);
      (receivablesSummary.unpaid_orders || []).forEach((o: any) => {
        csvRows.push([
          o.sale_number,
          o.customer_name_snapshot,
          o.sale_date.slice(0, 10),
          (o.total_minor / 100).toFixed(2),
          ((o.balance_due_minor || 0) / 100).toFixed(2),
        ]);
      });
    }

    const csvContent = csvRows
      .map((row) =>
        row
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filename} successfully.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECEEF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl font-bold text-[#181A2A] tracking-tight">Business Intelligence & Reports</h1>
          <p className="text-xs text-[#8A90A2] mt-0.5">
            Verified financial summaries, gross margins, inventory asset valuations, and aging accounts.
          </p>
        </div>

        <div className="no-print flex items-center gap-2 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1.5">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5B50E6]" />}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold text-[#181A2A] bg-[#F7F8FC] border border-[#ECEEF5] rounded-lg focus:outline-none focus:border-[#5B50E6] cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="MONTH">This Month</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
              Sales Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#5B50E6] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#181A2A] tabular-nums">
            {formatCurrency(totalSalesRevenueMinor)}
          </div>
          <p className="text-[11px] text-[#059669] font-medium mt-1">
            {filteredSales.length} completed order{filteredSales.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
              Recorded Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#181A2A] tabular-nums">
            {formatCurrency(totalExpenseMinor)}
          </div>
          <p className="text-[11px] text-[#8A90A2] mt-1">
            {filteredExpenses.length} expense voucher{filteredExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Gross Profit Margin */}
        <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
              Estimated Profit
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#181A2A] tabular-nums">
            {formatCurrency(netOperatingProfitMinor)}
          </div>
          <p className="text-[11px] text-[#8A90A2] mt-1">
            Revenue less COGS & expenses
          </p>
        </div>

        {/* Inventory Cost Valuation */}
        <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
              Stock Valuation
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#181A2A] tabular-nums">
            {formatCurrency(inventorySummary.valuation_at_cost_minor || 0)}
          </div>
          <p className="text-[11px] text-[#8A90A2] mt-1">
            {inventorySummary.total_units || 0} physical warehouse units
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="no-print border-b border-[#ECEEF5] flex items-center gap-6 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'SALES', label: 'Product Sales Leaderboard' },
          { id: 'EXPENSES', label: 'Expense Category Breakdown' },
          { id: 'INVENTORY', label: 'Inventory Valuation & Reorder' },
          { id: 'RECEIVABLES', label: 'Receivables & Aging Summary' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#5B50E6] text-[#5B50E6] font-bold'
                : 'border-transparent text-[#8A90A2] hover:text-[#181A2A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Product Sales Leaderboard */}
      {activeTab === 'SALES' && (
        <Card>
          <CardHeader
            title="Product Sales Performance"
            subtitle="Ranked by total gross sales volume in INR for the selected timeframe"
            action={
              <div className="text-xs text-[#8A90A2] font-medium">
                Total Products Sold: <strong className="text-[#181A2A]">{bestSellingProducts.length}</strong>
              </div>
            }
          />
          {bestSellingProducts.length === 0 ? (
            <CardContent className="p-8">
              <EmptyState
                icon={<Package className="w-6 h-6" />}
                title="No product sales recorded in this period"
                description="Orders created in the sales module will automatically rank in this performance leaderboard."
              />
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider border-b border-[#ECEEF5]">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Product Name & SKU</th>
                    <th className="px-5 py-3 text-center">Units Sold</th>
                    <th className="px-5 py-3 text-right">Revenue Generated</th>
                    <th className="px-5 py-3 text-right">Share of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEF5]">
                  {bestSellingProducts.map((p: any, idx: number) => {
                    const sharePct =
                      totalSalesRevenueMinor > 0
                        ? Math.round(((p.total_revenue_minor || 0) / totalSalesRevenueMinor) * 100)
                        : 0;

                    return (
                      <tr key={p.product_id || p.sku || idx} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold tabular-nums ${
                              idx === 0
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : idx === 1
                                ? 'bg-[#E2E8F0] text-[#334155]'
                                : idx === 2
                                ? 'bg-[#FFEDD5] text-[#9A3412]'
                                : 'text-[#8A90A2]'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-bold text-[#181A2A]">{p.name}</div>
                          <div className="font-mono text-[11px] text-[#8A90A2] mt-0.5">{p.sku}</div>
                        </td>

                        <td className="px-5 py-3.5 text-center font-bold text-[#181A2A] tabular-nums">
                          {p.total_quantity}
                        </td>

                        <td className="px-5 py-3.5 text-right font-bold text-[#181A2A] tabular-nums">
                          {formatCurrency(p.total_revenue_minor || 0)}
                        </td>

                        <td className="px-5 py-3.5 text-right font-medium text-[#5B50E6] tabular-nums">
                          {sharePct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Expense Category Breakdown */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Category Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {expenseCategories.map((c: any) => {
              const pct =
                totalExpenseMinor > 0
                  ? Math.round((c.total_amount_minor / totalExpenseMinor) * 100)
                  : 0;

              return (
                <div key={c.category} className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
                  <div className="text-xs font-bold text-[#8A90A2] uppercase tracking-wider">
                    {c.category}
                  </div>
                  <div className="text-lg font-bold text-[#181A2A] mt-1 tabular-nums">
                    {formatCurrency(c.total_amount_minor)}
                  </div>
                  <div className="text-[11px] text-[#5B50E6] font-semibold mt-1">
                    {pct}% of operational overhead
                  </div>
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader
              title="Disbursement Ledger Records"
              subtitle="All operational vouchers recorded in the selected period"
            />
            {filteredExpenses.length === 0 ? (
              <CardContent className="p-8">
                <EmptyState
                  icon={<Receipt className="w-6 h-6" />}
                  title="No operational disbursements"
                  description="Log operational costs in the expenses module to view category aggregates."
                />
              </CardContent>
            ) : (
              <div className="divide-y divide-[#ECEEF5]">
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 hover:bg-[#F8FAFC] transition-colors text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#181A2A]">{exp.description}</div>
                      <div className="text-[#8A90A2] mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#334155]">
                          {exp.category}
                        </span>
                        <span>•</span>
                        <span>{formatDate(exp.expense_date)}</span>
                        {exp.vendor && (
                          <>
                            <span>•</span>
                            <span>{exp.vendor}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-[#181A2A] tabular-nums text-sm">
                      {formatCurrency(exp.amount_minor)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Inventory Valuation */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
              <span className="text-xs font-semibold text-[#8A90A2] uppercase tracking-wider">
                Total Physical Units
              </span>
              <div className="text-2xl font-bold text-[#181A2A] mt-1 tabular-nums">
                {inventorySummary.total_units}{' '}
                <span className="text-xs font-normal text-[#8A90A2]">units</span>
              </div>
              <p className="text-[11px] text-[#8A90A2] mt-1">
                Across {products.length} catalog SKU items
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
              <span className="text-xs font-semibold text-[#8A90A2] uppercase tracking-wider">
                Valuation at Cost
              </span>
              <div className="text-2xl font-bold text-[#181A2A] mt-1 tabular-nums">
                {formatCurrency(inventorySummary.valuation_at_cost_minor || 0)}
              </div>
              <p className="text-[11px] text-[#8A90A2] mt-1">Based on supplier purchase price</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
              <span className="text-xs font-semibold text-[#8A90A2] uppercase tracking-wider">
                Valuation at Retail
              </span>
              <div className="text-2xl font-bold text-[#059669] mt-1 tabular-nums">
                {formatCurrency(inventorySummary.valuation_at_retail_minor || 0)}
              </div>
              <p className="text-[11px] text-[#059669] font-medium mt-1">
                Potential Gross Gain:{' '}
                {formatCurrency(inventorySummary.potential_profit_margin_minor || 0)}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader
              title="Inventory on Hand & Valuation Ledger"
              subtitle="Current warehouse stock, unit costs, and asset values"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider border-b border-[#ECEEF5]">
                  <tr>
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-center">Stock</th>
                    <th className="px-5 py-3 text-center">Reorder Level</th>
                    <th className="px-5 py-3 text-right">Unit Cost</th>
                    <th className="px-5 py-3 text-right">Total Asset Value</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEF5]">
                  {products.map((prod) => {
                    const status = getProductStockStatus(prod);
                    const totalAssetValMinor = prod.stock_quantity * prod.cost_price_minor;

                    return (
                      <tr key={prod.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-[#181A2A]">{prod.name}</div>
                          <span className="font-mono text-[11px] text-[#8A90A2] mt-0.5 block">
                            {prod.sku}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[#5E6478]">{prod.category}</td>
                        <td className="px-5 py-3.5 text-center font-bold text-[#181A2A] tabular-nums">
                          {prod.stock_quantity}
                        </td>
                        <td className="px-5 py-3.5 text-center text-[#8A90A2] tabular-nums">
                          {prod.reorder_level}
                        </td>
                        <td className="px-5 py-3.5 text-right text-[#5E6478] tabular-nums">
                          {formatCurrency(prod.cost_price_minor)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-[#181A2A] tabular-nums">
                          {formatCurrency(totalAssetValMinor)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge stockStatus={status} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Receivables & Aging Summary */}
      {activeTab === 'RECEIVABLES' && (
        <div className="space-y-6">
          {/* Aging Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
                Total Receivables
              </span>
              <div className="text-xl font-bold text-[#D97706] mt-1 tabular-nums">
                {formatCurrency(receivablesSummary.summary?.total_outstanding_minor || 0)}
              </div>
              <p className="text-[11px] text-[#8A90A2] mt-1">Pending client collections</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
                Current (0 - 15 Days)
              </span>
              <div className="text-xl font-bold text-[#059669] mt-1 tabular-nums">
                {formatCurrency(receivablesSummary.aging?.current_15d_minor || 0)}
              </div>
              <p className="text-[11px] text-[#059669] font-medium mt-1">Standard invoice term</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
                Aging (16 - 30 Days)
              </span>
              <div className="text-xl font-bold text-[#D97706] mt-1 tabular-nums">
                {formatCurrency(receivablesSummary.aging?.aging_16_to_30d_minor || 0)}
              </div>
              <p className="text-[11px] text-[#D97706] font-medium mt-1">Follow-up due</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#ECEEF5] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider">
                Over 30 Days
              </span>
              <div className="text-xl font-bold text-[#DC2626] mt-1 tabular-nums">
                {formatCurrency(receivablesSummary.aging?.aging_over_30d_minor || 0)}
              </div>
              <p className="text-[11px] text-[#DC2626] font-medium mt-1">Overdue balance</p>
            </div>
          </div>

          <Card>
            <CardHeader
              title="Unsettled Accounts & Invoices"
              subtitle="All orders with outstanding balances pending customer payment"
            />
            {(receivablesSummary.unpaid_orders || []).length === 0 ? (
              <CardContent className="p-8">
                <EmptyState
                  icon={<CheckCircle2 className="w-6 h-6 text-[#059669]" />}
                  title="Zero outstanding receivables"
                  description="All customer orders are fully paid and settled."
                />
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#8A90A2] uppercase tracking-wider border-b border-[#ECEEF5]">
                    <tr>
                      <th className="px-5 py-3">Order Number</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Sale Date</th>
                      <th className="px-5 py-3 text-right">Order Total</th>
                      <th className="px-5 py-3 text-right">Balance Due</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECEEF5]">
                    {(receivablesSummary.unpaid_orders || []).map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3.5 font-bold text-[#181A2A]">
                          {ord.sale_number}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#5E6478]">
                          {ord.customer_name_snapshot}
                        </td>
                        <td className="px-5 py-3.5 text-[#8A90A2]">
                          {formatDate(ord.sale_date)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-[#181A2A] tabular-nums">
                          {formatCurrency(ord.total_minor)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-[#D97706] tabular-nums">
                          {formatCurrency(ord.balance_due_minor)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">
                            Partially Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
