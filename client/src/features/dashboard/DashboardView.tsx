import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
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

  // Filter valid confirmed sales
  const confirmedSales = sales.filter((s) => s.status === 'CONFIRMED');

  // Total sales revenue in minor units (paise)
  const totalSalesMinor = confirmedSales.reduce((acc, s) => acc + s.total_minor, 0);

  // Total active expenses
  const totalExpensesMinor = expenses
    .filter((e) => !e.is_deleted)
    .reduce((acc, e) => acc + e.amount_minor, 0);

  // Gross profit estimate (Sales Total minus Expenses)
  const estimatedProfitMinor = totalSalesMinor - totalExpensesMinor;

  // Low or out of stock products
  const alertProducts = products.filter((p) => {
    const status = getProductStockStatus(p);
    return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK';
  });

  // Recent 5 sales
  const recentSales = [...confirmedSales].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              {settings.business_name}
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#EEECFB] text-[#5546D7]">
              Active Workspace
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Real-time business performance, inventory status, and recent transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex p-1 bg-[#F2F4F7] rounded-xl text-xs font-medium text-[#344054]">
            {(['today', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === range
                    ? 'bg-white text-[#172033] font-semibold shadow-xs'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/sales/new')}
          >
            Create sale
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales KPI */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#ECFDF3] text-[#027A48] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#172033] tracking-tight">
                {formatCurrency(totalSalesMinor)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#027A48] mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14.2% vs previous period</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses KPI */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Operating Expenses
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] text-[#B42318] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#172033] tracking-tight">
                {formatCurrency(totalExpensesMinor)}
              </div>
              <div className="text-xs text-[#667085] mt-1">
                Across 6 expense categories
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Profit KPI */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Net Operating Balance
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#EEECFB] text-[#5546D7] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#172033] tracking-tight">
                {formatCurrency(estimatedProfitMinor)}
              </div>
              <div className="text-xs text-[#667085] mt-1">
                Revenue minus recorded expenses
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Count KPI */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Orders Completed
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#175CD3] flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#172033] tracking-tight">
                {confirmedSales.length}
              </div>
              <div className="text-xs text-[#12B76A] mt-1">
                100% fulfillment rate
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Warning Banner if items need attention */}
      {alertProducts.length > 0 && (
        <div className="p-4 rounded-xl bg-[#FEF0C7]/60 border border-[#FEDF89] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F79009] text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#B54708]">
                {alertProducts.length} product{alertProducts.length > 1 ? 's' : ''} require inventory attention
              </p>
              <p className="text-xs text-[#B54708]/80">
                {alertProducts.map((p) => `${p.name} (${p.stock_quantity} left)`).join(', ')}
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#B54708] bg-white border border-[#FEDF89] rounded-lg hover:bg-[#FEF0C7] transition-colors shrink-0 shadow-2xs"
          >
            <span>Review inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Revenue & Top Categories + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Activity & Category Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Sales & Revenue Activity"
              subtitle="Daily transaction totals over the last 30 days"
              action={
                <Link
                  to="/reports"
                  className="text-xs font-medium text-[#5546D7] hover:underline flex items-center gap-1"
                >
                  View full reports <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent>
              {/* CSS/SVG Bar Chart of Recent Sales */}
              <div className="h-48 w-full flex items-end gap-3 pt-6 pb-2 px-2">
                {[
                  { day: 'Day 1-5', amount: 1250000, label: '₹12.5k' },
                  { day: 'Day 6-10', amount: 480000, label: '₹4.8k' },
                  { day: 'Day 11-15', amount: 890000, label: '₹8.9k' },
                  { day: 'Day 16-20', amount: 620000, label: '₹6.2k' },
                  { day: 'Day 21-25', amount: 1749800, label: '₹17.5k' },
                  { day: 'Day 26-30', amount: 795000, label: '₹7.9k' },
                ].map((bar, idx) => {
                  const maxAmount = 2000000;
                  const heightPercent = Math.min(100, (bar.amount / maxAmount) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-medium text-[#667085] opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.label}
                      </div>
                      <div className="w-full bg-[#EEECFB] rounded-t-md h-full flex items-end overflow-hidden">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-[#5546D7] rounded-t-md transition-all group-hover:bg-[#4739BE]"
                        />
                      </div>
                      <span className="text-[11px] text-[#667085] whitespace-nowrap">{bar.day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders Table */}
          <Card>
            <CardHeader
              title="Recent Transactions"
              subtitle="Latest sales generated in this workspace"
              action={
                <Link
                  to="/sales"
                  className="text-xs font-medium text-[#5546D7] hover:underline flex items-center gap-1"
                >
                  View all sales <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {recentSales.map((sale) => {
                    const payStatus = getSalePaymentStatus(sale);
                    return (
                      <tr key={sale.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-[#172033]">
                          <Link to={`/sales/${sale.id}`} className="hover:text-[#5546D7]">
                            {sale.sale_number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-[#344054]">{sale.customer_name_snapshot}</td>
                        <td className="px-5 py-3.5 text-xs text-[#667085]">{formatDate(sale.sale_date)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-[#172033]">
                          {formatCurrency(sale.total_minor)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge paymentStatus={payStatus} size="sm" />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/invoices/${sale.id}`}
                            className="text-xs font-semibold text-[#5546D7] hover:underline"
                          >
                            Invoice
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

        {/* Right Col: Top Inventory & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Inventory Health Card */}
          <Card>
            <CardHeader
              title="Inventory Health"
              subtitle="Stock status across catalog items"
              action={
                <Link to="/products" className="text-xs text-[#5546D7] hover:underline">
                  Manage
                </Link>
              }
            />
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {products.slice(0, 5).map((prod) => {
                  const status = getProductStockStatus(prod);
                  return (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#F2F4F7] text-[#5546D7] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#172033] line-clamp-1">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-[#667085]">{prod.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#172033]">
                          {prod.stock_quantity} in stock
                        </div>
                        <Badge stockStatus={status} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#E5E7EB]">
                <Link
                  to="/products/new"
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#5546D7] bg-[#EEECFB] rounded-lg hover:bg-[#E2DEFB] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add new product</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Business Info / Invoicing Details */}
          <Card>
            <CardHeader title="Demo Business Profile" />
            <CardContent className="space-y-3 text-xs text-[#344054]">
              <div className="flex justify-between py-1 border-b border-[#F2F4F7]">
                <span className="text-[#667085]">Company</span>
                <span className="font-semibold text-[#172033]">{settings.business_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F4F7]">
                <span className="text-[#667085]">Currency</span>
                <span className="font-semibold text-[#172033]">INR (₹)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F4F7]">
                <span className="text-[#667085]">Default Tax</span>
                <span className="font-semibold text-[#172033]">
                  {settings.default_tax_rate_basis_points / 100}% GST
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F4F7]">
                <span className="text-[#667085]">Invoice Prefix</span>
                <span className="font-mono font-medium text-[#172033]">{settings.invoice_prefix}</span>
              </div>

              <div className="pt-2">
                <Link
                  to="/settings"
                  className="text-xs font-semibold text-[#5546D7] hover:underline flex items-center gap-1"
                >
                  Edit business preferences <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
