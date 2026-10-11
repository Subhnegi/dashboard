import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDemoData } from '../../context/DemoDataContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, setResetModalOpen } = useDemoData();

  const [businessName, setBusinessName] = useState(settings.business_name);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [taxPercent, setTaxPercent] = useState(
    (settings.default_tax_rate_basis_points / 100).toString()
  );
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTax = parseFloat(taxPercent) || 0;
    updateSettings({
      business_name: businessName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      default_tax_rate_basis_points: Math.round(parsedTax * 100),
      invoice_prefix: invoicePrefix.trim(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Demo Business Profile"
          subtitle="Configure invoice header information and tax rates for this workspace"
        />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business / Trading Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Currency Symbol & Code
                </label>
                <input
                  type="text"
                  disabled
                  value="INR (₹) — Indian Rupee"
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Telephone Contact
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Business Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Tax Rate (% GST)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors tabular-nums"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Used for automated GST computations in sales checkout.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone: Demo Reset */}
      <Card className="border-rose-200 bg-rose-50/20">
        <CardHeader
          title="Sandbox Data Management"
          subtitle="Reset test transactions and restore original seed records"
        />
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Reset Demo Workspace</p>
              <p className="text-xs text-slate-600 max-w-md mt-0.5">
                Revert all products, sales, stock levels, invoices, and expenses back to the default
                sample state for Northstar Supplies.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => setResetModalOpen(true)}
            >
              Reset demo data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

