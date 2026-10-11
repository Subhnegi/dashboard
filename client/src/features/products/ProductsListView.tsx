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
    <div className="space-y-6">
      {/* Top Controls: Search, Filters & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5E7EB]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 focus:border-[#5546D7] transition-all"
          />
        </div>

        {/* Category & Status Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#344054] bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
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
            className="px-3 py-2 text-xs font-medium text-[#344054] bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
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
            icon={<Package className="w-6 h-6" />}
            title="No matching products found"
            description="Try clearing your search query or filters, or create a new inventory item."
            actionLabel="Add new product"
            onAction={() => navigate('/products/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Product Name & SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Selling Price</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-center">Stock on Hand</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredProducts.map((prod) => {
                  const status: StockStatus = getProductStockStatus(prod);
                  return (
                    <tr key={prod.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/products/${prod.id}`}
                          className="font-semibold text-[#172033] hover:text-[#5546D7] transition-colors line-clamp-1"
                        >
                          {prod.name}
                        </Link>
                        <span className="font-mono text-xs text-[#667085]">{prod.sku}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#344054] px-2 py-0.5 rounded-md bg-[#F2F4F7]">
                          <Layers className="w-3 h-3 text-[#667085]" />
                          {prod.category}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-[#172033]">
                        {formatCurrency(prod.selling_price_minor)}
                      </td>

                      <td className="px-5 py-3.5 text-right text-xs text-[#667085]">
                        {formatCurrency(prod.cost_price_minor)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="font-bold text-[#172033]">{prod.stock_quantity}</div>
                        <span className="text-[10px] text-[#98A2B3]">Reorder at {prod.reorder_level}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge stockStatus={status} size="sm" />
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(prod)}
                            className="px-2 py-1 text-xs font-medium text-[#344054] hover:text-[#5546D7] hover:bg-[#EEECFB] rounded-md transition-colors"
                            title="Adjust inventory level"
                          >
                            Adjust stock
                          </button>
                          <Link
                            to={`/products/${prod.id}`}
                            className="px-2 py-1 text-xs font-semibold text-[#5546D7] hover:bg-[#EEECFB] rounded-md transition-colors"
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
          <div className="space-y-4">
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
              <span className="text-[#667085]">Current Stock Quantity:</span>
              <span className="font-bold text-sm text-[#172033]">
                {adjustModalProduct.stock_quantity} units
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Adjustment Quantity Delta (+ for incoming, - for reduction)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
                  placeholder="e.g. 10 or -2"
                />
              </div>
              <p className="text-[11px] text-[#667085] mt-1">
                New resulting stock:{' '}
                <strong className="text-[#172033]">
                  {Math.max(0, adjustModalProduct.stock_quantity + adjustmentDelta)} units
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Reason for Adjustment
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
              >
                <option value="Stock received">Stock received from supplier</option>
                <option value="Damaged/lost">Damaged / lost inventory</option>
                <option value="Manual correction">Manual cycle count correction</option>
                <option value="Opening balance">Opening balance reconciliation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Note / Reference (optional)
              </label>
              <input
                type="text"
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="e.g. PO-8921 supplier invoice or warehouse audit"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
