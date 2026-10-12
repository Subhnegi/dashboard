import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDemoData } from '../../context/DemoDataContext';
import { formatCurrency } from '../../lib/formatters';

interface LineItemDraft {
  productId: string;
  quantity: number;
}

export const SaleCreateView: React.FC = () => {
  const navigate = useNavigate();
  const { customers, products, settings, addSale } = useDemoData();

  // Customer state
  const activeCustomers = customers.filter((c) => c.is_active);
  const [isWalkIn, setIsWalkIn] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    activeCustomers[0]?.id || ''
  );
  const [walkInName, setWalkInName] = useState<string>('Walk-in Customer');
  const [walkInContact, setWalkInContact] = useState<string>('');

  // Line items state
  const inStockProducts = products.filter((p) => p.is_active && p.stock_quantity > 0);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { productId: inStockProducts[0]?.id || products[0]?.id || '', quantity: 1 },
  ]);

  // Financial and payment state
  const [discountRupees, setDiscountRupees] = useState<string>('0');
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [partialAmountRupees, setPartialAmountRupees] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER'>('UPI');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Submission feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedCustomer = activeCustomers.find((c) => c.id === selectedCustomerId);

  // Compute live calculations
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
  const rawDiscountRupees = parseFloat(discountRupees) || 0;
  const discountMinor = Math.min(
    grossItemsMinor,
    Math.round(Math.max(0, rawDiscountRupees) * 100)
  );

  const taxableAmountMinor = Math.max(0, grossItemsMinor - discountMinor);
  const taxRateBp = settings.default_tax_rate_basis_points || 1800;
  const taxMinor = Math.round((taxableAmountMinor * taxRateBp) / 10000);
  const grandTotalMinor = taxableAmountMinor + taxMinor;

  const handleAddRow = () => {
    const available = products.find(
      (p) => p.is_active && p.stock_quantity > 0 && !lineItems.some((li) => li.productId === p.id)
    );
    setLineItems((prev) => [
      ...prev,
      { productId: available ? available.id : inStockProducts[0]?.id || products[0]?.id || '', quantity: 1 },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (lineItems.length === 0) {
      setErrorMsg('Add at least one line item to process this order.');
      return;
    }

    // Check for duplicate products
    const productIds = lineItems.map((i) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      setErrorMsg('Duplicate products in line items. Please adjust the quantity on a single row.');
      return;
    }

    // Validate quantities against stock
    for (const item of lineItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        setErrorMsg('One or more selected products are invalid.');
        return;
      }
      if (!prod.is_active) {
        setErrorMsg(`"${prod.name}" is deactivated and cannot be sold.`);
        return;
      }
      if (item.quantity <= 0) {
        setErrorMsg(`Quantity for "${prod.name}" must be at least 1 unit.`);
        return;
      }
      if (item.quantity > prod.stock_quantity) {
        setErrorMsg(
          `Insufficient stock for "${prod.name}". Available stock: ${prod.stock_quantity}, requested: ${item.quantity}.`
        );
        return;
      }
    }

    // Payment validation
    let initialPayment = undefined;
    if (paymentOption === 'FULL' && grandTotalMinor > 0) {
      initialPayment = {
        amount_minor: grandTotalMinor,
        method: paymentMethod,
        reference: paymentRef.trim() || undefined,
        note: 'Full settlement at order creation',
      };
    } else if (paymentOption === 'PARTIAL') {
      const partialMinor = Math.round((parseFloat(partialAmountRupees) || 0) * 100);
      if (partialMinor <= 0 || partialMinor > grandTotalMinor) {
        setErrorMsg('Partial deposit must be greater than ₹0 and cannot exceed the grand total.');
        return;
      }
      initialPayment = {
        amount_minor: partialMinor,
        method: paymentMethod,
        reference: paymentRef.trim() || undefined,
        note: 'Advance deposit received',
      };
    }

    const customerName = isWalkIn
      ? walkInName.trim() || 'Walk-in Customer'
      : selectedCustomer?.name || 'Walk-in Customer';
    const customerContact = isWalkIn
      ? walkInContact.trim() || undefined
      : selectedCustomer?.email || selectedCustomer?.phone || undefined;
    const customerId = isWalkIn ? null : selectedCustomer?.id || null;

    setIsSubmitting(true);
    try {
      const created = await addSale({
        customer_id: customerId,
        customer_name: customerName,
        customer_contact: customerContact,
        sale_date: new Date().toISOString(),
        discount_minor: discountMinor,
        tax_minor: taxMinor,
        notes: notes.trim() || null,
        items: lineItems.map((li) => ({
          product_id: li.productId,
          quantity: li.quantity,
        })),
        initial_payment: initialPayment,
      });

      navigate(`/sales/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating the sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back Navigation */}
      <div>
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sales list</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Customer Account */}
        <Card>
          <CardHeader
            title="1. Customer Information"
            subtitle="Select a registered customer account or process a counter walk-in sale"
          />
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 border-b border-[#F1F5F9] pb-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="radio"
                  name="customerType"
                  checked={!isWalkIn}
                  onChange={() => setIsWalkIn(false)}
                  className="text-[#2563EB] focus:ring-blue-500"
                />
                <span>Registered Customer</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="radio"
                  name="customerType"
                  checked={isWalkIn}
                  onChange={() => setIsWalkIn(true)}
                  className="text-[#2563EB] focus:ring-blue-500"
                />
                <span>Walk-in Customer (Over the Counter)</span>
              </label>
            </div>

            {!isWalkIn ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Select Customer <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {activeCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">{selectedCustomer.name}</span>
                      <span className="text-[10px] text-[#64748B]">Account #{selectedCustomer.id.slice(-4)}</span>
                    </div>
                    <div className="text-[#64748B]">
                      {selectedCustomer.email || 'No email registered'} • {selectedCustomer.phone || 'No phone'}
                    </div>
                    {selectedCustomer.billing_address && (
                      <div className="text-[#94A3B8] text-[11px] truncate">
                        {selectedCustomer.billing_address}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Walk-in Client Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="e.g. Walk-in Customer or Client Name"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Phone / Email Contact (Optional)
                  </label>
                  <input
                    type="text"
                    value={walkInContact}
                    onChange={(e) => setWalkInContact(e.target.value)}
                    placeholder="+91 98765 43210 or email"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Line Items */}
        <Card>
          <CardHeader
            title="2. Line Items & Inventory Verification"
            subtitle="Select catalog items with live stock verification. Overselling is strictly prevented."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddRow}
              >
                Add product row
              </Button>
            }
          />
          <div className="p-4 space-y-3">
            <div className="space-y-2.5">
              {lineItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                const maxStock = prod ? prod.stock_quantity : 0;
                const lineTotalMinor = prod ? prod.selling_price_minor * item.quantity : 0;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 transition-all"
                  >
                    {/* Product Selection */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Product & SKU
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(idx, { productId: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-[#0F172A]"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={!p.is_active || p.stock_quantity <= 0}>
                            {p.name} ({p.sku}) — {formatCurrency(p.selling_price_minor)}{' '}
                            {!p.is_active
                              ? '(Deactivated)'
                              : p.stock_quantity <= 0
                              ? '(Out of Stock)'
                              : `[Stock: ${p.stock_quantity}]`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-28">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                          Qty
                        </label>
                        <span className="text-[10px] text-[#2563EB] font-semibold">
                          Max: {maxStock}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={maxStock}
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(idx, { quantity: parseInt(e.target.value) || 1 })
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center tabular-nums font-bold text-[#0F172A]"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28 text-right hidden sm:block">
                      <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Unit Rate
                      </label>
                      <div className="py-1.5 text-xs font-semibold text-[#475569] tabular-nums">
                        {formatCurrency(prod?.selling_price_minor || 0)}
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="w-32 text-right">
                      <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Line Total
                      </label>
                      <div className="py-1.5 text-xs font-bold text-[#0F172A] tabular-nums">
                        {formatCurrency(lineTotalMinor)}
                      </div>
                    </div>

                    {/* Remove Action */}
                    {lineItems.length > 1 && (
                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                          title="Remove item row"
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
              leftIcon={<Plus className="w-3 h-3" />}
              onClick={handleAddRow}
            >
              Add another product
            </Button>
          </div>
        </Card>

        {/* Step 3 & 4: Payment Terms & Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Payment Terms Card */}
          <Card>
            <CardHeader
              title="3. Payment Collection"
              subtitle="Record immediate settlement or mark as pending balance"
            />
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-2">
                  Payment Status
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
                  {[
                    { id: 'FULL', label: 'Paid in Full' },
                    { id: 'PARTIAL', label: 'Partial Deposit' },
                    { id: 'UNPAID', label: 'Unpaid / Later' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentOption(opt.id as any)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        paymentOption === opt.id
                          ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                          : 'text-[#64748B] hover:text-[#0F172A]'
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
                      <label className="block text-xs font-semibold text-[#334155] mb-1">
                        Advance Deposit Amount (₹) <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={partialAmountRupees}
                        onChange={(e) => setPartialAmountRupees(e.target.value)}
                        placeholder="e.g. 5000.00"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums font-semibold"
                        required={paymentOption === 'PARTIAL'}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      >
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card POS</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1">
                        Txn Reference #
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="UPI or Slip ID"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Order Notes & PO Reference
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery memo, purchase order number, or client notes..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary Card */}
          <Card>
            <CardHeader
              title="4. Order Summary"
              subtitle="Server calculates final totals from immutable database prices"
            />
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs py-1">
                <span className="text-[#64748B]">Items Gross Subtotal:</span>
                <span className="font-semibold text-[#0F172A] tabular-nums">
                  {formatCurrency(grossItemsMinor)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-t border-[#F1F5F9]">
                <span className="text-[#64748B]">Discount (₹):</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#64748B]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountRupees}
                    onChange={(e) => setDiscountRupees(e.target.value)}
                    className="w-24 px-2 py-0.5 text-right text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs py-1 border-t border-[#F1F5F9]">
                <span className="text-[#64748B]">
                  GST ({taxRateBp / 100}%):
                </span>
                <span className="font-semibold text-[#0F172A] tabular-nums">
                  {formatCurrency(taxMinor)}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold py-2 border-t border-[#E2E8F0] text-[#0F172A]">
                <span>Grand Total:</span>
                <span className="text-[#2563EB] tabular-nums">
                  {formatCurrency(grandTotalMinor)}
                </span>
              </div>

              {paymentOption === 'PARTIAL' && (
                <div className="flex justify-between text-xs font-semibold py-1 border-t border-[#F1F5F9] text-[#B45309]">
                  <span>Remaining Balance:</span>
                  <span className="tabular-nums">
                    {formatCurrency(
                      Math.max(
                        0,
                        grandTotalMinor -
                          Math.round((parseFloat(partialAmountRupees) || 0) * 100)
                      )
                    )}
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="md"
                  disabled={isSubmitting}
                  leftIcon={
                    isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )
                  }
                >
                  {isSubmitting ? 'Processing Transaction...' : 'Confirm & Create Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};
