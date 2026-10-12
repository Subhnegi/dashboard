import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
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
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Cancel modal state
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested return');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Compute KPI metrics for current sales
  const metrics = useMemo(() => {
    let totalSalesMinor = 0;
    let totalBalanceDueMinor = 0;
    let confirmedCount = 0;
    let paidCount = 0;

    for (const s of sales) {
      if (s.status === 'CONFIRMED') {
        confirmedCount++;
        totalSalesMinor += s.total_minor;
        const bal = getSaleBalanceDue(s);
        totalBalanceDueMinor += bal;
        if (getSalePaymentStatus(s) === 'PAID') {
          paidCount++;
        }
      }
    }

    return {
      totalOrders: sales.length,
      confirmedCount,
      totalSalesMinor,
      totalBalanceDueMinor,
      paidCount,
    };
  }, [sales]);

  // Filter logic
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.sale_number.toLowerCase().includes(q) ||
        s.customer_name_snapshot.toLowerCase().includes(q);

      const payStatus = getSalePaymentStatus(s);
      const matchesPayment = paymentFilter === 'ALL' || payStatus === paymentFilter;

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

      // Date range filter
      let matchesDate = true;
      const saleTime = new Date(s.sale_date).getTime();
      if (dateRangeFilter === 'TODAY') {
        matchesDate = saleTime >= todayStart;
      } else if (dateRangeFilter === '7D') {
        matchesDate = saleTime >= sevenDaysAgo;
      } else if (dateRangeFilter === '30D') {
        matchesDate = saleTime >= thirtyDaysAgo;
      } else if (dateRangeFilter === 'MONTH') {
        matchesDate = saleTime >= monthStart;
      }

      return matchesSearch && matchesPayment && matchesStatus && matchesDate;
    });
  }, [sales, searchQuery, paymentFilter, statusFilter, dateRangeFilter]);

  // Sorting logic
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime();
        case 'total-desc':
          return b.total_minor - a.total_minor;
        case 'total-asc':
          return a.total_minor - b.total_minor;
        case 'customer-asc':
          return a.customer_name_snapshot.localeCompare(b.customer_name_snapshot);
        case 'date-desc':
        default:
          return new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime();
      }
    });
  }, [filteredSales, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(sortedSales.length / pageSize) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSales.slice(start, start + pageSize);
  }, [sortedSales, currentPage, pageSize]);

  const handleConfirmCancel = async () => {
    if (!cancellingSale) return;
    const effectiveReason =
      cancelReason === 'Other' ? customReason.trim() || 'Manual cancellation' : cancelReason;
    setIsCancelling(true);
    try {
      await cancelSale(cancellingSale.id, effectiveReason);
      setCancellingSale(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
            {metrics.totalOrders}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {metrics.confirmedCount} active orders
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-xl font-bold text-[#059669] mt-1 tabular-nums">
            {formatCurrency(metrics.totalSalesMinor)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Confirmed gross volume</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Outstanding Balance</span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-xl font-bold text-[#D97706] mt-1 tabular-nums">
            {formatCurrency(metrics.totalBalanceDueMinor)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Pending collection</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Paid Orders</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
            {metrics.paidCount}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Settled in full</div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number (e.g. ORD-2026) or customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="MONTH">This Month</option>
          </select>

          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          {/* Order status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Orders</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Sort order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="total-desc">Total: High to Low</option>
            <option value="total-asc">Total: Low to High</option>
            <option value="customer-asc">Customer A-Z</option>
          </select>

          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/sales/new')}
          >
            Create sale
          </Button>
        </div>
      </div>

      {/* Orders Table Card */}
      <Card>
        {sortedSales.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-5 h-5" />}
            title="No sales orders found"
            description="No orders match your filter criteria. Process a new order or adjust filters."
            actionLabel="Create new sale"
            onAction={() => navigate('/sales/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Sale Date</th>
                  <th className="px-5 py-3 text-right">Total (INR)</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Order Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginatedSales.map((sale) => {
                  const payStatus = getSalePaymentStatus(sale);
                  const balanceDue = getSaleBalanceDue(sale);
                  const isCancelled = sale.status === 'CANCELLED';
                  const itemsCount = sale.items?.length || 0;

                  return (
                    <tr key={sale.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#0F172A]">
                        <Link to={`/sales/${sale.id}`} className="hover:text-[#2563EB] transition-colors">
                          {sale.sale_number}
                        </Link>
                      </td>

                      <td className="px-5 py-3.5 text-[#334155]">
                        <div className="font-medium text-[#0F172A]">{sale.customer_name_snapshot}</div>
                        <div className="text-[10px] text-[#64748B]">
                          {itemsCount} line item{itemsCount !== 1 ? 's' : ''}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-[#64748B]">
                        {formatDate(sale.sale_date)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-[#0F172A] tabular-nums">
                        {formatCurrency(sale.total_minor)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                        {balanceDue > 0 ? (
                          <span className="text-[#D97706]">{formatCurrency(balanceDue)}</span>
                        ) : (
                          <span className="text-[#059669]">₹0.00</span>
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
                            className="text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            View
                          </Link>
                          <span className="text-[#CBD5E1]">•</span>
                          <Link
                            to={`/invoices/${sale.id}`}
                            className="text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            Invoice
                          </Link>
                          {!isCancelled && (
                            <>
                              <span className="text-[#CBD5E1]">•</span>
                              <button
                                onClick={() => {
                                  setCancellingSale(sale);
                                  setCancelReason('Customer requested return');
                                  setCustomReason('');
                                }}
                                className="text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
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

        {/* Pagination Footer */}
        {sortedSales.length > 0 && (
          <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
            <div>
              Showing{' '}
              <strong className="text-[#0F172A]">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-[#0F172A]">
                {Math.min(currentPage * pageSize, sortedSales.length)}
              </strong>{' '}
              of <strong className="text-[#0F172A]">{sortedSales.length}</strong> orders
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Button>

              <span className="px-2 font-medium text-[#0F172A]">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Cancel Sale Modal */}
      {cancellingSale && (
        <Modal
          isOpen={!!cancellingSale}
          onClose={() => !isCancelling && setCancellingSale(null)}
          title={`Cancel Order — ${cancellingSale.sale_number}`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isCancelling}
                onClick={() => setCancellingSale(null)}
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
              <strong className="text-[#991B1B]">{cancellingSale.sale_number}</strong> will
              restore {cancellingSale.items?.length || 0} line item quantities back into catalog
              inventory and create immutable stock reversal audit movement records.
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
