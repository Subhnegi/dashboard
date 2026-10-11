import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDate,
  getSalePaymentStatus,
} from '../../lib/formatters';

export const CustomerDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, sales } = useDemoData();

  const customer = customers.find((c) => c.id === id);
  const customerSales = sales.filter((s) => s.customer_id === id);

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-[#64748B]">Customer account not found.</p>
        <Link to="/customers" className="text-xs font-semibold text-[#2563EB] mt-2 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  const totalSpentMinor = customerSales
    .filter((s) => s.status === 'CONFIRMED')
    .reduce((sum, s) => sum + s.total_minor, 0);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to customer directory</span>
        </Link>
      </div>

      {/* Customer Hero Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] mt-1">
              {customer.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
            {customer.billing_address && (
              <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>{customer.billing_address}</span>
              </div>
            )}
            {customer.notes && (
              <p className="text-xs text-[#64748B] mt-1.5 italic bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                Terms: {customer.notes}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => navigate('/sales/new')}
        >
          Create order
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Lifetime Purchases
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {formatCurrency(totalSpentMinor)}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Across confirmed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Total Sales Orders
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {customerSales.length}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Recorded order transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales History Table */}
      <Card>
        <CardHeader
          title="Order History"
          subtitle="All transactions associated with this customer account"
        />
        <div className="overflow-x-auto">
          {customerSales.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B]">
              No sales orders recorded for this customer account.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Sale Date</th>
                  <th className="px-5 py-3 text-right">Order Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {customerSales.map((sale) => {
                  const payStatus = getSalePaymentStatus(sale);
                  return (
                    <tr key={sale.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#0F172A]">
                        <Link to={`/sales/${sale.id}`} className="hover:text-[#2563EB]">
                          {sale.sale_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[#64748B]">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                        {formatCurrency(sale.total_minor)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge paymentStatus={payStatus} size="sm" />
                      </td>
                      <td className="px-5 py-3">
                        <Badge saleStatus={sale.status} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/sales/${sale.id}`}
                            className="text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            Order
                          </Link>
                          <span className="text-[#CBD5E1]">•</span>
                          <Link
                            to={`/invoices/${sale.id}`}
                            className="text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            Invoice
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
