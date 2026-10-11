import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDate,
  getSalePaymentStatus,
  getSaleBalanceDue,
} from '../../lib/formatters';
import type { Sale } from '../../types';

export const SalesListView: React.FC = () => {
  const navigate = useNavigate();
  const { sales, cancelSale } = useDemoData();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel modal
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested return');

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.sale_number.toLowerCase().includes(q) ||
      s.customer_name_snapshot.toLowerCase().includes(q);

    const payStatus = getSalePaymentStatus(s);
    const matchesPayment = paymentFilter === 'ALL' || payStatus === paymentFilter;

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const handleConfirmCancel = () => {
    if (!cancellingSale) return;
    cancelSale(cancellingSale.id, cancelReason);
    setCancellingSale(null);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5E7EB]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#344054] bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#344054] bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none"
          >
            <option value="ALL">All Orders</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/sales/new')}
          >
            Create sale
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        {filteredSales.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-6 h-6" />}
            title="No sales orders found"
            description="Create sales transactions and generate client invoices."
            actionLabel="Create new sale"
            onAction={() => navigate('/sales/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Total (INR)</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredSales.map((sale) => {
                  const payStatus = getSalePaymentStatus(sale);
                  const balanceDue = getSaleBalanceDue(sale);
                  const isCancelled = sale.status === 'CANCELLED';

                  return (
                    <tr key={sale.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#172033]">
                        <Link to={`/sales/${sale.id}`} className="hover:text-[#5546D7]">
                          {sale.sale_number}
                        </Link>
                      </td>

                      <td className="px-5 py-3.5 text-[#344054]">
                        <div className="font-medium">{sale.customer_name_snapshot}</div>
                        <div className="text-[11px] text-[#667085]">
                          {sale.items.length} line item{sale.items.length > 1 ? 's' : ''}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-[#667085]">
                        {formatDate(sale.sale_date)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-[#172033]">
                        {formatCurrency(sale.total_minor)}
                      </td>

                      <td className="px-5 py-3.5 text-right text-xs font-semibold">
                        {balanceDue > 0 ? (
                          <span className="text-[#B54708]">{formatCurrency(balanceDue)}</span>
                        ) : (
                          <span className="text-[#027A48]">₹0.00</span>
                        )}
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
                            View
                          </Link>
                          <span>•</span>
                          <Link
                            to={`/invoices/${sale.id}`}
                            className="text-xs font-semibold text-[#5546D7] hover:underline"
                          >
                            Invoice
                          </Link>
                          {!isCancelled && (
                            <>
                              <span>•</span>
                              <button
                                onClick={() => setCancellingSale(sale)}
                                className="text-xs font-medium text-[#B42318] hover:underline"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancel Sale Modal */}
      {cancellingSale && (
        <Modal
          isOpen={!!cancellingSale}
          onClose={() => setCancellingSale(null)}
          title={`Cancel Sale ${cancellingSale.sale_number}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setCancellingSale(null)}>
                Keep sale active
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                Confirm cancellation
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-[#344054]">
              Cancelling order{' '}
              <strong className="text-[#172033]">{cancellingSale.sale_number}</strong> for{' '}
              {cancellingSale.customer_name_snapshot} will restore line-item quantities back to
              product stock and mark the invoice as cancelled.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
              >
                <option value="Customer requested return">Customer requested return / cancelled</option>
                <option value="Billing or pricing correction">Billing or pricing correction</option>
                <option value="Duplicate order test">Duplicate order created in error</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
