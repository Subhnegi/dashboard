import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FileText,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import {
  formatCurrency,
  formatDate,
  getSalePaymentStatus,
  getSaleBalanceDue,
} from '../../lib/formatters';

export const InvoicesListView: React.FC = () => {
  const { sales, settings } = useDemoData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Invoice KPIs
  const metrics = useMemo(() => {
    let totalInvoicedMinor = 0;
    let totalPaidMinor = 0;
    let totalBalanceMinor = 0;
    let paidCount = 0;

    for (const s of sales) {
      if (s.status === 'CONFIRMED') {
        totalInvoicedMinor += s.total_minor;
        const bal = getSaleBalanceDue(s);
        totalBalanceMinor += bal;
        const paid = (s.payments || []).reduce((acc, p) => acc + p.amount_minor, 0);
        totalPaidMinor += paid;
        if (getSalePaymentStatus(s) === 'PAID') {
          paidCount++;
        }
      }
    }

    return {
      totalCount: sales.length,
      totalInvoicedMinor,
      totalPaidMinor,
      totalBalanceMinor,
      paidCount,
    };
  }, [sales]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((s) => {
      const q = searchQuery.toLowerCase();
      const prefix = settings.invoice_prefix || 'INV-';
      const invNum = s.sale_number.replace('ORD-', prefix).toLowerCase();
      const matchesSearch =
        s.sale_number.toLowerCase().includes(q) ||
        invNum.includes(q) ||
        s.customer_name_snapshot.toLowerCase().includes(q);

      const payStatus = getSalePaymentStatus(s);
      const matchesFilter = statusFilter === 'ALL' || payStatus === statusFilter;

      let matchesDate = true;
      const saleTime = new Date(s.sale_date).getTime();
      if (dateFilter === 'TODAY') {
        matchesDate = saleTime >= todayStart;
      } else if (dateFilter === '7D') {
        matchesDate = saleTime >= sevenDaysAgo;
      } else if (dateFilter === '30D') {
        matchesDate = saleTime >= thirtyDaysAgo;
      } else if (dateFilter === 'MONTH') {
        matchesDate = saleTime >= monthStart;
      }

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [sales, searchQuery, statusFilter, dateFilter, settings.invoice_prefix]);

  // Sort invoices
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
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
  }, [filteredInvoices, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedInvoices.slice(start, start + pageSize);
  }, [sortedInvoices, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Total Invoices</span>
            <FileText className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
            {metrics.totalCount}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Generated billings</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Total Billed</span>
            <TrendingUp className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-xl font-bold text-[#059669] mt-1 tabular-nums">
            {formatCurrency(metrics.totalInvoicedMinor)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Gross invoice value</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Collected</span>
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold text-[#2563EB] mt-1 tabular-nums">
            {formatCurrency(metrics.totalPaidMinor)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Cleared payments</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Pending Receivables</span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-xl font-bold text-[#D97706] mt-1 tabular-nums">
            {formatCurrency(metrics.totalBalanceMinor)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Unpaid balance</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="MONTH">This Month</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>

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
        </div>
      </div>

      {/* Invoices List Table */}
      <Card>
        {sortedInvoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-5 h-5" />}
            title="No invoices found"
            description="Invoices are automatically created and formatted when customer orders are placed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Invoice Number</th>
                  <th className="px-5 py-3">Billed Customer</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3 text-right">Invoice Total</th>
                  <th className="px-5 py-3 text-right">Paid</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginatedInvoices.map((inv) => {
                  const payStatus = getSalePaymentStatus(inv);
                  const balanceDue = getSaleBalanceDue(inv);
                  const paid = (inv.payments || []).reduce((acc, p) => acc + p.amount_minor, 0);
                  const prefix = settings.invoice_prefix || 'INV-';
                  const invoiceNumber = `${prefix}${inv.sale_number.replace('ORD-', '')}`;

                  return (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#0F172A]">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="hover:text-[#2563EB] transition-colors"
                        >
                          {invoiceNumber}
                        </Link>
                      </td>

                      <td className="px-5 py-3.5 text-[#0F172A] font-medium">
                        {inv.customer_name_snapshot}
                      </td>

                      <td className="px-5 py-3.5 text-[#64748B]">
                        {formatDate(inv.sale_date)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-[#0F172A] tabular-nums">
                        {formatCurrency(inv.total_minor)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-medium text-[#059669] tabular-nums">
                        {formatCurrency(paid)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-xs tabular-nums">
                        {balanceDue > 0 ? (
                          <span className="text-[#D97706]">{formatCurrency(balanceDue)}</span>
                        ) : (
                          <span className="text-[#059669]">₹0.00</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Badge paymentStatus={payStatus} size="sm" />
                          {inv.status === 'CANCELLED' && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          View & Print <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {sortedInvoices.length > 0 && (
          <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
            <div>
              Showing{' '}
              <strong className="text-[#0F172A]">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-[#0F172A]">
                {Math.min(currentPage * pageSize, sortedInvoices.length)}
              </strong>{' '}
              of <strong className="text-[#0F172A]">{sortedInvoices.length}</strong> invoices
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
    </div>
  );
};
