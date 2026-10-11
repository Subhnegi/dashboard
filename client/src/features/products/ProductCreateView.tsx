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

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Product name is required';
    }

    if (sku.trim()) {
      const duplicate = products.some(
        (p) => p.sku.toLowerCase() === sku.trim().toLowerCase()
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert INR rupees to minor units (paise)
    const sellingPriceMinor = Math.round(parseFloat(sellingPrice) * 100);
    const costPriceMinor = Math.round(parseFloat(costPrice) * 100);
    const stockQty = parseInt(stockQuantity);
    const reorderLvl = parseInt(reorderLevel);

    const created = addProduct({
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
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to products list</span>
        </Link>
      </div>

      <Card>
        <CardHeader
          title="Add New Inventory Product"
          subtitle="Define pricing, initial stock balance, and reorder levels"
        />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                1. General Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ergonomic Bluetooth Keyboard"
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                      errors.name ? 'border-red-400 focus:border-red-500' : 'border-[#D0D5DD]'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    SKU Code (Auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. NS-KEY-009"
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                      errors.sku ? 'border-red-400 focus:border-red-500' : 'border-[#D0D5DD]'
                    }`}
                  />
                  {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
                  >
                    <option value="Peripherals">Peripherals</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Ergonomics">Ergonomics</option>
                    <option value="Cables">Cables</option>
                    <option value="Office Supplies">Office Supplies</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description for sales notes and invoices..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                2. Financial & Pricing (INR ₹)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#667085]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="1499.00"
                      className={`w-full pl-8 pr-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                        errors.sellingPrice
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-[#D0D5DD]'
                      }`}
                    />
                  </div>
                  {errors.sellingPrice && (
                    <p className="text-xs text-red-600 mt-1">{errors.sellingPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Cost Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#667085]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="850.00"
                      className={`w-full pl-8 pr-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                        errors.costPrice ? 'border-red-400 focus:border-red-500' : 'border-[#D0D5DD]'
                      }`}
                    />
                  </div>
                  {errors.costPrice && (
                    <p className="text-xs text-red-600 mt-1">{errors.costPrice}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Levels */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <h4 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                3. Stock Management
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Opening Stock on Hand <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="25"
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                      errors.stockQuantity
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#D0D5DD]'
                    }`}
                  />
                  {errors.stockQuantity && (
                    <p className="text-xs text-red-600 mt-1">{errors.stockQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Reorder Threshold Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    placeholder="5"
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                      errors.reorderLevel ? 'border-red-400 focus:border-red-500' : 'border-[#D0D5DD]'
                    }`}
                  />
                  {errors.reorderLevel && (
                    <p className="text-xs text-red-600 mt-1">{errors.reorderLevel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" leftIcon={<PackagePlus className="w-4 h-4" />}>
                Save product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
