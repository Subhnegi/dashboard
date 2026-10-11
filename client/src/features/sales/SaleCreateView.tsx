import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDemoData } from '../../context/DemoDataContext';
import { formatCurrency } from '../../lib/formatters';
import type { SaleItem, Payment } from '../../types';

interface LineItemDraft {
  productId: string;
  quantity: number;
}

export const SaleCreateView: React.FC = () => {
  const navigate = useNavigate();
  const { customers, products, settings, addSale } = useDemoData();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { productId: products.find((p) => p.stock_quantity > 0)?.id || '', quantity: 1 },
  ]);
  const [discountRupees, setDiscountRupees] = useState<string>('0');
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [partialAmountRupees, setPartialAmountRupees] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER'>('UPI');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Compute financial totals in minor units (paise)
  const itemsWithProduct = lineItems.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    const unitPriceMinor = prod ? prod.selling_price_minor : 0;
    const lineSubtotalMinor = unitPriceMinor * item.quantity;
    return {
      ...item,
      product: prod,
      unitPriceMinor,
      lineSubtotalMinor,
    };
  });

  const grossItemsMinor = itemsWithProduct.reduce((acc, i) => acc + i.lineSubtotalMinor, 0);
  const discountMinor = Math.min(
    grossItemsMinor,
    Math.round(Math.max(0, parseFloat(discountRupees) || 0) * 100)
  );

  const taxableAmountMinor = Math.max(0, grossItemsMinor - discountMinor);
  // Calculate 18% GST (basis points / 10000)
  const taxMinor = Math.round((taxableAmountMinor * settings.default_tax_rate_basis_points) / 10000);
  const grandTotalMinor = taxableAmountMinor + taxMinor;

  const handleAddRow = () => {
    // Find a product that isn't already added and has stock
    const available = products.find(
      (p) => p.stock_quantity > 0 && !lineItems.some((li) => li.productId === p.id)
    );
    setLineItems((prev) => [
      ...prev,
      { productId: available ? available.id : products[0]?.id || '', quantity: 1 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<LineItemDraft>) => {
    setLineItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (lineItems.length === 0) {
      setErrorMsg('Add at least one line item');
      return;
    }

    // Check duplicate products
    const productIds = lineItems.map((i) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      setErrorMsg('Duplicate products in line items. Please adjust quantity on a single row.');
      return;
    }

    // Verify stock constraints
    for (const item of lineItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        setErrorMsg('Invalid product selected.');
        return;
      }
      if (item.quantity <= 0) {
        setErrorMsg(`Quantity for "${prod.name}" must be at least 1.`);
        return;
      }
      if (item.quantity > prod.stock_quantity) {
        setErrorMsg(
          `Insufficient stock for "${prod.name}". Available: ${prod.stock_quantity}, requested: ${item.quantity}.`
        );
        return;
      }
    }

    // Construct final SaleItems with snapshots
    const finalItems: SaleItem[] = lineItems.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId)!;
      return {
        id: `item_${Date.now()}_${idx}`,
        sale_id: '',
        product_id: prod.id,
        product_name_snapshot: prod.name,
        sku_snapshot: prod.sku,
        quantity: item.quantity,
        unit_price_minor: prod.selling_price_minor,
        unit_cost_minor: prod.cost_price_minor,
        line_subtotal_minor: prod.selling_price_minor * item.quantity,
        created_at: new Date().toISOString(),
      };
    });

    // Construct Payments
    const finalPayments: Payment[] = [];
    if (paymentOption === 'FULL' && grandTotalMinor > 0) {
      finalPayments.push({
        id: `pay_${Date.now()}`,
        sale_id: '',
        amount_minor: grandTotalMinor,
        payment_date: new Date().toISOString(),
        method: paymentMethod,
        reference: paymentRef || undefined,
        note: 'Full payment received at order checkout',
        created_at: new Date().toISOString(),
      });
    } else if (paymentOption === 'PARTIAL') {
      const partialMinor = Math.round((parseFloat(partialAmountRupees) || 0) * 100);
      if (partialMinor <= 0 || partialMinor > grandTotalMinor) {
        setErrorMsg('Partial payment must be greater than 0 and not exceed grand total.');
        return;
      }
      finalPayments.push({
        id: `pay_${Date.now()}`,
        sale_id: '',
        amount_minor: partialMinor,
        payment_date: new Date().toISOString(),
        method: paymentMethod,
        reference: paymentRef || undefined,
        note: 'Advance deposit received',
        created_at: new Date().toISOString(),
      });
    }

    const createdSale = addSale({
      customer_id: selectedCustomer?.id,
      customer_name_snapshot: selectedCustomer?.name || 'Walk-in Customer',
      customer_contact_snapshot: selectedCustomer?.email || selectedCustomer?.phone || undefined,
      sale_date: new Date().toISOString(),
      status: 'CONFIRMED',
      subtotal_minor: taxableAmountMinor,
      discount_minor: discountMinor,
      tax_minor: taxMinor,
      total_minor: grandTotalMinor,
      notes: notes.trim() || undefined,
      items: finalItems,
      payments: finalPayments,
    });

    navigate(`/sales/${createdSale.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sales list</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection Card */}
        <Card>
          <CardHeader
            title="1. Customer Information"
            subtitle="Select an existing client account or walk-in customer"
          />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Customer Account
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs space-y-1">
                  <div className="font-semibold text-[#172033]">{selectedCustomer.name}</div>
                  <div className="text-[#667085]">
                    {selectedCustomer.email || selectedCustomer.phone || 'Walk-in client'}
                  </div>
                  {selectedCustomer.billing_address && (
                    <div className="text-[#98A2B3] truncate">{selectedCustomer.billing_address}</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card>
          <CardHeader
            title="2. Order Line Items"
            subtitle="Add products and verify available quantities"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddRow}
              >
                Add item
              </Button>
            }
          />
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              {lineItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                const maxStock = prod ? prod.stock_quantity : 0;
                const lineTotalMinor = prod ? prod.selling_price_minor * item.quantity : 0;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
                  >
                    {/* Product Selector */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-[#667085] uppercase mb-1">
                        Product
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(idx, { productId: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                            {p.name} ({p.sku}) — {formatCurrency(p.selling_price_minor)}{' '}
                            {p.stock_quantity <= 0 ? '(Out of Stock)' : `[Stock: ${p.stock_quantity}]`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-28">
                      <label className="block text-[11px] font-semibold text-[#667085] uppercase mb-1">
                        Qty (Max {maxStock})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={maxStock}
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(idx, { quantity: parseInt(e.target.value) || 1 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 text-center"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28 text-right hidden sm:block">
                      <label className="block text-[11px] font-semibold text-[#667085] uppercase mb-1">
                        Rate
                      </label>
                      <div className="py-2 text-sm font-medium text-[#667085]">
                        {formatCurrency(prod?.selling_price_minor || 0)}
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="w-32 text-right">
                      <label className="block text-[11px] font-semibold text-[#667085] uppercase mb-1">
                        Line Total
                      </label>
                      <div className="py-2 text-sm font-bold text-[#172033]">
                        {formatCurrency(lineTotalMinor)}
                      </div>
                    </div>

                    {/* Remove Action */}
                    {lineItems.length > 1 && (
                      <div className="pt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 text-[#98A2B3] hover:text-[#B42318] hover:bg-[#FEF3F2] rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddRow}
            >
              Add another product
            </Button>
          </div>
        </Card>

        {/* Pricing, Discount, and Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Terms */}
          <Card>
            <CardHeader
              title="3. Payment Collection"
              subtitle="Record settlement status for this order"
            />
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-2">
                  Payment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'FULL', label: 'Paid Full' },
                    { id: 'PARTIAL', label: 'Partial' },
                    { id: 'UNPAID', label: 'Unpaid' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentOption(opt.id as any)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        paymentOption === opt.id
                          ? 'bg-[#EEECFB] text-[#5546D7] border-[#5546D7] shadow-xs'
                          : 'bg-white text-[#344054] border-[#D0D5DD] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentOption !== 'UNPAID' && (
                <>
                  {paymentOption === 'PARTIAL' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#344054] mb-1">
                        Advance Paid Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={partialAmountRupees}
                        onChange={(e) => setPartialAmountRupees(e.target.value)}
                        placeholder="e.g. 5000.00"
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#344054] mb-1">
                        Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
                      >
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card POS</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#344054] mb-1">
                        Txn Reference
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="UPI ref or slip #"
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Order Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, PO number, or client remarks..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Calculation Summary */}
          <Card>
            <CardHeader
              title="4. Order Summary"
              subtitle="Automated tax calculation and grand total"
            />
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm py-1">
                <span className="text-[#667085]">Items Subtotal:</span>
                <span className="font-semibold text-[#172033]">
                  {formatCurrency(grossItemsMinor)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm py-1 border-t border-[#F2F4F7]">
                <span className="text-[#667085]">Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountRupees}
                  onChange={(e) => setDiscountRupees(e.target.value)}
                  className="w-24 px-2 py-1 text-right text-xs bg-white border border-[#D0D5DD] rounded-md focus:outline-none"
                />
              </div>

              <div className="flex justify-between text-sm py-1 border-t border-[#F2F4F7]">
                <span className="text-[#667085]">
                  GST ({settings.default_tax_rate_basis_points / 100}%):
                </span>
                <span className="font-semibold text-[#172033]">{formatCurrency(taxMinor)}</span>
              </div>

              <div className="flex justify-between text-base font-bold py-2 border-t-2 border-[#E5E7EB] text-[#172033]">
                <span>Grand Total:</span>
                <span className="text-[#5546D7]">{formatCurrency(grandTotalMinor)}</span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl text-xs text-[#B42318] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="lg"
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                  Confirm & Create Sale
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};
