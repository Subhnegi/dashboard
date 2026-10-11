import React, { useState } from 'react';
import {
  Download,
  Printer,
  TrendingUp,
  Receipt,
  Scale,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDate,
  getProductStockStatus,
} from '../../lib/formatters';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products, showToast } = useDemoData();
  const [activeTab, setActiveTab] = useState<'SALES' | 'EXPENSES' | 'INVENTORY'>('SALES');

  const confirmedSales = sales.filter((s) => s.status === 'CONFIRMED');
  const activeExpenses = expenses.filter((e) => !e.is_deleted);

  const totalSalesRevenueMinor = confirmedSales.reduce((acc, s) => acc + s.total_minor, 0);
  const totalExpenseMinor = activeExpenses.reduce((acc, e) => acc + e.amount_minor, 0);
  const netOperatingEstimateMinor = totalSalesRevenueMinor - totalExpenseMinor;

  // Best selling products calculation
  const productSalesMap: Record<string, { name: string; sku: string; qty: number; revenueMinor: number }> = {};
  for (const sale of confirmedSales) {
    for (const item of sale.items) {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          name: item.product_name_snapshot,
          sku: item.sku_snapshot,
          qty: 0,
          revenueMinor: 0,
        };
      }
      productSalesMap[item.product_id].qty += item.quantity;
      productSalesMap[item.product_id].revenueMinor += item.line_subtotal_minor;
    }
  }

  const bestSellingProducts = Object.values(productSalesMap).sort(
    (a, b) => b.revenueMinor - a.revenueMinor
  );

  // Inventory valuation totals
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const totalInventoryAssetValueMinor = products.reduce(
    (acc, p) => acc + p.stock_quantity * p.cost_price_minor,
    0
  );

  // Category expense breakdown
  const categoryExpenseMap: Record<string, number> = {};
  for (const exp of activeExpenses) {
    categoryExpenseMap[exp.category] = (categoryExpenseMap[exp.category] || 0) + exp.amount_minor;
  }
  const categoryExpenseList = Object.entries(categoryExpenseMap).sort((a, b) => b[1] - a[1]);

  const handleExportCSV = () => {
    showToast('Exported report summary as CSV file.', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial & Inventory Reports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated business performance derived from verified local transactions and stock ledgers.
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4 text-slate-500" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(totalSalesRevenueMinor)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              From {confirmedSales.length} confirmed sales
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Recorded Expenses
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(totalExpenseMinor)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              From {activeExpenses.length} operational vouchers
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition-colors bg-blue-50/20 border-blue-200/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                Operating Balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900 tabular-nums">
              {formatCurrency(netOperatingEstimateMinor)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Sales revenue less operational expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="no-print border-b border-slate-200 flex items-center gap-6 text-sm font-medium">
        {[
          { id: 'SALES', label: 'Best-Selling Products' },
          { id: 'EXPENSES', label: 'Expense Category Breakdown' },
          { id: 'INVENTORY', label: 'Inventory Valuation & Reorder' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'SALES' | 'EXPENSES' | 'INVENTORY')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Best Selling Products */}
      {activeTab === 'SALES' && (
        <Card>
          <CardHeader
            title="Product Sales Ranking"
            subtitle="Ranked by total gross sales volume in INR"
          />
          {bestSellingProducts.length === 0 ? (
            <CardContent className="p-6">
              <EmptyState
                icon={<Package className="w-5 h-5" />}
                title="No product sales recorded yet"
                description="Completed orders with line items will automatically populate the product sales leaderboard."
              />
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Product Name & SKU</th>
                    <th className="px-5 py-3 text-center">Units Sold</th>
                    <th className="px-5 py-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bestSellingProducts.map((p, idx) => (
                    <tr key={p.sku} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold tabular-nums ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">{p.sku}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-800 tabular-nums">
                        {p.qty}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(p.revenueMinor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Expenses Breakdown */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Category Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categoryExpenseList.map(([category, amountMinor]) => (
              <Card key={category} className="p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {category}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(amountMinor)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {totalExpenseMinor > 0
                    ? `${Math.round((amountMinor / totalExpenseMinor) * 100)}% of total`
                    : '0%'}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader
              title="Expense Ledger Records"
              subtitle="All operational disbursements currently contributing to overhead"
            />
            {activeExpenses.length === 0 ? (
              <CardContent className="p-6">
                <EmptyState
                  icon={<Receipt className="w-5 h-5" />}
                  title="No operational expenses"
                  description="Log operational costs in the expenses module to view category aggregates."
                />
              </CardContent>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-900">{exp.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
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
                    <div className="font-bold text-sm text-slate-900 tabular-nums">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Physical Units
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {totalStockUnits} <span className="text-sm font-normal text-slate-500">units</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Across {products.length} SKU catalog items</p>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Cost Asset Valuation
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatCurrency(totalInventoryAssetValueMinor)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Computed as (Stock Quantity × Unit Cost)</p>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Inventory on Hand & Valuation"
              subtitle="Current warehouse stock and replenishment triggers"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {products.map((prod) => {
                    const status = getProductStockStatus(prod);
                    const totalAssetValMinor = prod.stock_quantity * prod.cost_price_minor;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-900">{prod.name}</div>
                          <span className="block font-mono text-xs text-slate-400 mt-0.5">{prod.sku}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{prod.category}</td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-900 tabular-nums">
                          {prod.stock_quantity}
                        </td>
                        <td className="px-5 py-3.5 text-center text-xs text-slate-500 tabular-nums">
                          {prod.reorder_level}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-slate-600 tabular-nums">
                          {formatCurrency(prod.cost_price_minor)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 tabular-nums">
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
    </div>
  );
};

