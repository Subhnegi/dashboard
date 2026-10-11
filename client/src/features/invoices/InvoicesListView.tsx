import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
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
  const { sales } = useDemoData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredInvoices = sales.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.sale_number.toLowerCase().includes(q) ||
      s.customer_name_snapshot.toLowerCase().includes(q);

    const payStatus = getSalePaymentStatus(s);
    const matchesFilter = statusFilter === 'ALL' || payStatus === statusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5E7EB]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-medium text-[#344054] bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none"
        >
          <option value="ALL">All Invoices</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>

      {/* Invoices List */}
      <Card>
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No invoices found"
            description="Invoices are automatically generated when sales orders are processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Invoice Number</th>
                  <th className="px-5 py-3">Billed Customer</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3 text-right">Invoice Total</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                  <th className="px-5 py-3">Payment Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredInvoices.map((inv) => {
                  const payStatus = getSalePaymentStatus(inv);
                  const balanceDue = getSaleBalanceDue(inv);

                  return (
                    <tr key={inv.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#172033]">
                        <Link to={`/invoices/${inv.id}`} className="hover:text-[#5546D7]">
                          {inv.sale_number}
                        </Link>
                      </td>

                      <td className="px-5 py-3.5 text-[#344054] font-medium">
                        {inv.customer_name_snapshot}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-[#667085]">
                        {formatDate(inv.sale_date)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-[#172033]">
                        {formatCurrency(inv.total_minor)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-xs">
                        {balanceDue > 0 ? (
                          <span className="text-[#B54708]">{formatCurrency(balanceDue)}</span>
                        ) : (
                          <span className="text-[#027A48]">₹0.00</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge paymentStatus={payStatus} size="sm" />
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5546D7] hover:underline"
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
      </Card>
    </div>
  );
};
