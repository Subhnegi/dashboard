import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  SlidersHorizontal,
  ShoppingCart,
  Edit3,
  Power,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDemoData } from '../../context/DemoDataContext';
import * as api from '../../lib/api-client';
import {
  formatCurrency,
  formatDateTime,
  getProductStockStatus,
} from '../../lib/formatters';
import type { Product, InventoryMovement, StockStatus } from '../../types';

export const ProductDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    products,
    adjustProductStock,
    deactivateProduct,
    updateProduct,
    showToast,
  } = useDemoData();

  // Find product from context initially
  const contextProduct = products.find((p) => p.id === id);

  // Local state for live product data and movements
  const [product, setProduct] = useState<Product | null>(contextProduct || null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(!contextProduct);

  // Adjust stock modal state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('Stock received from supplier');
  const [note, setNote] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Edit product modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editReorderLevel, setEditReorderLevel] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deactivate/Reactivate confirmation modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Synchronize product from context if changed
  useEffect(() => {
    if (contextProduct) {
      setProduct(contextProduct);
    }
  }, [contextProduct]);

  // Fetch product detail and movements from backend API
  const loadProductDetail = async () => {
    if (!id) return;
    try {
      const data = await api.getProduct(id);
      if (data?.product) {
        const mappedProduct: Product = {
          ...data.product,
          is_active: Boolean(data.product.is_active),
        };
        setProduct(mappedProduct);
      }
      if (data?.movements) {
        setMovements(data.movements);
      }
    } catch (err) {
      console.warn('Could not fetch product detail from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProductDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-[#E2E8F0] rounded" />
        <div className="h-28 bg-white border border-[#E2E8F0] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white p-12 rounded-xl border border-[#E2E8F0] text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#0F172A]">Product Not Found</h3>
        <p className="text-xs text-[#64748B] mt-1 mb-5">
          The requested product ID does not exist or may have been removed.
        </p>
        <Link to="/products">
          <Button variant="primary" size="sm">
            Return to Product Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const status: StockStatus = getProductStockStatus(product);
  const unitProfitMinor = product.selling_price_minor - product.cost_price_minor;
  const marginPercent =
    product.selling_price_minor > 0
      ? ((unitProfitMinor / product.selling_price_minor) * 100).toFixed(1)
      : '0.0';

  const isBelowReorder = product.stock_quantity <= product.reorder_level && product.stock_quantity > 0;
  const isOutOfStock = product.stock_quantity === 0;

  // Open Edit Modal with current product values
  const handleOpenEdit = () => {
    setEditName(product.name);
    setEditSku(product.sku || '');
    setEditCategory(product.category);
    setEditDescription(product.description || '');
    setEditSellingPrice((product.selling_price_minor / 100).toFixed(2));
    setEditCostPrice((product.cost_price_minor / 100).toFixed(2));
    setEditReorderLevel(String(product.reorder_level));
    setEditErrors({});
    setIsEditOpen(true);
  };

  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (!editName.trim()) {
      errs.name = 'Product name is required';
    }
    const sellPrice = parseFloat(editSellingPrice);
    if (isNaN(sellPrice) || sellPrice < 0) {
      errs.sellingPrice = 'Enter a valid non-negative selling price';
    }
    const costPrice = parseFloat(editCostPrice);
    if (isNaN(costPrice) || costPrice < 0) {
      errs.costPrice = 'Enter a valid non-negative cost price';
    }
    const reorder = parseInt(editReorderLevel);
    if (isNaN(reorder) || reorder < 0) {
      errs.reorderLevel = 'Reorder level must be a non-negative integer';
    }
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEdit()) return;

    setIsSavingEdit(true);
    try {
      const sellingPriceMinor = Math.round(parseFloat(editSellingPrice) * 100);
      const costPriceMinor = Math.round(parseFloat(editCostPrice) * 100);
      const reorderLevel = parseInt(editReorderLevel);

      const updates: Partial<Product> = {
        name: editName.trim(),
        sku: editSku.trim() || undefined,
        category: editCategory.trim(),
        description: editDescription.trim() || undefined,
        selling_price_minor: sellingPriceMinor,
        cost_price_minor: costPriceMinor,
        reorder_level: reorderLevel,
      };

      await updateProduct(product.id, updates);
      await loadProductDetail();
      setIsEditOpen(false);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        setEditErrors((prev) => ({ ...prev, sku: err.message || 'SKU already in use' }));
      } else {
        showToast(err.message || 'Failed to update product', 'error');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Stock Adjustment
  const handleApplyAdjustment = async () => {
    if (delta === 0) return;
    if (product.stock_quantity + delta < 0) {
      showToast('Adjustment would cause stock to drop below 0.', 'error');
      return;
    }

    setIsAdjusting(true);
    try {
      await adjustProductStock(product.id, delta, reason, note);
      await loadProductDetail();
      setIsAdjustOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Stock adjustment failed', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Handle Deactivate / Reactivate
  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      if (product.is_active) {
        await deactivateProduct(product.id);
      } else {
        await updateProduct(product.id, { is_active: true });
      }
      await loadProductDetail();
      setIsStatusModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Could not update status', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between text-xs">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to product catalog</span>
        </Link>
        <span className="text-[#94A3B8]">
          Catalog / {product.category} / <strong className="text-[#334155]">{product.name}</strong>
        </span>
      </div>

      {/* Stock Health Alerts */}
      {isOutOfStock && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between text-xs text-[#991B1B]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <div>
              <span className="font-bold">Out of Stock Alert:</span> This product currently has 0 units on hand. New customer orders cannot be fulfilled until inventory is received.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100/50 shrink-0"
            onClick={() => {
              setDelta(10);
              setIsAdjustOpen(true);
            }}
          >
            Replenish now
          </Button>
        </div>
      )}

      {isBelowReorder && (
        <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center justify-between text-xs text-[#92400E]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <div>
              <span className="font-bold">Low Stock Warning:</span> Available stock ({product.stock_quantity} units) is at or below the reorder threshold ({product.reorder_level} units).
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-100/50 shrink-0"
            onClick={() => {
              setDelta(10);
              setIsAdjustOpen(true);
            }}
          >
            Adjust stock
          </Button>
        </div>
      )}

      {!product.is_active && (
        <div className="p-3.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl flex items-center justify-between text-xs text-[#475569]">
          <div className="flex items-center gap-2.5">
            <Power className="w-4 h-4 text-[#64748B] shrink-0" />
            <div>
              <span className="font-bold">Inactive Catalog Item:</span> This item is deactivated and will not appear in the new sales order catalog.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-300 text-emerald-700 hover:bg-emerald-50 shrink-0"
            onClick={() => setIsStatusModalOpen(true)}
          >
            Reactivate item
          </Button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-[#EEF2FF] text-[#5B50E6] flex items-center justify-center shrink-0 border border-[#C7D2FE]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{product.name}</h1>
              <Badge stockStatus={status} size="sm" />
              <Badge variant={product.is_active ? 'success' : 'neutral'} size="sm">
                {product.is_active ? 'Active' : 'Deactivated'}
              </Badge>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#64748B] mt-1 flex-wrap">
              <span className="font-mono bg-[#F1F5F9] px-2 py-0.5 rounded text-[#334155] text-[11px] font-semibold border border-[#E2E8F0]">
                {product.sku || 'NO SKU'}
              </span>
              <span>•</span>
              <span className="font-medium text-[#334155]">Category: {product.category}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3 text-[#94A3B8]" />
                Added {formatDateTime(product.created_at)}
              </span>
            </div>
            {product.description && (
              <p className="text-xs text-[#64748B] mt-2 max-w-2xl leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Hero Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={handleOpenEdit}
          >
            Edit product
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            onClick={() => {
              setDelta(0);
              setReason('Stock received from supplier');
              setNote('');
              setIsAdjustOpen(true);
            }}
          >
            Adjust stock
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Power className="w-3.5 h-3.5" />}
            className={product.is_active ? 'text-[#DC2626] hover:bg-[#FEF2F2] hover:border-red-300' : 'text-[#059669] hover:bg-[#ECFDF5] hover:border-emerald-300'}
            onClick={() => setIsStatusModalOpen(true)}
          >
            {product.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>

          {product.is_active && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
              onClick={() => navigate('/sales/new')}
            >
              Create order
            </Button>
          )}
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
              Unit Acquisition Cost
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {formatCurrency(product.cost_price_minor)}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Supplier replacement cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Gross Profit Margin
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
            </div>
            <div className="text-xl font-bold text-[#059669] mt-1 tabular-nums">
              {marginPercent}%
            </div>
            <p className="text-[11px] text-[#059669] font-medium mt-0.5 tabular-nums">
              +{formatCurrency(unitProfitMinor)} margin / unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Stock on Hand
              </span>
              <Boxes className="w-3.5 h-3.5 text-[#5B50E6]" />
            </div>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {product.stock_quantity} <span className="text-xs font-normal text-[#64748B]">units</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Reorder threshold: <strong className="text-[#0F172A]">{product.reorder_level}</strong> units
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
          {movements.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              <Package className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
              <p className="font-semibold text-[#334155]">No stock movements recorded yet</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Movements will appear here automatically when inventory is adjusted or sold.
              </p>
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
                {movements.map((mov) => {
                  const isPositive = mov.quantity_delta > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-[#64748B]">
                        {formatDateTime(mov.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[11px] text-[#334155] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] tabular-nums font-semibold ${
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

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Product — ${product.name}`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
              onClick={handleSaveEdit}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  editErrors.name ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {editErrors.name && (
                <p className="text-[11px] text-red-600 mt-1">{editErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                SKU Identifier
              </label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono ${
                  editErrors.sku ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {editErrors.sku && (
                <p className="text-[11px] text-red-600 mt-1">{editErrors.sku}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Peripherals">Peripherals</option>
                <option value="Accessories">Accessories</option>
                <option value="Ergonomics">Ergonomics</option>
                <option value="Cables">Cables</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Description (optional)
              </label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={editSellingPrice}
                onChange={(e) => setEditSellingPrice(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                  editErrors.sellingPrice ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {editErrors.sellingPrice && (
                <p className="text-[11px] text-red-600 mt-1">{editErrors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Unit Cost Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={editCostPrice}
                onChange={(e) => setEditCostPrice(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                  editErrors.costPrice ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {editErrors.costPrice && (
                <p className="text-[11px] text-red-600 mt-1">{editErrors.costPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Reorder Threshold <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={editReorderLevel}
                onChange={(e) => setEditReorderLevel(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                  editErrors.reorderLevel ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {editErrors.reorderLevel && (
                <p className="text-[11px] text-red-600 mt-1">{editErrors.reorderLevel}</p>
              )}
            </div>
          </div>
        </form>
      </Modal>

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
            <Button
              variant="primary"
              size="sm"
              isLoading={isAdjusting}
              onClick={handleApplyAdjustment}
              disabled={delta === 0 || product.stock_quantity + delta < 0}
            >
              Apply adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Current Inventory on Hand:</span>
            <span className="font-bold text-sm text-[#0F172A] tabular-nums">
              {product.stock_quantity} units
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Quantity Delta (+ for received, - for loss or write-off)
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums"
              placeholder="e.g. 10 or -3"
            />
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-[#64748B]">
                New resulting stock:{' '}
                <strong
                  className={`tabular-nums ${
                    product.stock_quantity + delta < 0 ? 'text-red-600 font-bold' : 'text-[#0F172A]'
                  }`}
                >
                  {product.stock_quantity + delta} units
                </strong>
              </span>
              {product.stock_quantity + delta < 0 && (
                <span className="text-red-600 font-medium">Stock cannot drop below 0</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Adjustment Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Stock received from supplier">Stock received from supplier</option>
              <option value="Damaged / lost inventory">Damaged / lost inventory</option>
              <option value="Manual cycle count correction">Manual cycle count correction</option>
              <option value="Opening balance reconciliation">Opening balance reconciliation</option>
              <option value="Customer return / reversal">Customer return / reversal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Reference / Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. PO-8902 or annual inventory audit"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Modal>

      {/* Deactivate/Reactivate Confirmation Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={product.is_active ? 'Deactivate Product' : 'Reactivate Product'}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={product.is_active ? 'destructive' : 'primary'}
              size="sm"
              isLoading={isTogglingStatus}
              onClick={handleToggleStatus}
            >
              {product.is_active ? 'Confirm Deactivation' : 'Confirm Reactivation'}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs text-[#334155] leading-relaxed">
          <p>
            Are you sure you want to{' '}
            <strong>{product.is_active ? 'deactivate' : 'reactivate'}</strong>{' '}
            <strong className="text-[#0F172A]">{product.name}</strong> (
            <span className="font-mono">{product.sku || 'No SKU'}</span>)?
          </p>
          {product.is_active ? (
            <p className="text-[#DC2626] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FECACA]">
              Deactivating this product hides it from new sales workflows. Historical orders and inventory movement logs remain preserved.
            </p>
          ) : (
            <p className="text-[#059669] bg-[#ECFDF5] p-2.5 rounded-lg border border-[#A7F3D0]">
              Reactivating this product will make it immediately selectable again in sales order catalogs.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
