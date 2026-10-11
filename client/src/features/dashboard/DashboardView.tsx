import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  DollarSign,
  Receipt,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Plus,
  Scale,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDate,
  getProductStockStatus,
  getSalePaymentStatus,
} from '../../lib/formatters';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { sales, expenses, products, settings } = useDemoData();
  const [dateFilter, setDateFilter] = useState<'30d' | '7d' | 'today'>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; amount: number; count: number } | null>(null);

  // Compute cutoff timestamp based on selected date filter
  const filterCutoff = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return todayStart.getTime();
    }
    if (dateFilter === '7d') {
      return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }
    // 30d default
    return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  }, [dateFilter]);

  // Filter sales and expenses by date cutoff
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleTime = new Date(s.sale_date).getTime();
      return s.status === 'CONFIRMED' && saleTime >= filterCutoff;
    });
  }, [sales, filterCutoff]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expTime = new Date(e.expense_date).getTime();
      return !e.is_deleted && expTime >= filterCutoff;
    });
  }, [expenses, filterCutoff]);

  // Core financial metrics calculated from real filtered transactions
  const totalSalesMinor = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.total_minor, 0);
  }, [filteredSales]);

  const totalExpensesMinor = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount_minor, 0);
  }, [filteredExpenses]);

  // Explicit calculation: Gross sales revenue minus recorded expenses
  const netOperatingBalanceMinor = totalSalesMinor - totalExpensesMinor;

  // Real Dynamic Chart Data aggregation from actual filtered sales
  const chartSeries = useMemo(() => {
    const bucketsCount = dateFilter === 'today' ? 4 : dateFilter === '7d' ? 7 : 6;
    const now = new Date().getTime();
    const rangeSpan = now - filterCutoff;
    const bucketInterval = rangeSpan / bucketsCount;

    const buckets = Array.from({ length: bucketsCount }, (_, i) => {
      const bucketStart = filterCutoff + i * bucketInterval;
      const bucketEnd = filterCutoff + (i + 1) * bucketInterval;

      let label = '';
      if (dateFilter === 'today') {
        const h = new Date(bucketStart).getHours();
        label = `${h}:00`;
      } else if (dateFilter === '7d') {
        label = new Date(bucketStart).toLocaleDateString('en-IN', { weekday: 'short' });
      } else {
        const dStart = new Date(bucketStart).getDate();
        const dEnd = new Date(bucketEnd).getDate();
        const m = new Date(bucketEnd).toLocaleDateString('en-IN', { month: 'short' });
        label = `${dStart}-${dEnd} ${m}`;
      }

      // Sum all real sales falling into this interval
      const bucketSales = filteredSales.filter((s) => {
        const t = new Date(s.sale_date).getTime();
        return t >= bucketStart && t <= bucketEnd;
      });

      const totalMinor = bucketSales.reduce((acc, s) => acc + s.total_minor, 0);

      return {
        label,
        amountMinor: totalMinor,
        count: bucketSales.length,
      };
    });

    return buckets;
  }, [dateFilter, filterCutoff, filteredSales]);

  // Max value for chart vertical scaling
  const maxChartMinor = useMemo(() => {
    const maxVal = Math.max(...chartSeries.map((b) => b.amountMinor), 100000);
    return Math.ceil(maxVal * 1.15);
  }, [chartSeries]);

  // Inventory attention: Products at or below reorder threshold
  const alertProducts = useMemo(() => {
    return products.filter((p) => {
      const status = getProductStockStatus(p);
      return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK';
    });
  }, [products]);

  // Recent 5 sales
  const recentSales = useMemo(() => {
    return [...sales]
      .filter((s) => s.status === 'CONFIRMED')
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-5">
      {/* Overview Top Header & Date Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">
              {settings.business_name}
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
              Operational Suite
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time sales performance, inventory valuation, and recent transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Range Control */}
          <div className="inline-flex p-0.5 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#475569]">
            {(['today', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1 rounded-md transition-all text-xs cursor-pointer ${
                  dateFilter === range
                    ? 'bg-white text-[#0F172A] font-semibold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/sales/new')}
          >
            Create sale
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Sales Revenue */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Sales Revenue
              </span>
              <div className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#DBEAFE]">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-[#0F172A] tracking-tight tabular-nums">
                {formatCurrency(totalSalesMinor)}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {filteredSales.length} order{filteredSales.length === 1 ? '' : 's'} in selected period
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Operating Expenses */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Recorded Expenses
              </span>
              <div className="w-7 h-7 rounded-md bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center border border-[#FECACA]">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-[#0F172A] tracking-tight tabular-nums">
                {formatCurrency(totalExpensesMinor)}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Across {filteredExpenses.length} active voucher{filteredExpenses.length === 1 ? '' : 's'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Net Operating Balance */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Net Operating Balance
              </span>
              <div className="w-7 h-7 rounded-md bg-[#F1F5F9] text-[#334155] flex items-center justify-center border border-[#E2E8F0]">
                <Scale className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div
                className={`text-xl font-bold tracking-tight tabular-nums ${
                  netOperatingBalanceMinor >= 0 ? 'text-[#059669]' : 'text-[#D97706]'
                }`}
              >
                {formatCurrency(netOperatingBalanceMinor)}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Revenue minus recorded expenses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Orders Completed */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Orders Completed
              </span>
              <div className="w-7 h-7 rounded-md bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center border border-[#BBF7D0]">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-[#0F172A] tracking-tight tabular-nums">
                {filteredSales.length}
              </div>
              <p className="text-[11px] text-[#16A34A] font-medium mt-0.5">
                100% fulfillment rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Attention Alert (if low or out of stock items exist) */}
      {alertProducts.length > 0 && (
        <div className="px-4 py-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <div className="text-xs text-[#92400E]">
              <span className="font-semibold">
                {alertProducts.length} product{alertProducts.length > 1 ? 's' : ''} require inventory attention:{' '}
              </span>
              <span>
                {alertProducts.map((p) => `${p.name} (${p.stock_quantity} in stock)`).join(' • ')}
              </span>
            </div>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309] hover:text-[#92400E] shrink-0 hover:underline"
          >
            <span>Manage inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Real Revenue Chart + Transactions and Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Real Revenue Activity Chart & Recent Transactions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Revenue Chart with Dynamic Data */}
          <Card>
            <CardHeader
              title="Sales & Revenue Activity"
              subtitle={`Real transactions aggregated by period (${
                dateFilter === 'today' ? 'Today' : dateFilter === '7d' ? 'Last 7 Days' : 'Last 30 Days'
              })`}
              action={
                <div className="text-right">
                  <span className="text-xs font-bold text-[#0F172A] tabular-nums block">
                    {formatCurrency(totalSalesMinor)}
                  </span>
                  <span className="text-[10px] text-[#64748B]">Period Revenue</span>
                </div>
              }
            />
            <CardContent className="pt-3 pb-4">
              {/* Interactive SVG Bar & Trend Chart */}
              <div className="relative h-44 w-full flex items-end gap-2.5 sm:gap-4 pt-6 px-1">
                {chartSeries.map((bucket, idx) => {
                  const heightPercent =
                    maxChartMinor > 0 ? Math.min(100, Math.max(6, (bucket.amountMinor / maxChartMinor) * 100)) : 6;
                  const isHovered = hoveredPoint?.label === bucket.label;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() =>
                        setHoveredPoint({
                          label: bucket.label,
                          amount: bucket.amountMinor,
                          count: bucket.count,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-11 z-20 px-2 py-1 bg-[#0F172A] text-white rounded text-[10px] font-medium shadow-md whitespace-nowrap pointer-events-none animate-in fade-in duration-100">
                          <span className="font-semibold">{formatCurrency(bucket.amountMinor)}</span>
                          <span className="text-slate-400 block text-[9px]">
                            {bucket.count} order{bucket.count === 1 ? '' : 's'}
                          </span>
                        </div>
                      )}

                      {/* Bar Container */}
                      <div className="w-full bg-[#F1F5F9] rounded-t h-full flex items-end overflow-hidden group-hover:bg-[#E2E8F0] transition-colors">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all duration-300 ${
                            bucket.amountMinor > 0
                              ? 'bg-[#2563EB] group-hover:bg-[#1D4ED8]'
                              : 'bg-slate-300'
                          }`}
                        />
                      </div>

                      {/* Axis Label */}
                      <span className="text-[10px] font-medium text-[#64748B] whitespace-nowrap">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend / Footer */}
              <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
                    <span>Completed Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#F1F5F9] border border-[#CBD5E1]" />
                    <span>Zero Transaction Interval</span>
                  </div>
                </div>
                <Link to="/reports" className="text-[#2563EB] font-medium hover:underline">
                  Full analytics →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions Table */}
          <Card>
            <CardHeader
              title="Recent Transactions"
              subtitle="Latest sales orders and settlement status"
              action={
                <Link
                  to="/sales"
                  className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                >
                  View all orders <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {recentSales.map((sale) => {
                    const payStatus = getSalePaymentStatus(sale);
                    return (
                      <tr key={sale.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3 font-semibold text-[#0F172A]">
                          <Link to={`/sales/${sale.id}`} className="hover:text-[#2563EB]">
                            {sale.sale_number}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-[#334155] font-medium">
                          {sale.customer_name_snapshot}
                        </td>
                        <td className="px-5 py-3 text-[#64748B]">
                          {formatDate(sale.sale_date)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                          {formatCurrency(sale.total_minor)}
                        </td>
                        <td className="px-5 py-3">
                          <Badge paymentStatus={payStatus} size="sm" />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            to={`/invoices/${sale.id}`}
                            className="text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Inventory Status & Quick Profile */}
        <div className="space-y-5">
          {/* Inventory Health List */}
          <Card>
            <CardHeader
              title="Inventory Levels"
              subtitle="Stock status across catalog items"
              action={
                <Link to="/products" className="text-xs font-medium text-[#2563EB] hover:underline">
                  Manage
                </Link>
              }
            />
            <CardContent className="space-y-3 p-4">
              <div className="space-y-2.5">
                {products.slice(0, 5).map((prod) => {
                  const status = getProductStockStatus(prod);
                  return (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#0F172A] line-clamp-1">
                            {prod.name}
                          </p>
                          <p className="text-[10px] font-mono text-[#64748B]">{prod.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#0F172A] tabular-nums">
                          {prod.stock_quantity}
                        </div>
                        <Badge stockStatus={status} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#E2E8F0]">
                <Link
                  to="/products/new"
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] rounded-md hover:bg-[#DBEAFE] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add product</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Settings Summary */}
          <Card>
            <CardHeader title="Operating Workspace" />
            <CardContent className="p-4 space-y-2.5 text-xs text-[#334155]">
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Business</span>
                <span className="font-semibold text-[#0F172A]">{settings.business_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Currency</span>
                <span className="font-semibold text-[#0F172A]">INR (₹)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Tax Policy</span>
                <span className="font-semibold text-[#0F172A]">
                  {settings.default_tax_rate_basis_points / 100}% GST
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Invoice Prefix</span>
                <span className="font-mono text-[#0F172A]">{settings.invoice_prefix}</span>
              </div>

              <div className="pt-2">
                <Link
                  to="/settings"
                  className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  Configure business parameters <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
