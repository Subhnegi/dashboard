import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  SlidersHorizontal,
  ShoppingCart,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDateTime,
  getProductStockStatus,
} from '../../lib/formatters';

export const ProductDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, movements, adjustProductStock } = useDemoData();

  const product = products.find((p) => p.id === id);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('Stock received');
  const [note, setNote] = useState('');

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-[#64748B]">Product record not found.</p>
        <Link to="/products" className="text-xs font-semibold text-[#2563EB] mt-2 inline-block">
          Return to catalog
        </Link>
      </div>
    );
  }

  const status = getProductStockStatus(product);
  const unitProfitMinor = product.selling_price_minor - product.cost_price_minor;
  const marginPercent =
    product.selling_price_minor > 0
      ? ((unitProfitMinor / product.selling_price_minor) * 100).toFixed(1)
      : '0.0';

  const productMovements = movements.filter((m) => m.product_id === product.id);

  const handleApplyAdjustment = () => {
    if (delta === 0) return;
    adjustProductStock(product.id, delta, reason, note);
    setIsAdjustOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to products</span>
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">{product.name}</h1>
              <Badge stockStatus={status} size="sm" />
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#64748B] mt-0.5">
              <span className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#334155] text-[11px]">
                {product.sku}
              </span>
              <span>•</span>
              <span>Category: {product.category}</span>
            </div>
            {product.description && (
              <p className="text-xs text-[#64748B] mt-1.5 max-w-xl leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<SlidersHorizontal className="w-3 h-3" />}
            onClick={() => {
              setDelta(0);
              setIsAdjustOpen(true);
            }}
          >
            Adjust stock
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
            onClick={() => navigate('/sales/new')}
          >
            Create order
          </Button>
        </div>
      </div>

      {/* Financial & Stock Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Selling Price
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {formatCurrency(product.selling_price_minor)}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Catalog rate per unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Unit Cost
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {formatCurrency(product.cost_price_minor)}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Supplier acquisition cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Gross Margin
            </span>
            <div className="text-xl font-bold text-[#059669] mt-1 tabular-nums">{marginPercent}%</div>
            <p className="text-[11px] text-[#059669] font-medium mt-0.5 tabular-nums">
              +{formatCurrency(unitProfitMinor)} margin / unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Stock on Hand
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {product.stock_quantity}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Reorder threshold: {product.reorder_level} units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movements Audit Trail Table */}
      <Card>
        <CardHeader
          title="Stock Movement Ledger"
          subtitle="Audit log of inventory increments, customer order decrements, and adjustments"
        />
        <div className="overflow-x-auto">
          {productMovements.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B]">
              No stock movements recorded for this product yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Movement Type</th>
                  <th className="px-5 py-3 text-center">Delta</th>
                  <th className="px-5 py-3">Reason / Reference</th>
                  <th className="px-5 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {productMovements.map((mov) => {
                  const isPositive = mov.quantity_delta > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-[#64748B]">
                        {formatDateTime(mov.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[11px] text-[#334155] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] tabular-nums ${
                            isPositive
                              ? 'bg-[#ECFDF5] text-[#059669]'
                              : 'bg-[#FEF2F2] text-[#DC2626]'
                          }`}
                        >
                          {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#0F172A] font-medium">{mov.reason}</td>
                      <td className="px-5 py-3 text-[#64748B]">{mov.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Adjust Stock — ${product.name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyAdjustment} disabled={delta === 0}>
              Apply adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Current Inventory:</span>
            <span className="font-bold text-sm text-[#0F172A] tabular-nums">{product.stock_quantity} units</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Quantity Delta (+ / -)
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-[11px] text-[#64748B] mt-1">
              New resulting stock:{' '}
              <strong className="text-[#0F172A] tabular-nums">
                {Math.max(0, product.stock_quantity + delta)} units
              </strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Stock received">Stock received from supplier</option>
              <option value="Damaged/lost">Damaged / lost inventory</option>
              <option value="Manual correction">Manual cycle count correction</option>
              <option value="Opening balance">Opening balance reconciliation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Supplier PO or warehouse audit slip"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
