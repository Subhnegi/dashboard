import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Layers } from 'lucide-react';
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
        <p className="text-xs text-[#64748B]">Invoice record not found.</p>
        <Link to="/invoices" className="text-xs font-semibold text-[#2563EB] mt-2 inline-block">
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
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex items-center justify-between">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to invoices</span>
        </Link>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Printer className="w-3.5 h-3.5" />}
          onClick={handlePrint}
        >
          Print / Save PDF
        </Button>
      </div>

      {/* Printable Invoice Container */}
      <div className="print-container bg-white p-8 sm:p-10 rounded-xl border border-[#E2E8F0] shadow-xs text-[#0F172A]">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-5 pb-6 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-md bg-[#0F172A] text-white flex items-center justify-center font-bold shadow-2xs">
                <Layers className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">{settings.business_name}</h2>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
              {settings.address}
              <br />
              Email: {settings.email} • Tel: {settings.phone}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h3 className="text-lg font-bold text-[#2563EB] uppercase tracking-wider">
              TAX INVOICE
            </h3>
            <p className="font-mono text-xs font-bold text-[#0F172A]">{sale.sale_number}</p>
            <p className="text-xs text-[#64748B]">
              Issue Date: {formatDate(sale.sale_date)}
            </p>
            <div className="pt-1">
              <Badge paymentStatus={payStatus} size="sm" />
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
            {sale.notes && (
              <p className="text-[#64748B] mt-1 italic">Order note: {sale.notes}</p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <h4 className="font-bold text-[#64748B] uppercase tracking-wider text-[10px] mb-1">
              Payment Terms:
            </h4>
            <p className="text-[#334155] font-medium">Due on Receipt / Standard Terms</p>
            <p className="text-[#64748B]">Currency: INR (Indian Rupee - ₹)</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-5 border-b border-[#E2E8F0]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-2">Item Description</th>
                <th className="py-2">SKU</th>
                <th className="py-2 text-right">Unit Rate</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 font-medium text-[#0F172A]">{item.product_name_snapshot}</td>
                  <td className="py-2.5 font-mono text-[11px] text-[#64748B]">{item.sku_snapshot}</td>
                  <td className="py-2.5 text-right tabular-nums text-[#64748B]">{formatCurrency(item.unit_price_minor)}</td>
                  <td className="py-2.5 text-center font-bold text-[#0F172A] tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 text-right font-bold text-[#0F172A] tabular-nums">
                    {formatCurrency(item.line_subtotal_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Payments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
          <div className="text-xs text-[#64748B] space-y-2">
            <h4 className="font-bold text-[#0F172A] text-[11px] uppercase tracking-wider">Payments Received:</h4>
            {sale.payments.length === 0 ? (
              <p className="italic text-[11px]">No payment recorded yet.</p>
            ) : (
              sale.payments.map((p) => (
                <div key={p.id} className="flex justify-between py-1 border-b border-[#F1F5F9] text-xs">
                  <span>
                    {p.method} ({formatDate(p.payment_date)})
                  </span>
                  <span className="font-semibold text-[#059669] tabular-nums">
                    {formatCurrency(p.amount_minor)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-1.5 text-xs text-right">
            <div className="flex justify-between py-0.5">
              <span className="text-[#64748B]">Subtotal (taxable):</span>
              <span className="font-medium text-[#0F172A] tabular-nums">{formatCurrency(sale.subtotal_minor)}</span>
            </div>
            {sale.discount_minor > 0 && (
              <div className="flex justify-between py-0.5 text-[#DC2626]">
                <span>Discount:</span>
                <span className="tabular-nums">-{formatCurrency(sale.discount_minor)}</span>
              </div>
            )}
            <div className="flex justify-between py-0.5">
              <span className="text-[#64748B]">
                GST ({settings.default_tax_rate_basis_points / 100}%):
              </span>
              <span className="font-medium text-[#0F172A] tabular-nums">{formatCurrency(sale.tax_minor)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold py-1.5 border-t border-[#0F172A] text-[#0F172A]">
              <span>Invoice Total:</span>
              <span className="text-[#2563EB] tabular-nums">{formatCurrency(sale.total_minor)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold py-0.5 text-[#059669]">
              <span>Amount Paid:</span>
              <span className="tabular-nums">{formatCurrency(totalPaidMinor)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold py-0.5 text-[#B45309]">
              <span>Balance Due:</span>
              <span className="tabular-nums">{formatCurrency(balanceDueMinor)}</span>
            </div>
          </div>
        </div>

        {/* Demo Footer Note */}
        <div className="mt-8 pt-4 border-t border-[#E2E8F0] text-center text-[10px] text-[#94A3B8]">
          <p>
            Thank you for your business. For invoice questions, contact {settings.email}.
          </p>
          <p className="mt-0.5 italic">
            Portfolio demonstration tax invoice preview. Values and calculations are for demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );
};
