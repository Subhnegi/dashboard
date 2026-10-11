import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Package,
  Layers,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import { formatCurrency, getProductStockStatus } from '../../lib/formatters';
import type { Product, StockStatus } from '../../types';

export const ProductsListView: React.FC = () => {
  const navigate = useNavigate();
  const { products, adjustProductStock } = useDemoData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Adjust stock modal state
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Stock received');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || prod.category === selectedCategory;

    const status = getProductStockStatus(prod);
    const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdjustModal = (product: Product) => {
    setAdjustModalProduct(product);
    setAdjustmentDelta(0);
    setAdjustmentReason('Stock received');
    setAdjustmentNote('');
  };

  const handleConfirmAdjustment = () => {
    if (!adjustModalProduct || adjustmentDelta === 0) return;
    adjustProductStock(adjustModalProduct.id, adjustmentDelta, adjustmentReason, adjustmentNote);
    setAdjustModalProduct(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Search, Filters & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>

        {/* Category & Status Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/products/new')}
          >
            Add product
          </Button>
        </div>
      </div>

      {/* Products Table Card */}
      <Card>
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-5 h-5" />}
            title="No matching products found"
            description="Adjust your search criteria or create a new inventory item."
            actionLabel="Add new product"
            onAction={() => navigate('/products/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Product Name & SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Selling Price</th>
                  <th className="px-5 py-3 text-right">Cost Price</th>
                  <th className="px-5 py-3 text-center">Stock Level</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredProducts.map((prod) => {
                  const status: StockStatus = getProductStockStatus(prod);
                  return (
                    <tr key={prod.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3">
                        <Link
                          to={`/products/${prod.id}`}
                          className="font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors line-clamp-1"
                        >
                          {prod.name}
                        </Link>
                        <span className="font-mono text-[11px] text-[#64748B]">{prod.sku}</span>
                      </td>

                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#334155] px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
                          <Layers className="w-3 h-3 text-[#64748B]" />
                          {prod.category}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                        {formatCurrency(prod.selling_price_minor)}
                      </td>

                      <td className="px-5 py-3 text-right text-[#64748B] tabular-nums">
                        {formatCurrency(prod.cost_price_minor)}
                      </td>

                      <td className="px-5 py-3 text-center">
                        <div className="font-bold text-[#0F172A] tabular-nums">{prod.stock_quantity}</div>
                        <span className="text-[10px] text-[#94A3B8]">Reorder at {prod.reorder_level}</span>
                      </td>

                      <td className="px-5 py-3">
                        <Badge stockStatus={status} size="sm" />
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(prod)}
                            className="px-2 py-1 text-xs font-medium text-[#475569] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors cursor-pointer"
                            title="Adjust inventory quantity"
                          >
                            Adjust
                          </button>
                          <Link
                            to={`/products/${prod.id}`}
                            className="px-2 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Adjust Stock Modal */}
      {adjustModalProduct && (
        <Modal
          isOpen={!!adjustModalProduct}
          onClose={() => setAdjustModalProduct(null)}
          title={`Adjust Stock — ${adjustModalProduct.name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setAdjustModalProduct(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAdjustment}
                disabled={adjustmentDelta === 0}
              >
                Apply adjustment
              </Button>
            </>
          }
        >
          <div className="space-y-3.5">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Current Available Stock:</span>
              <span className="font-bold text-sm text-[#0F172A] tabular-nums">
                {adjustModalProduct.stock_quantity} units
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Adjustment Quantity Delta (+ for received, - for loss)
              </label>
              <input
                type="number"
                value={adjustmentDelta}
                onChange={(e) => setAdjustmentDelta(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. 10 or -2"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                New resulting stock:{' '}
                <strong className="text-[#0F172A] tabular-nums">
                  {Math.max(0, adjustModalProduct.stock_quantity + adjustmentDelta)} units
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Adjustment Reason
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Stock received">Stock received from supplier</option>
                <option value="Damaged/lost">Damaged / lost inventory</option>
                <option value="Manual correction">Manual cycle count correction</option>
                <option value="Opening balance">Opening balance reconciliation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Reference / Note (optional)
              </label>
              <input
                type="text"
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="e.g. Supplier PO or warehouse audit slip"
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
