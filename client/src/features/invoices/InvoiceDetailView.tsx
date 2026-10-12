import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Layers,
  CreditCard,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDemoData } from '../../context/DemoDataContext';
import * as api from '../../lib/api-client';
import {
  formatCurrency,
  formatDate,
  getSalePaymentStatus,
  getSaleBalanceDue,
} from '../../lib/formatters';
import type { Sale } from '../../types';

export const InvoiceDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { sales, settings, addPayment } = useDemoData();

  const contextSale = sales.find((s) => s.id === id);
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!contextSale);

  useEffect(() => {
    if (id) {
      api
        .getInvoice(id)
        .then((res) => {
          if (res?.invoice) {
            setFetchedData(res.invoice);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const sale: Sale | undefined =
    contextSale ||
    (fetchedData?.sale
      ? {
          ...fetchedData.sale,
          items: fetchedData.items || [],
          payments: fetchedData.payments || [],
        }
      : undefined);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmountRupees, setPayAmountRupees] = useState('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#64748B] text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
        <span>Loading tax invoice details...</span>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0] p-8 max-w-md mx-auto">
        <AlertCircle className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#0F172A]">Invoice Record Not Found</h3>
        <p className="text-xs text-[#64748B] mt-1">
          The requested invoice document could not be located.
        </p>
        <Link to="/invoices" className="mt-4 inline-block">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to invoices
          </Button>
        </Link>
      </div>
    );
  }

  const payStatus = getSalePaymentStatus(sale);
  const balanceDueMinor = getSaleBalanceDue(sale);
  const totalPaidMinor = (sale.payments || []).reduce((acc, p) => acc + p.amount_minor, 0);

  const prefix = settings.invoice_prefix || 'INV-';
  const invoiceNumber = `${prefix}${sale.sale_number.replace('ORD-', '')}`;
  const customerObj = fetchedData?.customer;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPaymentModal = () => {
    setPayAmountRupees((balanceDueMinor / 100).toFixed(2));
    setPaymentError('');
    setPayRef('');
    setPayNote('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    const amountMinor = Math.round((parseFloat(payAmountRupees) || 0) * 100);
    if (amountMinor <= 0) {
      setPaymentError('Payment amount must be greater than ₹0.00.');
      return;
    }
    if (amountMinor > balanceDueMinor) {
      setPaymentError(
        `Payment amount exceeds outstanding balance of ${formatCurrency(balanceDueMinor)}. Overpayment is not allowed.`
      );
      return;
    }

    setIsRecordingPayment(true);
    try {
      await addPayment(sale.id, {
        amount_minor: amountMinor,
        method: payMethod,
        reference: payRef.trim() || undefined,
        note: payNote.trim() || undefined,
      });

      if (fetchedData?.payments) {
        setFetchedData((prev: any) => ({
          ...prev,
          payments: [
            ...prev.payments,
            {
              id: `pay_${Date.now()}`,
              sale_id: sale.id,
              amount_minor: amountMinor,
              payment_date: new Date().toISOString(),
              method: payMethod,
              reference: payRef.trim() || undefined,
              note: payNote.trim() || undefined,
            },
          ],
        }));
      }
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex items-center justify-between flex-wrap gap-2">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to invoices</span>
        </Link>

        <div className="flex items-center gap-2">
          {sale.status !== 'CANCELLED' && balanceDueMinor > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={handleOpenPaymentModal}
            >
              Record payment
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="print-container bg-white p-8 sm:p-10 rounded-xl border border-[#E2E8F0] shadow-xs text-[#0F172A]">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-5 pb-6 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold shadow-2xs">
                <Layers className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
                {settings.business_name || 'Northstar Supplies'}
              </h2>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
              {settings.address || 'Plot 42, Electronics Zone, Phase 1, Bengaluru 560100'}
              <br />
              Email: {settings.email || 'billing@northstarsupplies.com'} • Tel:{' '}
              {settings.phone || '+91 80 4123 4567'}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h3 className="text-xl font-black text-[#2563EB] uppercase tracking-wider">
              TAX INVOICE
            </h3>
            <p className="font-mono text-sm font-bold text-[#0F172A]">{invoiceNumber}</p>
            <p className="text-xs text-[#64748B]">
              Order Reference: <strong className="text-[#334155]">{sale.sale_number}</strong>
            </p>
            <p className="text-xs text-[#64748B]">Issue Date: {formatDate(sale.sale_date)}</p>
            <div className="pt-1 flex items-center justify-start sm:justify-end gap-1.5">
              <Badge paymentStatus={payStatus} size="sm" />
              {sale.status === 'CANCELLED' && (
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                  CANCELLED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Terms Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-5 border-b border-[#E2E8F0] text-xs">
          <div>
            <h4 className="font-bold text-[#64748B] uppercase tracking-wider text-[10px] mb-1">
              Billed To:
            </h4>
            <p className="text-sm font-bold text-[#0F172A]">{sale.customer_name_snapshot}</p>
            {sale.customer_contact_snapshot && (
              <p className="text-[#64748B] mt-0.5">{sale.customer_contact_snapshot}</p>
            )}
            {customerObj?.billing_address && (
              <p className="text-[#64748B] mt-0.5 max-w-xs">{customerObj.billing_address}</p>
            )}
            {sale.notes && (
              <p className="text-[#64748B] mt-1.5 italic">Order Memo: {sale.notes}</p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <h4 className="font-bold text-[#64748B] uppercase tracking-wider text-[10px] mb-1">
              Payment Terms:
            </h4>
            <p className="text-[#334155] font-semibold">Immediate Due on Receipt</p>
            <p className="text-[#64748B]">Currency: INR (Indian Rupee - ₹)</p>
            <p className="text-[#64748B]">
              Default Tax: GST @ {((settings.default_tax_rate_basis_points || 1800) / 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-5 border-b border-[#E2E8F0]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5">SKU</th>
                <th className="py-2.5 text-right">Unit Rate</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {(sale.items || []).map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-semibold text-[#0F172A]">
                    {item.product_name_snapshot}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-[#64748B]">
                    {item.sku_snapshot || '—'}
                  </td>
                  <td className="py-3 text-right tabular-nums text-[#475569]">
                    {formatCurrency(item.unit_price_minor)}
                  </td>
                  <td className="py-3 text-center font-bold text-[#0F172A] tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-bold text-[#0F172A] tabular-nums">
                    {formatCurrency(item.line_subtotal_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Payments Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
          {/* Payment Receipts Ledger */}
          <div className="text-xs text-[#64748B] space-y-2">
            <h4 className="font-bold text-[#0F172A] text-[11px] uppercase tracking-wider">
              Payments Received:
            </h4>
            {(sale.payments || []).length === 0 ? (
              <p className="italic text-[11px] text-[#94A3B8]">
                No payments have been recorded for this invoice yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {sale.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center py-1 border-b border-[#F1F5F9] text-xs"
                  >
                    <span>
                      <strong className="text-[#334155]">{p.method}</strong> • {formatDate(p.payment_date)}
                      {p.reference ? ` (${p.reference})` : ''}
                    </span>
                    <span className="font-bold text-[#059669] tabular-nums">
                      {formatCurrency(p.amount_minor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="space-y-1.5 text-xs text-right">
            <div className="flex justify-between py-0.5">
              <span className="text-[#64748B]">Items Gross Subtotal:</span>
              <span className="font-medium text-[#0F172A] tabular-nums">
                {formatCurrency(sale.subtotal_minor + (sale.discount_minor || 0))}
              </span>
            </div>

            {sale.discount_minor > 0 && (
              <div className="flex justify-between py-0.5 text-[#DC2626]">
                <span>Discount Applied:</span>
                <span className="font-semibold tabular-nums">
                  -{formatCurrency(sale.discount_minor)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-0.5">
              <span className="text-[#64748B]">
                GST ({((settings.default_tax_rate_basis_points || 1800) / 100).toFixed(0)}%):
              </span>
              <span className="font-medium text-[#0F172A] tabular-nums">
                {formatCurrency(sale.tax_minor)}
              </span>
            </div>

            <div className="flex justify-between text-base font-bold py-2 border-t border-[#0F172A] text-[#0F172A]">
              <span>Invoice Total:</span>
              <span className="text-[#2563EB] tabular-nums">
                {formatCurrency(sale.total_minor)}
              </span>
            </div>

            <div className="flex justify-between text-xs font-semibold py-0.5 text-[#059669]">
              <span>Amount Cleared:</span>
              <span className="tabular-nums">{formatCurrency(totalPaidMinor)}</span>
            </div>

            <div className="flex justify-between text-xs font-bold py-1 border-t border-[#F1F5F9] text-[#B45309]">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatCurrency(balanceDueMinor)}</span>
            </div>
          </div>
        </div>

        {/* Demo Footer Note */}
        <div className="mt-10 pt-4 border-t border-[#E2E8F0] text-center text-[10px] text-[#94A3B8]">
          <p>
            Thank you for choosing {settings.business_name || 'Northstar Supplies'}. For billing inquiries, email{' '}
            {settings.email || 'billing@northstarsupplies.com'}.
          </p>
          <p className="mt-1 italic">
            Portfolio demonstration tax invoice preview. Values, currency, and tax calculations are for demonstration purposes.
          </p>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => !isRecordingPayment && setIsPaymentModalOpen(false)}
          title={`Record Payment — ${invoiceNumber}`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isRecordingPayment}
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isRecordingPayment}
                leftIcon={
                  isRecordingPayment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )
                }
                onClick={handleRecordPayment}
              >
                {isRecordingPayment ? 'Recording...' : 'Save Payment'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex justify-between items-center text-xs">
              <span className="text-[#64748B]">Remaining Balance:</span>
              <span className="font-bold text-[#B45309] text-sm tabular-nums">
                {formatCurrency(balanceDueMinor)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Payment Amount (₹) <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={(balanceDueMinor / 100).toFixed(2)}
                value={payAmountRupees}
                onChange={(e) => setPayAmountRupees(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums font-bold text-[#0F172A]"
                required
              />
              <span className="text-[11px] text-[#64748B] mt-0.5 block">
                Cannot exceed outstanding balance of {formatCurrency(balanceDueMinor)}.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Payment Method <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Txn Reference / Slip #
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="UPI ref or slip #"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Note (Optional)</label>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="Settlement notes..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {paymentError && (
              <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};
