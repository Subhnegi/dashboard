import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDate,
  getSalePaymentStatus,
  getSaleBalanceDue,
} from '../../lib/formatters';

export const InvoiceDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { sales, settings } = useDemoData();

  const sale = sales.find((s) => s.id === id);

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#667085]">Invoice not found.</p>
        <Link to="/invoices" className="text-xs font-semibold text-[#5546D7] mt-2 inline-block">
          Return to invoices
        </Link>
      </div>
    );
  }

  const payStatus = getSalePaymentStatus(sale);
  const balanceDueMinor = getSaleBalanceDue(sale);
  const totalPaidMinor = (sale.payments || []).reduce((acc, p) => acc + p.amount_minor, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex items-center justify-between">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to invoices</span>
        </Link>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Printer className="w-4 h-4" />}
          onClick={handlePrint}
        >
          Print / Save PDF
        </Button>
      </div>

      {/* Printable Invoice Container */}
      <div className="print-container bg-white p-8 sm:p-12 rounded-2xl border border-[#E5E7EB] shadow-sm text-[#172033]">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#5546D7] text-white flex items-center justify-center font-bold">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{settings.business_name}</h2>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed max-w-sm">
              {settings.address}
              <br />
              Email: {settings.email} • Tel: {settings.phone}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h3 className="text-xl font-bold text-[#5546D7] uppercase tracking-wider">
              TAX INVOICE
            </h3>
            <p className="font-mono text-sm font-semibold">{sale.sale_number}</p>
            <p className="text-xs text-[#667085]">
              Issue Date: {formatDate(sale.sale_date)}
            </p>
            <div className="pt-1">
              <Badge paymentStatus={payStatus} />
            </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[#E5E7EB] text-xs">
          <div>
            <h4 className="font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
              Billed To:
            </h4>
            <p className="text-sm font-bold text-[#172033]">{sale.customer_name_snapshot}</p>
            {sale.customer_contact_snapshot && (
              <p className="text-[#667085] mt-0.5">{sale.customer_contact_snapshot}</p>
            )}
            {sale.notes && (
              <p className="text-[#667085] mt-1 italic">Order note: {sale.notes}</p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <h4 className="font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
              Payment Terms:
            </h4>
            <p className="text-[#344054]">Due on Receipt / Standard Terms</p>
            <p className="text-[#667085]">Currency: INR (Indian Rupee - ₹)</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 border-b border-[#E5E7EB]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#667085] uppercase">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5">SKU</th>
                <th className="py-2.5 text-right">Price</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium">{item.product_name_snapshot}</td>
                  <td className="py-3 font-mono text-xs text-[#667085]">{item.sku_snapshot}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unit_price_minor)}</td>
                  <td className="py-3 text-center font-semibold">{item.quantity}</td>
                  <td className="py-3 text-right font-bold">
                    {formatCurrency(item.line_subtotal_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Payments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div className="text-xs text-[#667085] space-y-2">
            <h4 className="font-semibold text-[#172033]">Recorded Payments:</h4>
            {sale.payments.length === 0 ? (
              <p className="italic">No payment received yet.</p>
            ) : (
              sale.payments.map((p) => (
                <div key={p.id} className="flex justify-between py-1 border-b border-[#F2F4F7]">
                  <span>
                    {p.method} ({formatDate(p.payment_date)})
                  </span>
                  <span className="font-semibold text-[#027A48]">
                    {formatCurrency(p.amount_minor)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 text-sm text-right">
            <div className="flex justify-between text-xs py-1">
              <span className="text-[#667085]">Subtotal (taxable):</span>
              <span className="font-medium">{formatCurrency(sale.subtotal_minor)}</span>
            </div>
            {sale.discount_minor > 0 && (
              <div className="flex justify-between text-xs py-1 text-[#B42318]">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discount_minor)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1">
              <span className="text-[#667085]">
                GST ({settings.default_tax_rate_basis_points / 100}%):
              </span>
              <span className="font-medium">{formatCurrency(sale.tax_minor)}</span>
            </div>
            <div className="flex justify-between text-base font-bold py-2 border-t-2 border-[#172033]">
              <span>Invoice Total:</span>
              <span className="text-[#5546D7]">{formatCurrency(sale.total_minor)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold py-1 text-[#027A48]">
              <span>Total Paid:</span>
              <span>{formatCurrency(totalPaidMinor)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold py-1 text-[#B54708]">
              <span>Balance Due:</span>
              <span>{formatCurrency(balanceDueMinor)}</span>
            </div>
          </div>
        </div>

        {/* Demo Footer Note */}
        <div className="mt-12 pt-6 border-t border-[#E5E7EB] text-center text-[11px] text-[#98A2B3]">
          <p>
            Thank you for your business. For billing queries, contact {settings.email}.
          </p>
          <p className="mt-1 italic">
            This document is a portfolio demonstration invoice. Values and calculations are for demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );
};
