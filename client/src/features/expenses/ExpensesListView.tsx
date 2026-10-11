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
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5E7EB]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by description or vendor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#344054] bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none"
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
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add expense
          </Button>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(categoryTotals).map(([cat, amt]) => (
          <div
            key={cat}
            className="p-3 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-1"
          >
            <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block truncate">
              {cat}
            </span>
            <div className="text-sm font-bold text-[#172033]">{formatCurrency(amt)}</div>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <Card>
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="No expenses found"
            description="Record business expenses to calculate exact net profit."
            actionLabel="Add expense"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Expense Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3 text-right">Amount (INR)</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#172033]">
                      <div>{exp.description}</div>
                      {exp.notes && <p className="text-[11px] text-[#667085]">{exp.notes}</p>}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#F2F4F7] text-[#344054]">
                        {exp.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[#667085]">
                      {formatDate(exp.expense_date)}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[#344054]">{exp.vendor || '—'}</td>

                    <td className="px-5 py-3.5 text-right font-bold text-[#172033]">
                      {formatCurrency(exp.amount_minor)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 text-[#98A2B3] hover:text-[#B42318] hover:bg-[#FEF3F2] rounded-lg transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
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
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateExpense}>
              Record expense
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Office electricity or AWS hosting bill"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                errors.description ? 'border-red-400' : 'border-[#D0D5DD]'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="4500.00"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                  errors.amount ? 'border-red-400' : 'border-[#D0D5DD]'
                }`}
              />
              {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Vendor / Payee
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. BESCOM or Airtel"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Company Card">Company Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Notes / Receipt Reference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Voucher or invoice ID"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
