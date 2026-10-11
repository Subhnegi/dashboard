import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
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
  const { products, adjustProductStock, deactivateProduct, updateProduct } = useDemoData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<
    'name_asc' | 'name_desc' | 'stock_desc' | 'stock_asc' | 'price_desc' | 'price_asc'
  >('name_asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Adjust stock modal state
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Stock received');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');

  // Deactivate confirmation modal
  const [deactivatingProduct, setDeactivatingProduct] = useState<Product | null>(null);

  // Extract unique categories
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  // Filter & sort products
  const filteredAndSortedProducts = useMemo(() => {
    const list = products.filter((prod) => {
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'ALL' || prod.category === selectedCategory;

      const status = getProductStockStatus(prod);
      const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'stock_desc':
          return b.stock_quantity - a.stock_quantity;
        case 'stock_asc':
          return a.stock_quantity - b.stock_quantity;
        case 'price_desc':
          return b.selling_price_minor - a.selling_price_minor;
        case 'price_asc':
          return a.selling_price_minor - b.selling_price_minor;
        default:
          return 0;
      }
    });

    return list;
  }, [products, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, validCurrentPage, itemsPerPage]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSortBy('name_asc');
    setCurrentPage(1);
  };

  const handleOpenAdjustModal = (product: Product) => {
    setAdjustModalProduct(product);
    setAdjustmentDelta(0);
    setAdjustmentReason('Stock received');
    setAdjustmentNote('');
  };

  const handleConfirmAdjustment = async () => {
    if (!adjustModalProduct || adjustmentDelta === 0) return;
    await adjustProductStock(adjustModalProduct.id, adjustmentDelta, adjustmentReason, adjustmentNote);
    setAdjustModalProduct(null);
  };

  const handleToggleActive = async (product: Product) => {
    if (product.is_active) {
      await deactivateProduct(product.id);
    } else {
      await updateProduct(product.id, { is_active: true });
    }
    setDeactivatingProduct(null);
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="name_asc">Sort: Name (A → Z)</option>
            <option value="name_desc">Sort: Name (Z → A)</option>
            <option value="stock_desc">Sort: Stock (High → Low)</option>
            <option value="stock_asc">Sort: Stock (Low → High)</option>
            <option value="price_desc">Sort: Price (High → Low)</option>
            <option value="price_asc">Sort: Price (Low → High)</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

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
        {filteredAndSortedProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-5 h-5" />}
            title="No matching products found"
            description="Adjust your search criteria, reset active filters, or add a new catalog item."
            actionLabel="Add new product"
            onAction={() => navigate('/products/new')}
          />
        ) : (
          <div>
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
                  {paginatedProducts.map((prod) => {
                    const status: StockStatus = getProductStockStatus(prod);
                    return (
                      <tr key={prod.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3">
                          <Link
                            to={`/products/${prod.id}`}
                            className="font-semibold text-[#0F172A] hover:text-[#5B50E6] transition-colors line-clamp-1"
                          >
                            {prod.name}
                          </Link>
                          <span className="font-mono text-[11px] text-[#64748B]">{prod.sku}</span>
                        </td>

                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#334155] px-2 py-0.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
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
                              className="px-2 py-1 text-xs font-medium text-[#475569] hover:text-[#5B50E6] hover:bg-[#EEF2FF] rounded-lg transition-colors cursor-pointer"
                              title="Adjust inventory quantity"
                            >
                              Adjust
                            </button>
                            <Link
                              to={`/products/${prod.id}`}
                              className="px-2 py-1 text-xs font-semibold text-[#5B50E6] hover:bg-[#EEF2FF] rounded-lg transition-colors"
                            >
                              Details
                            </Link>
                            <button
                              onClick={() => setDeactivatingProduct(prod)}
                              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                                prod.is_active
                                  ? 'text-[#DC2626] hover:bg-[#FEF2F2]'
                                  : 'text-[#059669] hover:bg-[#ECFDF5]'
                              }`}
                              title={prod.is_active ? 'Deactivate product' : 'Reactivate product'}
                            >
                              {prod.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Count Footer */}
            <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
              <div>
                Showing{' '}
                <strong className="text-[#0F172A] font-semibold">
                  {(validCurrentPage - 1) * itemsPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-[#0F172A] font-semibold">
                  {Math.min(validCurrentPage * itemsPerPage, filteredAndSortedProducts.length)}
                </strong>{' '}
                of <strong className="text-[#0F172A] font-semibold">{filteredAndSortedProducts.length}</strong>{' '}
                products
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validCurrentPage === 1}
                    className="w-7 h-7 rounded-lg border border-[#ECEEF5] bg-white flex items-center justify-center text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-medium">
                    Page {validCurrentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="w-7 h-7 rounded-lg border border-[#ECEEF5] bg-white flex items-center justify-center text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
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
              <Button variant="outline" size="sm" onClick={() => setAdjustModalProduct(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAdjustment}
                disabled={adjustmentDelta === 0 || adjustModalProduct.stock_quantity + adjustmentDelta < 0}
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
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums"
                placeholder="e.g. 10 or -2"
              />
              <div className="flex items-center justify-between text-[11px] mt-1.5">
                <span className="text-[#64748B]">
                  New resulting stock:{' '}
                  <strong
                    className={`tabular-nums ${
                      adjustModalProduct.stock_quantity + adjustmentDelta < 0
                        ? 'text-red-600 font-bold'
                        : 'text-[#0F172A]'
                    }`}
                  >
                    {adjustModalProduct.stock_quantity + adjustmentDelta} units
                  </strong>
                </span>
                {adjustModalProduct.stock_quantity + adjustmentDelta < 0 && (
                  <span className="text-red-600 font-medium">Stock cannot drop below 0</span>
                )}
              </div>
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
                <option value="Customer return / reversal">Customer return / reversal</option>
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

      {/* Deactivate Confirmation Modal */}
      {deactivatingProduct && (
        <Modal
          isOpen={!!deactivatingProduct}
          onClose={() => setDeactivatingProduct(null)}
          title={deactivatingProduct.is_active ? 'Deactivate Product' : 'Reactivate Product'}
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setDeactivatingProduct(null)}>
                Cancel
              </Button>
              <Button
                variant={deactivatingProduct.is_active ? 'destructive' : 'primary'}
                size="sm"
                onClick={() => handleToggleActive(deactivatingProduct)}
              >
                {deactivatingProduct.is_active ? 'Confirm Deactivation' : 'Confirm Reactivation'}
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-xs text-[#334155] leading-relaxed">
            <p>
              Are you sure you want to{' '}
              <strong>{deactivatingProduct.is_active ? 'deactivate' : 'reactivate'}</strong>{' '}
              <strong className="text-[#0F172A]">{deactivatingProduct.name}</strong> (
              <span className="font-mono">{deactivatingProduct.sku}</span>)?
            </p>
            {deactivatingProduct.is_active ? (
              <p className="text-[#DC2626] bg-[#FEF2F2] p-2 rounded-lg border border-[#FECACA]">
                Deactivated products remain in past orders and reports but cannot be selected for new sales orders.
              </p>
            ) : (
              <p className="text-[#059669] bg-[#ECFDF5] p-2 rounded-lg border border-[#A7F3D0]">
                Reactivating this product will make it available again in the sales catalog.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
