import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getSalePaymentStatus,
  getSaleBalanceDue,
} from '../../lib/formatters';

export const SaleDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { sales, addPayment, cancelSale } = useDemoData();

  const sale = sales.find((s) => s.id === id);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmountRupees, setPayAmountRupees] = useState('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER'>('UPI');
  const [payRef, setPayRef] = useState('');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer cancellation request');

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-[#64748B]">Sale order record not found.</p>
        <Link to="/sales" className="text-xs font-semibold text-[#2563EB] mt-2 inline-block">
          Return to sales
        </Link>
      </div>
    );
  }

  const payStatus = getSalePaymentStatus(sale);
  const balanceDueMinor = getSaleBalanceDue(sale);
  const totalPaidMinor = (sale.payments || []).reduce((acc, p) => acc + p.amount_minor, 0);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = Math.round((parseFloat(payAmountRupees) || 0) * 100);
    if (amountMinor <= 0 || amountMinor > balanceDueMinor) {
      return;
    }

    addPayment(sale.id, {
      amount_minor: amountMinor,
      payment_date: new Date().toISOString(),
      method: payMethod,
      reference: payRef || undefined,
      note: undefined,
    });

    setIsPaymentModalOpen(false);
    setPayAmountRupees('');
  };

  const handleConfirmCancel = () => {
    cancelSale(sale.id, cancelReason);
    setIsCancelModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sales list</span>
        </Link>
      </div>

      {/* Sale Order Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">{sale.sale_number}</h1>
            <Badge saleStatus={sale.status} size="sm" />
            <Badge paymentStatus={payStatus} size="sm" />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Placed on {formatDateTime(sale.sale_date)} • Customer:{' '}
            <strong className="text-[#0F172A]">{sale.customer_name_snapshot}</strong>
          </p>
          {sale.cancelled_at && (
            <p className="text-xs text-[#DC2626] mt-1 bg-[#FEF2F2] p-2 rounded border border-[#FECACA]">
              Cancelled on {formatDate(sale.cancelled_at)}: {sale.cancellation_reason}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link to={`/invoices/${sale.id}`}>
            <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
              View invoice
            </Button>
          </Link>

          {sale.status !== 'CANCELLED' && balanceDueMinor > 0 && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={() => {
                setPayAmountRupees((balanceDueMinor / 100).toFixed(2));
                setIsPaymentModalOpen(true);
              }}
            >
              Record payment
            </Button>
          )}

          {sale.status !== 'CANCELLED' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
            >
              Cancel sale
            </Button>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <Card>
        <CardHeader
          title="Line Items Snapshot"
          subtitle="Fixed pricing and item specifications captured at checkout"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-right">Unit Rate</th>
                <th className="px-5 py-3 text-center">Quantity</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {sale.items.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-5 py-3 font-semibold text-[#0F172A]">
                    {item.product_name_snapshot}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#64748B]">
                    {item.sku_snapshot}
                  </td>
                  <td className="px-5 py-3 text-right text-[#64748B] tabular-nums">
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

      {/* Financials & Payments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payments History */}
        <Card>
          <CardHeader
            title="Recorded Payments"
            subtitle="Append-only transaction log for this order"
          />
          <div className="p-4 space-y-2.5">
            {sale.payments.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No payments recorded yet.</p>
            ) : (
              sale.payments.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#0F172A] block tabular-nums">
                      {p.method} — {formatCurrency(p.amount_minor)}
                    </span>
                    <span className="text-[#64748B] text-[10px]">
                      {formatDate(p.payment_date)} {p.reference ? `• Ref: ${p.reference}` : ''}
                    </span>
                  </div>
                  <Badge variant="success" size="sm">
                    Cleared
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader title="Financial Breakdown" />
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-[#64748B]">Subtotal:</span>
              <span className="font-medium text-[#0F172A] tabular-nums">{formatCurrency(sale.subtotal_minor)}</span>
            </div>
            {sale.discount_minor > 0 && (
              <div className="flex justify-between py-1 text-[#DC2626]">
                <span>Discount:</span>
                <span className="tabular-nums">-{formatCurrency(sale.discount_minor)}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-[#64748B]">GST (Tax):</span>
              <span className="font-medium text-[#0F172A] tabular-nums">{formatCurrency(sale.tax_minor)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-sm border-t border-[#E2E8F0]">
              <span className="text-[#0F172A]">Order Grand Total:</span>
              <span className="text-[#2563EB] tabular-nums">{formatCurrency(sale.total_minor)}</span>
            </div>
            <div className="flex justify-between py-1 text-xs text-[#059669]">
              <span>Amount Paid:</span>
              <span className="tabular-nums font-semibold">{formatCurrency(totalPaidMinor)}</span>
            </div>
            <div className="flex justify-between py-1 text-xs font-bold text-[#B45309]">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatCurrency(balanceDueMinor)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment — ${sale.sale_number}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRecordPayment}>
              Save payment
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-3.5">
          <div className="p-3 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE] text-xs text-[#1E40AF] flex items-center justify-between">
            <span>Outstanding Balance:</span>
            <span className="font-bold tabular-nums">{formatCurrency(balanceDueMinor)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Amount to collect (₹)
            </label>
            <input
              type="number"
              step="0.01"
              max={(balanceDueMinor / 100).toFixed(2)}
              value={payAmountRupees}
              onChange={(e) => setPayAmountRupees(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="UPI">UPI</option>
                <option value="CARD">Card POS</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Reference ID
              </label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Slip or UPI ref"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Order Cancellation"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Keep active
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmCancel}>
              Cancel order & restore stock
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#334155] leading-relaxed">
          <p>
            Are you sure you want to cancel order <strong className="text-[#0F172A]">{sale.sale_number}</strong>?
          </p>
          <p className="text-[#64748B]">
            This will create reversal stock movements and restore quantities for all items.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">Reason</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
