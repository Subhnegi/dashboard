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
        <p className="text-sm text-[#667085]">Sale order not found.</p>
        <Link to="/sales" className="text-xs font-semibold text-[#5546D7] mt-2 inline-block">
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
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sales list</span>
        </Link>
      </div>

      {/* Sale Order Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">{sale.sale_number}</h2>
            <Badge saleStatus={sale.status} />
            <Badge paymentStatus={payStatus} />
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Created on {formatDateTime(sale.sale_date)} • Customer:{' '}
            <strong className="text-[#172033]">{sale.customer_name_snapshot}</strong>
          </p>
          {sale.cancelled_at && (
            <p className="text-xs text-[#B42318] mt-1 bg-[#FEF3F2] p-2 rounded-lg">
              Cancelled on {formatDate(sale.cancelled_at)}: {sale.cancellation_reason}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link to={`/invoices/${sale.id}`}>
            <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
              View invoice
            </Button>
          </Link>

          {sale.status !== 'CANCELLED' && balanceDueMinor > 0 && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CreditCard className="w-4 h-4" />}
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
          subtitle="Fixed prices captured at the time of sale"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-center">Quantity</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {sale.items.map((item) => (
                <tr key={item.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-5 py-3.5 font-medium text-[#172033]">
                    {item.product_name_snapshot}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[#667085]">
                    {item.sku_snapshot}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-[#667085]">
                    {formatCurrency(item.unit_price_minor)}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-[#172033]">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#172033]">
                    {formatCurrency(item.line_subtotal_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financials & Payments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payments History */}
        <Card>
          <CardHeader
            title="Recorded Payments"
            subtitle="Append-only transaction log for this sale"
          />
          <div className="p-5 space-y-3">
            {sale.payments.length === 0 ? (
              <p className="text-xs text-[#667085] italic">No payments recorded yet.</p>
            ) : (
              sale.payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#172033] block">
                      {p.method} — {formatCurrency(p.amount_minor)}
                    </span>
                    <span className="text-[#667085] text-[11px]">
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
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Subtotal:</span>
              <span className="font-medium text-[#172033]">{formatCurrency(sale.subtotal_minor)}</span>
            </div>
            {sale.discount_minor > 0 && (
              <div className="flex justify-between py-1 text-[#B42318]">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discount_minor)}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-[#667085]">GST (Tax):</span>
              <span className="font-medium text-[#172033]">{formatCurrency(sale.tax_minor)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-base border-t border-[#E5E7EB]">
              <span>Grand Total:</span>
              <span className="text-[#5546D7]">{formatCurrency(sale.total_minor)}</span>
            </div>
            <div className="flex justify-between py-1 text-xs text-[#027A48]">
              <span>Amount Paid:</span>
              <span>{formatCurrency(totalPaidMinor)}</span>
            </div>
            <div className="flex justify-between py-1 text-xs font-bold text-[#B54708]">
              <span>Balance Due:</span>
              <span>{formatCurrency(balanceDueMinor)}</span>
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
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecordPayment}>
              Save payment
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-[#EEECFB] rounded-xl text-xs text-[#5546D7] flex items-center justify-between">
            <span>Outstanding Balance:</span>
            <span className="font-bold">{formatCurrency(balanceDueMinor)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Amount to collect (₹)
            </label>
            <input
              type="number"
              step="0.01"
              max={(balanceDueMinor / 100).toFixed(2)}
              value={payAmountRupees}
              onChange={(e) => setPayAmountRupees(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
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
                Transaction Reference
              </label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Slip or UPI ID"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Cancellation"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Cancel order & restore stock
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-[#344054]">
          <p>
            Are you sure you want to cancel order <strong>{sale.sale_number}</strong>?
          </p>
          <p className="text-xs text-[#667085]">
            This will create reversal stock movements and restore quantities for all line items.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Reason</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
