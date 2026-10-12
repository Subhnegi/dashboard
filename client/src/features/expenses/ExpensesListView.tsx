import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Receipt,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Expense } from '../../types';

export const ExpensesListView: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useDemoData();

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | '7D' | '30D' | 'THIS_MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Expense modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDescription, setAddDescription] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addCategory, setAddCategory] = useState<Expense['category']>('Rent');
  const [addDate, setAddDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [addPaymentMethod, setAddPaymentMethod] = useState('Bank Transfer');
  const [addVendor, setAddVendor] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Expense modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<Expense['category']>('Rent');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Bank Transfer');
  const [editVendor, setEditVendor] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Expense confirmation modal state
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const activeExpenses = useMemo(() => expenses.filter((e) => !e.is_deleted), [expenses]);

  // Filter and sort active expenses
  const filteredAndSortedExpenses = useMemo(() => {
    const now = new Date();

    const list = activeExpenses.filter((exp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exp.description.toLowerCase().includes(q) ||
        (exp.vendor && exp.vendor.toLowerCase().includes(q)) ||
        (exp.notes && exp.notes.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;

      let matchesDate = true;
      if (dateRangeFilter !== 'ALL') {
        const expDate = new Date(exp.expense_date);
        if (dateRangeFilter === '7D') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = expDate >= sevenDaysAgo;
        } else if (dateRangeFilter === '30D') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = expDate >= thirtyDaysAgo;
        } else if (dateRangeFilter === 'THIS_MONTH') {
          matchesDate =
            expDate.getFullYear() === now.getFullYear() && expDate.getMonth() === now.getMonth();
        }
      }

      return matchesSearch && matchesCategory && matchesDate;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
        case 'date_asc':
          return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
        case 'amount_desc':
          return b.amount_minor - a.amount_minor;
        case 'amount_asc':
          return a.amount_minor - b.amount_minor;
        default:
          return 0;
      }
    });

    return list;
  }, [activeExpenses, searchQuery, selectedCategory, dateRangeFilter, sortBy]);

  // Aggregate category totals from active expenses
  const { totalFilteredAmount, categoryTotals } = useMemo(() => {
    let total = 0;
    const totals: Record<string, number> = {};
    for (const exp of filteredAndSortedExpenses) {
      total += exp.amount_minor;
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount_minor;
    }
    return { totalFilteredAmount: total, categoryTotals: totals };
  }, [filteredAndSortedExpenses]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedExpenses.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedExpenses = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredAndSortedExpenses.slice(start, start + itemsPerPage);
  }, [filteredAndSortedExpenses, validCurrentPage, itemsPerPage]);

  const hasActiveFilters =
    searchQuery !== '' || selectedCategory !== 'ALL' || dateRangeFilter !== 'ALL' || sortBy !== 'date_desc';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setDateRangeFilter('ALL');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  // Add expense handler
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!addDescription.trim()) errs.description = 'Description is required';
    const num = parseFloat(addAmount);
    if (isNaN(num) || num <= 0) errs.amount = 'Enter a valid positive amount';

    if (Object.keys(errs).length > 0) {
      setAddErrors(errs);
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await addExpense({
        description: addDescription.trim(),
        category: addCategory,
        amount_minor: Math.round(num * 100),
        expense_date: addDate ? new Date(addDate).toISOString() : new Date().toISOString(),
        payment_method: addPaymentMethod || undefined,
        vendor: addVendor.trim() || undefined,
        notes: addNotes.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setAddDescription('');
      setAddAmount('');
      setAddVendor('');
      setAddNotes('');
      setAddErrors({});
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit expense handler
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditDescription(exp.description);
    setEditAmount((exp.amount_minor / 100).toFixed(2));
    setEditCategory(exp.category);
    setEditDate(exp.expense_date.split('T')[0] || '');
    setEditPaymentMethod(exp.payment_method || 'Bank Transfer');
    setEditVendor(exp.vendor || '');
    setEditNotes(exp.notes || '');
    setEditErrors({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const errs: Record<string, string> = {};
    if (!editDescription.trim()) errs.description = 'Description is required';
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) errs.amount = 'Enter a valid positive amount';

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await updateExpense(editingExpense.id, {
        description: editDescription.trim(),
        category: editCategory,
        amount_minor: Math.round(num * 100),
        expense_date: editDate ? new Date(editDate).toISOString() : editingExpense.expense_date,
        payment_method: editPaymentMethod || undefined,
        vendor: editVendor.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setEditingExpense(null);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete expense confirmation
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsSubmittingDelete(true);
    try {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by expense description, vendor, or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Supplies">Supplies</option>
            <option value="Software">Software</option>
            <option value="Marketing">Marketing</option>
            <option value="Travel">Travel</option>
            <option value="Other">Other</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="30D">Last 30 Days</option>
            <option value="7D">Last 7 Days</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="date_desc">Sort: Date (Newest)</option>
            <option value="date_asc">Sort: Date (Oldest)</option>
            <option value="amount_desc">Sort: Amount (High → Low)</option>
            <option value="amount_asc">Sort: Amount (Low → High)</option>
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
              setAddDescription('');
              setAddAmount('');
              setAddCategory('Rent');
              setAddDate(new Date().toISOString().split('T')[0]);
              setAddPaymentMethod('Bank Transfer');
              setAddVendor('');
              setAddNotes('');
              setAddErrors({});
              setIsAddModalOpen(true);
            }}
          >
            Add expense
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards & Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 bg-[#EEF2FF] rounded-lg border border-[#C7D2FE] space-y-0.5">
          <span className="text-[10px] font-bold text-[#5B50E6] uppercase tracking-wider block truncate">
            Total Filtered
          </span>
          <div className="text-xs font-bold text-[#1E1B4B] tabular-nums">
            {formatCurrency(totalFilteredAmount)}
          </div>
        </div>

        {Object.entries(categoryTotals).map(([cat, amt]) => (
          <div
            key={cat}
            className="p-3 bg-white rounded-lg border border-[#E2E8F0] shadow-2xs space-y-0.5"
          >
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block truncate">
              {cat}
            </span>
            <div className="text-xs font-bold text-[#0F172A] tabular-nums">{formatCurrency(amt)}</div>
          </div>
        ))}
      </div>

      {/* Expenses Table Card */}
      <Card>
        {filteredAndSortedExpenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title="No expense records found"
            description="Adjust search filters or record an operating disbursement voucher."
            actionLabel="Add expense"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-5 py-3">Expense Description</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Expense Date</th>
                    <th className="px-5 py-3">Vendor / Payee</th>
                    <th className="px-5 py-3">Payment Method</th>
                    <th className="px-5 py-3 text-right">Amount (INR)</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 font-medium text-[#0F172A]">
                        <div>{exp.description}</div>
                        {exp.notes && (
                          <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">{exp.notes}</p>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                          {exp.category}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-[#64748B]">
                        {formatDate(exp.expense_date)}
                      </td>

                      <td className="px-5 py-3 text-[#334155]">{exp.vendor || '—'}</td>

                      <td className="px-5 py-3">
                        <span className="font-mono text-[11px] text-[#475569] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                          {exp.payment_method || 'General'}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                        {formatCurrency(exp.amount_minor)}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="px-2 py-1 text-xs font-medium text-[#475569] hover:text-[#5B50E6] hover:bg-[#EEF2FF] rounded-lg transition-colors cursor-pointer"
                            title="Edit expense"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingExpense(exp)}
                            className="p-1 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  {Math.min(validCurrentPage * itemsPerPage, filteredAndSortedExpenses.length)}
                </strong>{' '}
                of <strong className="text-[#0F172A] font-semibold">{filteredAndSortedExpenses.length}</strong>{' '}
                expenses
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

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Operating Expense"
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
              onClick={handleCreateExpense}
            >
              Save expense
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder="e.g. Office electricity or AWS hosting invoice"
              className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                addErrors.description ? 'border-red-400' : 'border-[#CBD5E1]'
              }`}
            />
            {addErrors.description && (
              <p className="text-[11px] text-red-600 mt-1">{addErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="4500.00"
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                  addErrors.amount ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {addErrors.amount && <p className="text-[11px] text-red-600 mt-1">{addErrors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Category</label>
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Supplies">Supplies</option>
                <option value="Software">Software</option>
                <option value="Marketing">Marketing</option>
                <option value="Travel">Travel</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Expense Date
              </label>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Payment Method
              </label>
              <select
                value={addPaymentMethod}
                onChange={(e) => setAddPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Company Card">Company Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Vendor / Payee (optional)
            </label>
            <input
              type="text"
              value={addVendor}
              onChange={(e) => setAddVendor(e.target.value)}
              placeholder="e.g. BESCOM, Amazon Business, or Landlord"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Notes / Voucher Reference (optional)
            </label>
            <input
              type="text"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="e.g. Bill #89201 or monthly advance"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <Modal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          title={`Edit Expense — ${editingExpense.description}`}
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditingExpense(null)}>
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
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  editErrors.description ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {editErrors.description && (
                <p className="text-[11px] text-red-600 mt-1">{editErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                    editErrors.amount ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {editErrors.amount && (
                  <p className="text-[11px] text-red-600 mt-1">{editErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Software">Software</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Travel">Travel</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Payment Method
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Company Card">Company Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Vendor / Payee
              </label>
              <input
                type="text"
                value={editVendor}
                onChange={(e) => setEditVendor(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Notes / Reference
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

      {/* Delete Expense Confirmation Modal */}
      {deletingExpense && (
        <Modal
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          title="Delete Expense Record"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setDeletingExpense(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isSubmittingDelete}
                onClick={handleConfirmDelete}
              >
                Delete expense
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-xs text-[#334155] leading-relaxed">
            <p>
              Are you sure you want to remove the expense for{' '}
              <strong className="text-[#0F172A]">{deletingExpense.description}</strong> (
              <span className="font-bold tabular-nums">
                {formatCurrency(deletingExpense.amount_minor)}
              </span>
              )?
            </p>
            <p className="text-[#DC2626] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FECACA]">
              This voucher will be soft-deleted. Operating profit estimates and dashboard calculations will update automatically.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
