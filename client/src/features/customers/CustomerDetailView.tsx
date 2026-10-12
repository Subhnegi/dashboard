import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Power,
  ShoppingCart,
  Calendar,
  AlertCircle,
  FileText,
  Building,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDemoData } from '../../context/DemoDataContext';
import * as api from '../../lib/api-client';
import {
  formatCurrency,
  formatDate,
  getSalePaymentStatus,
} from '../../lib/formatters';
import type { Customer, Sale } from '../../types';

export const CustomerDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    customers,
    sales: contextSales,
    updateCustomer,
    deactivateCustomer,
    reactivateCustomer,
    showToast,
  } = useDemoData();

  const contextCustomer = customers.find((c) => c.id === id);

  const [customer, setCustomer] = useState<Customer | null>(contextCustomer || null);
  const [sales, setSales] = useState<Sale[]>(
    contextSales.filter((s) => s.customer_id === id)
  );
  const [isLoading, setIsLoading] = useState(!contextCustomer);

  // Edit Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBillingAddress, setEditBillingAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Status toggle modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Sync from context if updated
  useEffect(() => {
    if (contextCustomer) {
      setCustomer(contextCustomer);
    }
  }, [contextCustomer]);

  // Load live customer details & sales from backend
  const loadCustomerData = async () => {
    if (!id) return;
    try {
      const data = await api.getCustomer(id);
      if (data?.customer) {
        const mapped: Customer = {
          ...data.customer,
          is_active: Boolean(data.customer.is_active),
        };
        setCustomer(mapped);
      }
      if (data?.sales) {
        setSales(data.sales as any[]);
      }
    } catch (err) {
      console.warn('Could not fetch customer details from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-[#E2E8F0] rounded" />
        <div className="h-28 bg-white border border-[#E2E8F0] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
          <div className="h-24 bg-white border border-[#E2E8F0] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white p-12 rounded-xl border border-[#E2E8F0] text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#0F172A]">Customer Account Not Found</h3>
        <p className="text-xs text-[#64748B] mt-1 mb-5">
          The requested customer record does not exist or may have been removed.
        </p>
        <Link to="/customers">
          <Button variant="primary" size="sm">
            Return to Customer Directory
          </Button>
        </Link>
      </div>
    );
  }

  // Financial aggregates
  const confirmedSales = sales.filter((s) => s.status === 'CONFIRMED');
  const totalPurchasesMinor =
    customer.lifetime_value_minor !== undefined
      ? customer.lifetime_value_minor
      : confirmedSales.reduce((sum, s) => sum + s.total_minor, 0);

  const totalOutstandingMinor =
    customer.outstanding_balance_minor !== undefined
      ? customer.outstanding_balance_minor
      : confirmedSales.reduce((sum, s: any) => {
          const paid = (s.payments || []).reduce((pSum: number, p: any) => pSum + p.amount_minor, 0);
          return sum + Math.max(0, s.total_minor - paid);
        }, 0);

  const totalOrdersCount = customer.total_sales_count !== undefined ? customer.total_sales_count : sales.length;

  // Open Edit modal
  const handleOpenEdit = () => {
    setEditName(customer.name);
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditBillingAddress(customer.billing_address || '');
    setEditNotes(customer.notes || '');
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!editName.trim()) errs.name = 'Customer name is required';
    if (editEmail.trim() && !/^\S+@\S+\.\S+$/.test(editEmail.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateCustomer(customer.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        billing_address: editBillingAddress.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      await loadCustomerData();
      setIsEditOpen(false);
    } catch {
      showToast('Could not save customer changes', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      if (customer.is_active) {
        await deactivateCustomer(customer.id);
      } else {
        await reactivateCustomer(customer.id);
      }
      await loadCustomerData();
      setIsStatusModalOpen(false);
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to customer directory</span>
        </Link>
        <span className="text-[#94A3B8]">
          Customers / <strong className="text-[#334155]">{customer.name}</strong>
        </span>
      </div>

      {/* Deactivated Notice Banner */}
      {!customer.is_active && (
        <div className="p-3.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl flex items-center justify-between text-xs text-[#475569]">
          <div className="flex items-center gap-2.5">
            <Power className="w-4 h-4 text-[#64748B] shrink-0" />
            <div>
              <span className="font-bold">Deactivated Account:</span> This customer is deactivated and cannot be selected when placing new sales orders.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-300 text-emerald-700 hover:bg-emerald-50 shrink-0"
            onClick={() => setIsStatusModalOpen(true)}
          >
            Reactivate account
          </Button>
        </div>
      )}

      {/* Outstanding Balance Notice */}
      {totalOutstandingMinor > 0 && (
        <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center justify-between text-xs text-[#92400E]">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
            <div>
              <span className="font-bold">Payment Balance Due:</span> This account has an outstanding invoice balance of{' '}
              <strong className="font-bold tabular-nums">{formatCurrency(totalOutstandingMinor)}</strong>.
            </div>
          </div>
          <span className="font-semibold text-[11px] bg-white px-2 py-1 rounded border border-[#FDE68A]">
            Requires Settlement
          </span>
        </div>
      )}

      {/* Customer Hero Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-[#EEF2FF] text-[#5B50E6] flex items-center justify-center shrink-0 border border-[#C7D2FE]">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{customer.name}</h1>
              <Badge variant={customer.is_active ? 'success' : 'neutral'} size="sm">
                {customer.is_active ? 'Active Client' : 'Deactivated'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] mt-1.5">
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                <Calendar className="w-3 h-3" />
                <span>Customer since {formatDate(customer.created_at)}</span>
              </div>
            </div>

            {customer.billing_address && (
              <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span>{customer.billing_address}</span>
              </div>
            )}

            {customer.notes && (
              <p className="text-xs text-[#475569] mt-2 italic bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] max-w-2xl leading-relaxed">
                Terms & Notes: {customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={handleOpenEdit}
          >
            Edit profile
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Power className="w-3.5 h-3.5" />}
            className={customer.is_active ? 'text-[#DC2626] hover:bg-[#FEF2F2] hover:border-red-300' : 'text-[#059669] hover:bg-[#ECFDF5] hover:border-emerald-300'}
            onClick={() => setIsStatusModalOpen(true)}
          >
            {customer.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>

          {customer.is_active && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
              onClick={() => navigate('/sales/new')}
            >
              Create order
            </Button>
          )}
        </div>
      </div>

      {/* Financial & Order Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Lifetime Purchases
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {formatCurrency(totalPurchasesMinor)}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Across confirmed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Outstanding Balance Due
            </span>
            <div
              className={`text-xl font-bold mt-1 tabular-nums ${
                totalOutstandingMinor > 0 ? 'text-[#B45309]' : 'text-[#059669]'
              }`}
            >
              {formatCurrency(totalOutstandingMinor)}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {totalOutstandingMinor > 0 ? 'Pending invoice collections' : 'All invoices fully settled'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Total Order Transactions
            </span>
            <div className="text-xl font-bold text-[#0F172A] mt-1 tabular-nums">
              {totalOrdersCount} <span className="text-xs font-normal text-[#64748B]">orders</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Recorded order history</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Orders History Table */}
      <Card>
        <CardHeader
          title="Sales Order History"
          subtitle="All transactions, invoice status, and collections for this customer"
        />
        <div className="overflow-x-auto">
          {sales.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              <FileText className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
              <p className="font-semibold text-[#334155]">No sales orders placed yet</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                New sales orders linked to this customer account will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Sale Date</th>
                  <th className="px-5 py-3 text-right">Order Total</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sales.map((sale: any) => {
                  const payStatus = getSalePaymentStatus(sale);
                  const balDue = sale.balance_due_minor !== undefined ? sale.balance_due_minor : 0;
                  return (
                    <tr key={sale.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#0F172A]">
                        <Link
                          to={`/sales/${sale.id}`}
                          className="hover:text-[#5B50E6] transition-colors"
                        >
                          {sale.sale_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[#64748B]">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-[#0F172A] tabular-nums">
                        {formatCurrency(sale.total_minor)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {balDue > 0 ? (
                          <span className="font-semibold text-[#B45309]">{formatCurrency(balDue)}</span>
                        ) : (
                          <span className="text-[#059669]">₹0.00</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge paymentStatus={payStatus} size="sm" />
                      </td>
                      <td className="px-5 py-3">
                        <Badge saleStatus={sale.status} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/sales/${sale.id}`}
                            className="px-2 py-1 text-xs font-semibold text-[#5B50E6] hover:bg-[#EEF2FF] rounded-lg transition-colors"
                          >
                            Order
                          </Link>
                          <Link
                            to={`/invoices/${sale.id}`}
                            className="px-2 py-1 text-xs font-medium text-[#475569] hover:text-[#5B50E6] hover:bg-[#EEF2FF] rounded-lg transition-colors"
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

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Customer — ${customer.name}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
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

      {/* Deactivate/Reactivate Confirmation Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={customer.is_active ? 'Deactivate Customer' : 'Reactivate Customer'}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={customer.is_active ? 'destructive' : 'primary'}
              size="sm"
              isLoading={isTogglingStatus}
              onClick={handleToggleStatus}
            >
              {customer.is_active ? 'Confirm Deactivation' : 'Confirm Reactivation'}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs text-[#334155] leading-relaxed">
          <p>
            Are you sure you want to{' '}
            <strong>{customer.is_active ? 'deactivate' : 'reactivate'}</strong>{' '}
            <strong className="text-[#0F172A]">{customer.name}</strong>?
          </p>
          {customer.is_active ? (
            <p className="text-[#DC2626] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FECACA]">
              Deactivated accounts will not appear in customer selection for new sales orders. Existing invoices and payment logs remain strictly preserved.
            </p>
          ) : (
            <p className="text-[#059669] bg-[#ECFDF5] p-2.5 rounded-lg border border-[#A7F3D0]">
              Reactivating this account makes it immediately available again for new sales orders.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
