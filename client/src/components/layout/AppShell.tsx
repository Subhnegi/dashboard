import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../feedback/ToastContainer';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useDemoData } from '../../context/DemoDataContext';
import { RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

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
    <div className="flex h-screen w-full bg-[#F7F8FA] overflow-hidden">
      {/* Desktop Sidebar (Fixed/Sticky) */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#0C111D]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
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
        title="Reset Demo Data"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={resetDemoData}
            >
              Reset to seed state
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#344054]">
            Are you sure you want to reset the demo workspace? This will erase any newly created
            products, sales, customers, or expenses and reseed the application with initial
            fictional sample records for <span className="font-semibold text-[#172033]">Northstar Supplies</span>.
          </p>
          <div className="p-3.5 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#B42318] flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              All product stock levels, invoices, and expense charts will be re-initialized atomically.
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
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-sm text-[#344054]">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#EEECFB] text-[#5546D7]">
            <Sparkles className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-[#172033]">Portfolio SaaS Demo</p>
              <p className="text-xs text-[#5546D7]">Built to demonstrate full-stack engineering excellence.</p>
            </div>
          </div>

          <p>
            <strong className="text-[#172033]">BusinessFlow</strong> is a complete business management application designed for small retailers and service businesses.
          </p>

          <div className="space-y-2">
            <p className="font-medium text-[#172033]">Phase 1 Architecture Highlights:</p>
            <ul className="space-y-1.5 text-xs text-[#667085]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />
                <span>Responsive App Shell across Desktop (1440px), Tablet, and Mobile (390px)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />
                <span>Full routing tree with deep links, 404 handler, and active navigation indicators</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />
                <span>Exact INR paise minor-currency formatting and stock invariant safeguards</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />
                <span>Consistent seed data for Northstar Supplies with atomic reset functionality</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-[#98A2B3]">
            Fictional demo data only. Does not contain real financial or tax information.
          </p>
        </div>
      </Modal>
    </div>
  );
};
