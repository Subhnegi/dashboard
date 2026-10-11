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
        <p className="text-sm text-[#667085]">Customer profile not found.</p>
        <Link to="/customers" className="text-xs font-semibold text-[#5546D7] mt-2 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  const totalSpentMinor = customerSales
    .filter((s) => s.status === 'CONFIRMED')
    .reduce((sum, s) => sum + s.total_minor, 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to customer directory</span>
        </Link>
      </div>

      {/* Customer Hero Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EEECFB] text-[#5546D7] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">{customer.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] mt-1.5">
              {customer.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
            {customer.billing_address && (
              <div className="flex items-center gap-1.5 text-xs text-[#667085] mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#98A2B3]" />
                <span>{customer.billing_address}</span>
              </div>
            )}
            {customer.notes && (
              <p className="text-xs text-[#667085] mt-2 italic bg-[#F9FAFB] p-2 rounded-lg">
                Notes: {customer.notes}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/sales/new')}
        >
          New sale
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Total Lifetime Purchases
            </span>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {formatCurrency(totalSpentMinor)}
            </div>
            <p className="text-xs text-[#667085] mt-1">Across all confirmed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Total Order Transactions
            </span>
            <div className="text-2xl font-bold text-[#172033] mt-2">
              {customerSales.length}
            </div>
            <p className="text-xs text-[#667085] mt-1">Recorded sales history</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales History Table */}
      <Card>
        <CardHeader
          title="Sales & Orders History"
          subtitle="Orders placed by this client account"
        />
        <div className="overflow-x-auto">
          {customerSales.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#667085]">
              No sales recorded for this customer yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Sale Date</th>
                  <th className="px-5 py-3 text-right">Order Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {customerSales.map((sale) => {
                  const payStatus = getSalePaymentStatus(sale);
                  return (
                    <tr key={sale.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#172033]">
                        <Link to={`/sales/${sale.id}`} className="hover:text-[#5546D7]">
                          {sale.sale_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#667085]">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-[#172033]">
                        {formatCurrency(sale.total_minor)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge paymentStatus={payStatus} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge saleStatus={sale.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/sales/${sale.id}`}
                            className="text-xs font-semibold text-[#5546D7] hover:underline"
                          >
                            Order
                          </Link>
                          <span>•</span>
                          <Link
                            to={`/invoices/${sale.id}`}
                            className="text-xs font-semibold text-[#5546D7] hover:underline"
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
