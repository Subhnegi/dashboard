import React, { useState } from 'react';
import {
  Search,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Expense } from '../../types';

export const ExpensesListView: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useDemoData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New expense form
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Rent');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeExpenses = expenses.filter((e) => !e.is_deleted);

  const filteredExpenses = activeExpenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      (e.vendor && e.vendor.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category for summary cards
  const categoryTotals: Record<string, number> = {};
  for (const exp of activeExpenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount_minor;
  }

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!description.trim()) errs.description = 'Description is required';
    const num = parseFloat(amountRupees);
    if (isNaN(num) || num <= 0) errs.amount = 'Enter a valid positive amount';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    addExpense({
      description: description.trim(),
      category,
      amount_minor: Math.round(num * 100),
      expense_date: new Date().toISOString(),
      payment_method: paymentMethod || undefined,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setDescription('');
    setAmountRupees('');
    setVendor('');
    setNotes('');
    setErrors({});
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by description or vendor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Supplies">Supplies</option>
            <option value="Software">Software</option>
            <option value="Marketing">Marketing</option>
            <option value="Other">Other</option>
          </select>

          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add expense
          </Button>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
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

      {/* Expenses Table */}
      <Card>
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title="No expense vouchers found"
            description="Record operating expenditures to accurately compute net balance."
            actionLabel="Add expense"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Expense Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3 text-right">Amount (INR)</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3 font-medium text-[#0F172A]">
                      <div>{exp.description}</div>
                      {exp.notes && <p className="text-[10px] text-[#64748B]">{exp.notes}</p>}
                    </td>

                    <td className="px-5 py-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-[#64748B]">
                      {formatDate(exp.expense_date)}
                    </td>

                    <td className="px-5 py-3 text-[#334155]">{exp.vendor || '—'}</td>

                    <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                      {formatCurrency(exp.amount_minor)}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Operating Expense"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateExpense}>
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Office electricity or AWS hosting bill"
              className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.description ? 'border-red-400' : 'border-[#CBD5E1]'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
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
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="4500.00"
                className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
                  errors.amount ? 'border-red-400' : 'border-[#CBD5E1]'
                }`}
              />
              {errors.amount && <p className="text-[11px] text-red-600 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Supplies">Supplies</option>
                <option value="Software">Software</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Vendor / Payee
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. BESCOM or Airtel"
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
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
              Notes / Receipt Reference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Voucher or invoice ID"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
