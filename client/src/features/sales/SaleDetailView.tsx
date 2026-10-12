import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDemoData } from '../../context/DemoDataContext';
import * as api from '../../lib/api-client';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getSalePaymentStatus,
  getSaleBalanceDue,
} from '../../lib/formatters';
import type { Sale } from '../../types';

export const SaleDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { sales, addPayment, cancelSale } = useDemoData();

  // Find sale in context, or load fresh from backend
  const contextSale = sales.find((s) => s.id === id);
  const [fetchedSale, setFetchedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState<boolean>(!contextSale);

  useEffect(() => {
    if (id) {
      api
        .getSale(id)
        .then((res) => {
          if (res?.sale) {
            setFetchedSale({
              ...res.sale,
              items: res.items || [],
              payments: res.payments || [],
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const sale = contextSale || fetchedSale;

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmountRupees, setPayAmountRupees] = useState('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer cancellation request');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#64748B] text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
        <span>Loading sale order details...</span>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0] p-8 max-w-md mx-auto">
        <AlertCircle className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#0F172A]">Sale Order Not Found</h3>
        <p className="text-xs text-[#64748B] mt-1">
          The requested sales transaction could not be located.
        </p>
        <Link to="/sales" className="mt-4 inline-block">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to sales list
          </Button>
        </Link>
      </div>
    );
  }

  const payStatus = getSalePaymentStatus(sale);
  const balanceDueMinor = getSaleBalanceDue(sale);
  const totalPaidMinor = (sale.payments || []).reduce((acc, p) => acc + p.amount_minor, 0);

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

      // Update local state if needed
      if (fetchedSale) {
        setFetchedSale((prev) =>
          prev
            ? {
                ...prev,
                payments: [
                  ...prev.payments,
                  {
                    id: `pay_${Date.now()}`,
                    sale_id: sale.id,
                    amount_minor: amountMinor,
                    payment_date: new Date().toISOString(),
                    method: payMethod as any,
                    reference: payRef.trim() || undefined,
                    note: payNote.trim() || undefined,
                    created_at: new Date().toISOString(),
                  },
                ],
              }
            : null
        );
      }
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleConfirmCancel = async () => {
    const reasonToUse =
      cancelReason === 'Other' ? customReason.trim() || 'Manual cancellation' : cancelReason;
    setIsCancelling(true);
    try {
      await cancelSale(sale.id, reasonToUse);
      if (fetchedSale) {
        setFetchedSale((prev) =>
          prev
            ? {
                ...prev,
                status: 'CANCELLED',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reasonToUse,
              }
            : null
        );
      }
      setIsCancelModalOpen(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Back Nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sales list</span>
        </Link>
      </div>

      {/* Sale Order Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{sale.sale_number}</h1>
            <Badge saleStatus={sale.status} size="sm" />
            <Badge paymentStatus={payStatus} size="sm" />
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Placed on <strong className="text-[#334155]">{formatDateTime(sale.sale_date)}</strong> • Client:{' '}
            <strong className="text-[#0F172A]">{sale.customer_name_snapshot}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link to={`/invoices/${sale.id}`}>
            <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
              View tax invoice
            </Button>
          </Link>

          {sale.status !== 'CANCELLED' && balanceDueMinor > 0 && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={handleOpenPaymentModal}
            >
              Record payment
            </Button>
          )}

          {sale.status !== 'CANCELLED' && (
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              onClick={() => {
                setCancelReason('Customer requested return');
                setCustomReason('');
                setIsCancelModalOpen(true);
              }}
            >
              Cancel sale
            </Button>
          )}
        </div>
      </div>

      {/* Cancellation Notice Banner */}
      {sale.status === 'CANCELLED' && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-3 text-xs text-[#DC2626]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-[#991B1B]">Order Cancelled</div>
            <p className="mt-0.5 leading-relaxed text-[#B91C1C]">
              This order was cancelled on {formatDate(sale.cancelled_at || sale.updated_at)} with reason:{' '}
              <em>"{sale.cancellation_reason || 'Manual cancellation'}"</em>. Product inventory was
              automatically returned to catalog stock with an audit movement reversal.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Info Grid: Customer Snapshot & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Customer Snapshot */}
        <Card className="md:col-span-1">
          <CardHeader
            title="Customer Snapshot"
            subtitle="Immutable contact recorded at checkout"
          />
          <CardContent className="space-y-2 text-xs">
            <div>
              <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider block">
                Billed Account
              </span>
              <span className="font-semibold text-sm text-[#0F172A] block mt-0.5">
                {sale.customer_name_snapshot}
              </span>
            </div>

            {sale.customer_contact_snapshot && (
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider block">
                  Contact
                </span>
                <span className="text-[#334155]">{sale.customer_contact_snapshot}</span>
              </div>
            )}

            {sale.customer_id && (
              <div className="pt-2">
                <Link
                  to={`/customers/${sale.customer_id}`}
                  className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                >
                  View full customer profile &rarr;
                </Link>
              </div>
            )}

            {sale.notes && (
              <div className="pt-2 border-t border-[#F1F5F9]">
                <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider block">
                  Order Note / Memo
                </span>
                <p className="text-[#334155] mt-0.5 italic">{sale.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="md:col-span-2">
          <CardHeader
            title="Financial Breakdown"
            subtitle="Line item pricing, tax, and settlement status"
          />
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-[#64748B]">Items Gross Subtotal:</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {formatCurrency(sale.subtotal_minor + (sale.discount_minor || 0))}
              </span>
            </div>

            {sale.discount_minor > 0 && (
              <div className="flex justify-between py-1 text-[#DC2626]">
                <span>Applied Discount:</span>
                <span className="font-semibold tabular-nums">
                  -{formatCurrency(sale.discount_minor)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-t border-[#F1F5F9]">
              <span className="text-[#64748B]">Tax (GST):</span>
              <span className="font-semibold text-[#0F172A] tabular-nums">
                {formatCurrency(sale.tax_minor)}
              </span>
            </div>

            <div className="flex justify-between text-base font-bold py-2 border-t border-[#E2E8F0] text-[#0F172A]">
              <span>Grand Total:</span>
              <span className="text-[#2563EB] tabular-nums">
                {formatCurrency(sale.total_minor)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
              <div className="p-2.5 bg-[#F0FDF4] rounded-lg border border-[#DCFCE7]">
                <span className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider block">
                  Amount Paid
                </span>
                <span className="text-sm font-bold text-[#15803D] tabular-nums">
                  {formatCurrency(totalPaidMinor)}
                </span>
              </div>

              <div className="p-2.5 bg-[#FFFBEB] rounded-lg border border-[#FEF3C7]">
                <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider block">
                  Balance Due
                </span>
                <span className="text-sm font-bold text-[#B45309] tabular-nums">
                  {formatCurrency(balanceDueMinor)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Snapshot Card */}
      <Card>
        <CardHeader
          title="Line Items Snapshot"
          subtitle="Fixed prices, unit costs, and item descriptions frozen at transaction checkout"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-center">Quantity</th>
                <th className="px-5 py-3 text-right">Line Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {(sale.items || []).map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#0F172A]">
                    {item.product_name_snapshot}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#64748B]">
                    {item.sku_snapshot || '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-[#475569] tabular-nums">
                    {formatCurrency(item.unit_price_minor)}
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-[#0F172A] tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                    {formatCurrency(item.line_subtotal_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payments Ledger Card */}
      <Card>
        <CardHeader
          title="Payment History Ledger"
          subtitle="Append-only record of all settlements received against this order"
          action={
            sale.status !== 'CANCELLED' && balanceDueMinor > 0 ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                onClick={handleOpenPaymentModal}
              >
                Record payment
              </Button>
            ) : undefined
          }
        />
        <div className="overflow-x-auto">
          {(sale.payments || []).length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B]">
              No payments recorded yet. Record an advance deposit or full settlement.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Receipt ID</th>
                  <th className="px-5 py-3">Payment Date</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Reference / Slip</th>
                  <th className="px-5 py-3">Notes</th>
                  <th className="px-5 py-3 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sale.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-[#64748B]">
                      {p.id.slice(0, 14)}
                    </td>
                    <td className="px-5 py-3 text-[#334155]">{formatDate(p.payment_date)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#334155]">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#64748B] font-mono text-[11px]">
                      {p.reference || '—'}
                    </td>
                    <td className="px-5 py-3 text-[#64748B]">{p.note || '—'}</td>
                    <td className="px-5 py-3 text-right font-bold text-[#059669] tabular-nums">
                      {formatCurrency(p.amount_minor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => !isRecordingPayment && setIsPaymentModalOpen(false)}
          title={`Record Payment — ${sale.sale_number}`}
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
                  placeholder="UPI ref or cheque #"
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
                placeholder="e.g. Cleared via counter register"
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

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => !isCancelling && setIsCancelModalOpen(false)}
          title={`Cancel Order — ${sale.sale_number}`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isCancelling}
                onClick={() => setIsCancelModalOpen(false)}
              >
                Keep active
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isCancelling}
                leftIcon={
                  isCancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )
                }
                onClick={handleConfirmCancel}
              >
                {isCancelling ? 'Restoring Stock...' : 'Confirm cancellation'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626] leading-relaxed">
              <strong>Stock Reversal Notice:</strong> Cancelling order{' '}
              <strong className="text-[#991B1B]">{sale.sale_number}</strong> will restore all{' '}
              {sale.items?.length || 0} line items back to available inventory and log reversal
              movements.
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Reason for cancellation <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                <option value="Customer requested return">Customer requested return / cancelled</option>
                <option value="Billing or pricing correction">Billing or pricing correction</option>
                <option value="Duplicate order test">Duplicate order created in error</option>
                <option value="Product unavailable">Product damage prior to dispatch</option>
                <option value="Other">Other custom reason</option>
              </select>
            </div>

            {cancelReason === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Specify details
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter cancellation explanation..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
