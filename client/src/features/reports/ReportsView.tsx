import React, { useState } from 'react';
import {
  Download,
  Printer,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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

  const handleExportCSV = () => {
    showToast('Exported report data as CSV file.', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB]">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Financial & Inventory Reports</h2>
          <p className="text-xs text-[#667085] mt-1">
            Aggregated business performance based on persisted transaction records.
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
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
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {formatCurrency(totalSalesRevenueMinor)}
            </div>
            <p className="text-xs text-[#027A48] mt-1">From {confirmedSales.length} confirmed sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Recorded Expenses
            </span>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {formatCurrency(totalExpenseMinor)}
            </div>
            <p className="text-xs text-[#667085] mt-1">From {activeExpenses.length} operating vouchers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Estimated Net Operating
            </span>
            <div className="text-2xl font-bold text-[#5546D7] mt-2">
              {formatCurrency(netOperatingEstimateMinor)}
            </div>
            <p className="text-xs text-[#5546D7] mt-1">Sales revenue less operational expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="no-print border-b border-[#E5E7EB] flex items-center gap-4 text-sm font-medium">
        {[
          { id: 'SALES', label: 'Best-Selling Products' },
          { id: 'EXPENSES', label: 'Expense Category Breakdown' },
          { id: 'INVENTORY', label: 'Inventory Valuation & Reorder' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-[#5546D7] text-[#5546D7] font-semibold'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Product Name & SKU</th>
                  <th className="px-5 py-3 text-center">Units Sold</th>
                  <th className="px-5 py-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {bestSellingProducts.map((p, idx) => (
                  <tr key={p.sku} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3.5 font-bold text-[#98A2B3]">#{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#172033]">{p.name}</div>
                      <div className="font-mono text-xs text-[#667085]">{p.sku}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-[#172033]">{p.qty}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#172033]">
                      {formatCurrency(p.revenueMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Expenses Breakdown */}
      {activeTab === 'EXPENSES' && (
        <Card>
          <CardHeader
            title="Expenses by Category"
            subtitle="Operational breakdown across active expense categories"
          />
          <div className="p-5 space-y-4">
            {activeExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB]"
              >
                <div>
                  <div className="font-semibold text-sm text-[#172033]">{exp.description}</div>
                  <div className="text-xs text-[#667085]">
                    {exp.category} • {formatDate(exp.expense_date)}{' '}
                    {exp.vendor ? `• ${exp.vendor}` : ''}
                  </div>
                </div>
                <div className="font-bold text-sm text-[#172033]">
                  {formatCurrency(exp.amount_minor)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Inventory Valuation */}
      {activeTab === 'INVENTORY' && (
        <Card>
          <CardHeader
            title="Inventory on Hand & Valuation"
            subtitle="Current warehouse stock and replenishment triggers"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
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
              <tbody className="divide-y divide-[#E5E7EB]">
                {products.map((prod) => {
                  const status = getProductStockStatus(prod);
                  const totalAssetValMinor = prod.stock_quantity * prod.cost_price_minor;

                  return (
                    <tr key={prod.id} className="hover:bg-[#F9FAFB]">
                      <td className="px-5 py-3.5 font-medium text-[#172033]">
                        {prod.name}
                        <span className="block font-mono text-xs text-[#667085]">{prod.sku}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#667085]">{prod.category}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-[#172033]">
                        {prod.stock_quantity}
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs text-[#667085]">
                        {prod.reorder_level}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-[#667085]">
                        {formatCurrency(prod.cost_price_minor)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-[#172033]">
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
      )}
    </div>
  );
};
