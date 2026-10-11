import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  SlidersHorizontal,
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
        <p className="text-sm text-[#667085]">Product not found.</p>
        <Link to="/products" className="text-xs font-semibold text-[#5546D7] mt-2 inline-block">
          Return to products
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
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to products</span>
        </Link>
      </div>

      {/* Product Hero Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EEECFB] text-[#5546D7] flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-[#172033] tracking-tight">{product.name}</h2>
              <Badge stockStatus={status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-[#667085] mt-1">
              <span className="font-mono bg-[#F2F4F7] px-2 py-0.5 rounded text-[#344054]">
                SKU: {product.sku}
              </span>
              <span>•</span>
              <span>Category: {product.category}</span>
            </div>
            {product.description && (
              <p className="text-xs text-[#667085] mt-2 max-w-xl">{product.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
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
            onClick={() => navigate('/sales/new')}
          >
            Sell product
          </Button>
        </div>
      </div>

      {/* Metrics Row: Pricing, Cost, Margin, Stock Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Selling Price
            </span>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {formatCurrency(product.selling_price_minor)}
            </div>
            <p className="text-xs text-[#667085] mt-1">Per unit catalog rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Unit Cost
            </span>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {formatCurrency(product.cost_price_minor)}
            </div>
            <p className="text-xs text-[#667085] mt-1">Supplier purchase cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Gross Margin
            </span>
            <div className="text-2xl font-bold text-[#027A48] mt-2">{marginPercent}%</div>
            <p className="text-xs text-[#027A48] mt-1">
              +{formatCurrency(unitProfitMinor)} margin per unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Stock on Hand
            </span>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {product.stock_quantity} units
            </div>
            <p className="text-xs text-[#667085] mt-1">
              Reorder threshold: {product.reorder_level} units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Movements Audit Trail */}
      <Card>
        <CardHeader
          title="Stock Movement History"
          subtitle="Complete audit trail of stock adjustments and sales orders"
        />
        <div className="overflow-x-auto">
          {productMovements.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#667085]">
              No stock movements recorded for this product yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Movement Type</th>
                  <th className="px-5 py-3 text-center">Delta</th>
                  <th className="px-5 py-3">Reason / Reference</th>
                  <th className="px-5 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {productMovements.map((mov) => {
                  const isPositive = mov.quantity_delta > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3 text-xs text-[#667085]">
                        {formatDateTime(mov.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-[#344054]">
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isPositive
                              ? 'bg-[#ECFDF3] text-[#027A48]'
                              : 'bg-[#FEF3F2] text-[#B42318]'
                          }`}
                        >
                          {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#172033]">{mov.reason}</td>
                      <td className="px-5 py-3 text-xs text-[#667085]">{mov.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Adjust Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Adjust Stock — ${product.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApplyAdjustment} disabled={delta === 0}>
              Apply adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
            <span className="text-[#667085]">Current Stock:</span>
            <span className="font-bold text-sm text-[#172033]">{product.stock_quantity} units</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Quantity Delta (+ / -)
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
            />
            <p className="text-[11px] text-[#667085] mt-1">
              Resulting Stock:{' '}
              <strong className="text-[#172033]">
                {Math.max(0, product.stock_quantity + delta)} units
              </strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
            >
              <option value="Stock received">Stock received</option>
              <option value="Damaged/lost">Damaged / lost</option>
              <option value="Manual correction">Manual cycle correction</option>
              <option value="Opening balance">Opening balance reconciliation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Audit note or PO ref"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
