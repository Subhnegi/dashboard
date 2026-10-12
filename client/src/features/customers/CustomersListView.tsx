import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  Mail,
  Phone,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Customer } from '../../types';

export const CustomersListView: React.FC = () => {
  const navigate = useNavigate();
  const {
    customers,
    addCustomer,
    updateCustomer,
    deactivateCustomer,
    reactivateCustomer,
  } = useDemoData();

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'HAS_BALANCE' | 'SETTLED'>('ALL');
  const [sortBy, setSortBy] = useState<
    'name_asc' | 'name_desc' | 'orders_desc' | 'ltv_desc' | 'balance_desc' | 'date_desc'
  >('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Customer modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addBillingAddress, setAddBillingAddress] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Customer modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBillingAddress, setEditBillingAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Deactivate/Reactivate modal state
  const [statusModalCustomer, setStatusModalCustomer] = useState<Customer | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Filter and sort customer records
  const filteredAndSortedCustomers = useMemo(() => {
    const list = customers.filter((cust) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        (cust.email && cust.email.toLowerCase().includes(q)) ||
        (cust.phone && cust.phone.includes(q)) ||
        (cust.billing_address && cust.billing_address.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && cust.is_active) ||
        (statusFilter === 'INACTIVE' && !cust.is_active);

      const balance = cust.outstanding_balance_minor || 0;
      const matchesBalance =
        balanceFilter === 'ALL' ||
        (balanceFilter === 'HAS_BALANCE' && balance > 0) ||
        (balanceFilter === 'SETTLED' && balance === 0);

      return matchesSearch && matchesStatus && matchesBalance;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'orders_desc':
          return (b.total_sales_count || 0) - (a.total_sales_count || 0);
        case 'ltv_desc':
          return (b.lifetime_value_minor || 0) - (a.lifetime_value_minor || 0);
        case 'balance_desc':
          return (b.outstanding_balance_minor || 0) - (a.outstanding_balance_minor || 0);
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return list;
  }, [customers, searchQuery, statusFilter, balanceFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCustomers.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCustomers = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredAndSortedCustomers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedCustomers, validCurrentPage, itemsPerPage]);

  const hasActiveFilters =
    searchQuery !== '' || statusFilter !== 'ALL' || balanceFilter !== 'ALL' || sortBy !== 'name_asc';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setBalanceFilter('ALL');
    setSortBy('name_asc');
    setCurrentPage(1);
  };

  // Add customer handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!addName.trim()) errs.name = 'Customer name is required';

    if (addEmail.trim() && !/^\S+@\S+\.\S+$/.test(addEmail.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (Object.keys(errs).length > 0) {
      setAddErrors(errs);
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const created = await addCustomer({
        name: addName.trim(),
        phone: addPhone.trim() || undefined,
        email: addEmail.trim() || undefined,
        billing_address: addBillingAddress.trim() || undefined,
        notes: addNotes.trim() || undefined,
        is_active: true,
      });

      setIsAddModalOpen(false);
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setAddBillingAddress('');
      setAddNotes('');
      setAddErrors({});
      navigate(`/customers/${created.id}`);
    } catch {
      // toast shown in context
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit customer setup
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditBillingAddress(customer.billing_address || '');
    setEditNotes(customer.notes || '');
    setEditErrors({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const errs: Record<string, string> = {};
    if (!editName.trim()) errs.name = 'Customer name is required';
    if (editEmail.trim() && !/^\S+@\S+\.\S+$/.test(editEmail.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await updateCustomer(editingCustomer.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        billing_address: editBillingAddress.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setEditingCustomer(null);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Status toggle handler
  const handleToggleStatus = async () => {
    if (!statusModalCustomer) return;
    setIsSubmittingStatus(true);
    try {
      if (statusModalCustomer.is_active) {
        await deactivateCustomer(statusModalCustomer.id);
      } else {
        await reactivateCustomer(statusModalCustomer.id);
      }
      setStatusModalCustomer(null);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Filters & Action Banner */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, telephone, or email address..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="INACTIVE">Deactivated</option>
          </select>

          {/* Balance Filter */}
          <select
            value={balanceFilter}
            onChange={(e) => {
              setBalanceFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Balances</option>
            <option value="HAS_BALANCE">Outstanding Balance (&gt; ₹0)</option>
            <option value="SETTLED">Fully Settled</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="name_asc">Sort: Name (A → Z)</option>
            <option value="name_desc">Sort: Name (Z → A)</option>
            <option value="orders_desc">Sort: Orders (High → Low)</option>
            <option value="ltv_desc">Sort: Purchases (High → Low)</option>
            <option value="balance_desc">Sort: Balance Due (High → Low)</option>
            <option value="date_desc">Sort: Date Joined (Newest)</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setAddName('');
              setAddPhone('');
              setAddEmail('');
              setAddBillingAddress('');
              setAddNotes('');
              setAddErrors({});
              setIsAddModalOpen(true);
            }}
          >
            Add customer
          </Button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <Card>
        {filteredAndSortedCustomers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No customer accounts found"
            description="Adjust your search query, clear active filters, or register a new customer profile."
            actionLabel="Add customer"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-5 py-3">Customer Account</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Billing Address</th>
                    <th className="px-5 py-3 text-center">Orders</th>
                    <th className="px-5 py-3 text-right">Lifetime Purchases</th>
                    <th className="px-5 py-3 text-right">Balance Due</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedCustomers.map((cust) => {
                    const balance = cust.outstanding_balance_minor || 0;
                    return (
                      <tr key={cust.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/customers/${cust.id}`}
                              className="font-semibold text-[#0F172A] hover:text-[#5B50E6] transition-colors line-clamp-1"
                            >
                              {cust.name}
                            </Link>
                            <Badge variant={cust.is_active ? 'success' : 'neutral'} size="sm">
                              {cust.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {cust.notes && (
                            <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">{cust.notes}</p>
                          )}
                        </td>

                        <td className="px-5 py-3 text-xs text-[#334155]">
                          {cust.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#94A3B8]" />
                              <span>{cust.email}</span>
                            </div>
                          )}
                          {cust.phone && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[#64748B]">
                              <Phone className="w-3 h-3 text-[#94A3B8]" />
                              <span>{cust.phone}</span>
                            </div>
                          )}
                          {!cust.email && !cust.phone && (
                            <span className="text-[#94A3B8] italic">Walk-in counter profile</span>
                          )}
                        </td>

                        <td className="px-5 py-3 text-[#64748B] max-w-xs truncate">
                          {cust.billing_address || '—'}
                        </td>

                        <td className="px-5 py-3 text-center font-bold text-[#0F172A] tabular-nums">
                          {cust.total_sales_count || 0}
                        </td>

                        <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                          {formatCurrency(cust.lifetime_value_minor || 0)}
                        </td>

                        <td className="px-5 py-3 text-right tabular-nums">
                          {balance > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                              <AlertCircle className="w-3 h-3" />
                              {formatCurrency(balance)}
                            </span>
                          ) : (
                            <span className="text-[#059669] font-medium text-[11px]">Settled</span>
                          )}
                        </td>

                        <td className="px-5 py-3 text-[#64748B]">
                          {formatDate(cust.created_at)}
                        </td>

                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(cust)}
                              className="px-2 py-1 text-xs font-medium text-[#475569] hover:text-[#5B50E6] hover:bg-[#EEF2FF] rounded-lg transition-colors cursor-pointer"
                              title="Edit customer account"
                            >
                              Edit
                            </button>
                            <Link
                              to={`/customers/${cust.id}`}
                              className="px-2 py-1 text-xs font-semibold text-[#5B50E6] hover:bg-[#EEF2FF] rounded-lg transition-colors"
                            >
                              Details
                            </Link>
                            <button
                              onClick={() => setStatusModalCustomer(cust)}
                              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                                cust.is_active
                                  ? 'text-[#DC2626] hover:bg-[#FEF2F2]'
                                  : 'text-[#059669] hover:bg-[#ECFDF5]'
                              }`}
                              title={cust.is_active ? 'Deactivate account' : 'Reactivate account'}
                            >
                              {cust.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
              <div>
                Showing{' '}
                <strong className="text-[#0F172A] font-semibold">
                  {(validCurrentPage - 1) * itemsPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-[#0F172A] font-semibold">
                  {Math.min(validCurrentPage * itemsPerPage, filteredAndSortedCustomers.length)}
                </strong>{' '}
                of <strong className="text-[#0F172A] font-semibold">{filteredAndSortedCustomers.length}</strong>{' '}
                customers
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validCurrentPage === 1}
                    className="w-7 h-7 rounded-lg border border-[#ECEEF5] bg-white flex items-center justify-center text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-medium">
                    Page {validCurrentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="w-7 h-7 rounded-lg border border-[#ECEEF5] bg-white flex items-center justify-center text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Customer Account"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingAdd}
              onClick={handleCreateCustomer}
            >
              Create customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Customer / Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Apex Tech Labs or Priya Sharma"
              className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                addErrors.name ? 'border-red-400' : 'border-[#CBD5E1]'
              }`}
            />
            {addErrors.name && <p className="text-[11px] text-red-600 mt-1">{addErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Telephone Number
              </label>
              <input
                type="text"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="client@example.com"
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  addErrors.email ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {addErrors.email && <p className="text-[11px] text-red-600 mt-1">{addErrors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Billing Address
            </label>
            <textarea
              rows={2}
              value={addBillingAddress}
              onChange={(e) => setAddBillingAddress(e.target.value)}
              placeholder="Building, Street, City, PIN code..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Notes / Terms
            </label>
            <input
              type="text"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="e.g. Net 15 credit terms or preferred carrier"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <Modal
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          title={`Edit Customer — ${editingCustomer.name}`}
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditingCustomer(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmittingEdit}
                onClick={handleSaveEdit}
              >
                Save changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Customer / Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  editErrors.name ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {editErrors.name && <p className="text-[11px] text-red-600 mt-1">{editErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Telephone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    editErrors.email ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {editErrors.email && (
                  <p className="text-[11px] text-red-600 mt-1">{editErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Billing Address
              </label>
              <textarea
                rows={2}
                value={editBillingAddress}
                onChange={(e) => setEditBillingAddress(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Notes / Terms
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate/Reactivate Confirmation Modal */}
      {statusModalCustomer && (
        <Modal
          isOpen={!!statusModalCustomer}
          onClose={() => setStatusModalCustomer(null)}
          title={statusModalCustomer.is_active ? 'Deactivate Customer' : 'Reactivate Customer'}
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setStatusModalCustomer(null)}>
                Cancel
              </Button>
              <Button
                variant={statusModalCustomer.is_active ? 'destructive' : 'primary'}
                size="sm"
                isLoading={isSubmittingStatus}
                onClick={handleToggleStatus}
              >
                {statusModalCustomer.is_active ? 'Confirm Deactivation' : 'Confirm Reactivation'}
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-xs text-[#334155] leading-relaxed">
            <p>
              Are you sure you want to{' '}
              <strong>{statusModalCustomer.is_active ? 'deactivate' : 'reactivate'}</strong>{' '}
              <strong className="text-[#0F172A]">{statusModalCustomer.name}</strong>?
            </p>
            {statusModalCustomer.is_active ? (
              <p className="text-[#DC2626] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FECACA]">
                Deactivated customers cannot be selected for new sales orders. Existing invoices, payments, and sales histories remain strictly preserved.
              </p>
            ) : (
              <p className="text-[#059669] bg-[#ECFDF5] p-2.5 rounded-lg border border-[#A7F3D0]">
                Reactivating this account makes it immediately selectable for new customer orders.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
