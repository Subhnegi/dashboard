import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useDemoData } from '../../context/DemoDataContext';
import { formatCurrency } from '../../lib/formatters';

export const CustomersListView: React.FC = () => {
  const navigate = useNavigate();
  const { customers, addCustomer } = useDemoData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New customer form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Customer name is required';

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const created = addCustomer({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      billing_address: billingAddress.trim() || undefined,
      notes: notes.trim() || undefined,
      is_active: true,
    });

    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setBillingAddress('');
    setNotes('');
    setErrors({});
    navigate(`/customers/${created.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top search & action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5E7EB]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
          />
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add customer
        </Button>
      </div>

      {/* Customer Directory Table */}
      <Card>
        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No customers found"
            description="Add customers to associate with sales orders and invoices."
            actionLabel="Add customer"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Customer Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Billing Address</th>
                  <th className="px-5 py-3 text-center">Orders</th>
                  <th className="px-5 py-3 text-right">Lifetime Value</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/customers/${cust.id}`}
                        className="font-semibold text-[#172033] hover:text-[#5546D7] transition-colors"
                      >
                        {cust.name}
                      </Link>
                      {cust.notes && (
                        <p className="text-[11px] text-[#667085] line-clamp-1">{cust.notes}</p>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[#344054]">
                      {cust.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#98A2B3]" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[#667085]">
                          <Phone className="w-3.5 h-3.5 text-[#98A2B3]" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      {!cust.email && !cust.phone && (
                        <span className="text-[#98A2B3] italic">Counter sale profile</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[#667085] max-w-xs truncate">
                      {cust.billing_address || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-center font-bold text-[#172033]">
                      {cust.total_sales_count || 0}
                    </td>

                    <td className="px-5 py-3.5 text-right font-semibold text-[#172033]">
                      {formatCurrency(cust.lifetime_value_minor || 0)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/customers/${cust.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5546D7] hover:underline"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Customer Profile"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCustomer}>
              Create customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Customer / Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Innovations Ltd or Anita Rao"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                errors.name ? 'border-red-400' : 'border-[#D0D5DD]'
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30 ${
                  errors.email ? 'border-red-400' : 'border-[#D0D5DD]'
                }`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Billing Address
            </label>
            <textarea
              rows={2}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Street, City, State, PIN code..."
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Notes / Terms
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Net 15 days or preferred delivery instructions"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5546D7]/30"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
