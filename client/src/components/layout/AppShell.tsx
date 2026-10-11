import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../feedback/ToastContainer';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useDemoData } from '../../context/DemoDataContext';
import { RotateCcw, Layers, CheckCircle2 } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    isResetModalOpen,
    isAboutModalOpen,
    setResetModalOpen,
    setAboutModalOpen,
    resetDemoData,
  } = useDemoData();

  return (
    <div className="flex flex-col h-screen w-full bg-[#F7F8FC] overflow-hidden font-sans">
      {/* Symphony Full-Width Top Header */}
      <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Main Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar (Fixed) */}
        <div className="hidden md:block h-full shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast Feedback */}
      <ToastContainer />

      {/* Reset Demo Data Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Demo Workspace"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={resetDemoData}
            >
              Reset to seed state
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#334155] leading-relaxed">
            Are you sure you want to restore the demo environment? Any newly created
            orders, products, customers, or expenses will be cleared, and all catalog records will
            revert to the initial seed state for{' '}
            <strong className="text-[#0F172A]">Northstar Supplies</strong>.
          </p>
          <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              All product stock quantities, invoices, and expense vouchers will be reset atomically.
            </span>
          </div>
        </div>
      </Modal>

      {/* About This Demo Modal */}
      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        title="About BusinessFlow"
        maxWidth="md"
        footer={
          <Button variant="primary" onClick={() => setAboutModalOpen(false)}>
            Dismiss
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-[#334155]">
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[#1E40AF]">
            <Layers className="w-5 h-5 shrink-0 text-[#2563EB]" />
            <div>
              <p className="font-semibold text-sm text-[#0F172A]">Portfolio SaaS Demonstration</p>
              <p className="text-[11px] text-[#2563EB]">
                Full-stack business management application with verified business logic.
              </p>
            </div>
          </div>

          <p className="leading-relaxed">
            <strong className="text-[#0F172A]">BusinessFlow</strong> provides a cohesive, end-to-end
            retail and service operations system: product inventory with atomic movements, customer
            tracking, sales processing with price snapshots, printable tax invoices, and live
            operating metrics.
          </p>

          <div className="space-y-2">
            <p className="font-semibold text-[#0F172A]">Key Architectural Pillars:</p>
            <ul className="space-y-1.5 text-[#475569]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>Exact integer paise minor-currency math preventing floating-point errors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>Atomic stock reduction & audit movements on order fulfillment and reversal</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>Print-optimized tax invoices with strict browser-print styling</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>Responsive, high-density dashboard built on real transaction data</span>
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] pt-3">
            Portfolio demonstration with fictional sample business records.
          </p>
        </div>
      </Modal>
    </div>
  );
};
