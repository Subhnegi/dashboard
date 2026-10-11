import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDemoData } from '../../context/DemoDataContext';

export const ProductCreateView: React.FC = () => {
  const navigate = useNavigate();
  const { addProduct, products } = useDemoData();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Peripherals');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('10');
  const [reorderLevel, setReorderLevel] = useState<string>('5');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live profit calculation
  const parsedPrice = parseFloat(sellingPrice) || 0;
  const parsedCost = parseFloat(costPrice) || 0;
  const unitProfit = parsedPrice - parsedCost;
  const marginPct = parsedPrice > 0 ? ((unitProfit / parsedPrice) * 100).toFixed(1) : '0.0';

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Product name is required';
    }

    if (sku.trim()) {
      const duplicate = products.some(
        (p) => p.sku && p.sku.toLowerCase() === sku.trim().toLowerCase()
      );
      if (duplicate) {
        errs.sku = 'SKU already exists in the catalog';
      }
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      errs.sellingPrice = 'Enter a valid non-negative selling price';
    }

    const costNum = parseFloat(costPrice);
    if (isNaN(costNum) || costNum < 0) {
      errs.costPrice = 'Enter a valid non-negative cost price';
    }

    const stockNum = parseInt(stockQuantity);
    if (isNaN(stockNum) || stockNum < 0) {
      errs.stockQuantity = 'Stock quantity must be a non-negative integer';
    }

    const reorderNum = parseInt(reorderLevel);
    if (isNaN(reorderNum) || reorderNum < 0) {
      errs.reorderLevel = 'Reorder level must be a non-negative integer';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const sellingPriceMinor = Math.round(parseFloat(sellingPrice) * 100);
      const costPriceMinor = Math.round(parseFloat(costPrice) * 100);
      const stockQty = parseInt(stockQuantity);
      const reorderLvl = parseInt(reorderLevel);

      const created = await addProduct({
        name: name.trim(),
        sku: sku.trim() || `NS-PROD-${Date.now().toString().slice(-4)}`,
        category: category.trim(),
        description: description.trim() || undefined,
        selling_price_minor: sellingPriceMinor,
        cost_price_minor: costPriceMinor,
        stock_quantity: stockQty,
        reorder_level: reorderLvl,
        is_active: true,
      });

      navigate(`/products/${created.id}`);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        setErrors((prev) => ({ ...prev, sku: err.message || 'SKU already exists' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back button */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to product catalog</span>
        </Link>
      </div>

      <Card>
        <CardHeader
          title="Create New Product"
          subtitle="Define pricing, initial warehouse stock, and replenishment threshold"
        />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info */}
            <div className="space-y-3.5">
              <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                1. General Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ergonomic Bluetooth Keyboard"
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.name ? 'border-red-400 focus:border-red-500' : 'border-[#CBD5E1]'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    SKU Code (Auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. NS-KEY-009"
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono ${
                      errors.sku ? 'border-red-400 focus:border-red-500' : 'border-[#CBD5E1]'
                    }`}
                  />
                  {errors.sku && <p className="text-[11px] text-red-600 mt-1">{errors.sku}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description for sales notes and invoices..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-3.5 pt-3.5 border-t border-[#E2E8F0]">
              <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                2. Pricing & Margin (INR ₹)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="1499.00"
                      className={`w-full pl-7 pr-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                        errors.sellingPrice ? 'border-red-400' : 'border-[#CBD5E1]'
                      }`}
                    />
                  </div>
                  {errors.sellingPrice && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.sellingPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Cost Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="850.00"
                      className={`w-full pl-7 pr-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                        errors.costPrice ? 'border-red-400' : 'border-[#CBD5E1]'
                      }`}
                    />
                  </div>
                  {errors.costPrice && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.costPrice}</p>
                  )}
                </div>
              </div>

              {/* Live Gross Margin Preview Card */}
              {parsedPrice > 0 && (
                <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg flex items-center justify-between text-xs text-[#1E1B4B]">
                  <div>
                    <span className="font-semibold text-[#5B50E6]">Estimated Profit Margin: </span>
                    <span className="font-bold">{marginPct}%</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Per-unit profit: </span>
                    <strong className="text-[#0F172A] tabular-nums">
                      {unitProfit >= 0 ? `+₹${unitProfit.toFixed(2)}` : `-₹${Math.abs(unitProfit).toFixed(2)}`}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Levels */}
            <div className="space-y-3.5 pt-3.5 border-t border-[#E2E8F0]">
              <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                3. Initial Inventory Levels
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Opening Stock on Hand <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="25"
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                      errors.stockQuantity ? 'border-red-400' : 'border-[#CBD5E1]'
                    }`}
                  />
                  {errors.stockQuantity && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.stockQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Reorder Threshold <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    placeholder="5"
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                      errors.reorderLevel ? 'border-red-400' : 'border-[#CBD5E1]'
                    }`}
                  />
                  {errors.reorderLevel && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.reorderLevel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3.5 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<PackagePlus className="w-3.5 h-3.5" />}
              >
                Save product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
