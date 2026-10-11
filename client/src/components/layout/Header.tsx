import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  RotateCcw,
  Info,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useDemoData } from '../../context/DemoDataContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setResetModalOpen, setAboutModalOpen } = useDemoData();

  // Determine current route breadcrumbs and contextual CTA
  const getRouteMeta = () => {
    const path = location.pathname;

    if (path === '/dashboard' || path === '/') {
      return {
        title: 'Business Overview',
        crumb: 'Dashboard',
        action: (
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/sales/new')}
          >
            Create sale
          </Button>
        ),
      };
    }
    if (path === '/products') {
      return {
        title: 'Products & Inventory',
        crumb: 'Products',
        action: (
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/products/new')}
          >
            Add product
          </Button>
        ),
      };
    }
    if (path === '/products/new') {
      return {
        title: 'New Product',
        parentCrumb: { label: 'Products', to: '/products' },
        crumb: 'Create',
      };
    }
    if (path.startsWith('/products/')) {
      return {
        title: 'Product Details',
        parentCrumb: { label: 'Products', to: '/products' },
        crumb: 'Details',
      };
    }
    if (path === '/customers') {
      return {
        title: 'Customers Directory',
        crumb: 'Customers',
      };
    }
    if (path.startsWith('/customers/')) {
      return {
        title: 'Customer Profile',
        parentCrumb: { label: 'Customers', to: '/customers' },
        crumb: 'Profile',
      };
    }
    if (path === '/sales') {
      return {
        title: 'Sales & Orders',
        crumb: 'Sales',
        action: (
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/sales/new')}
          >
            New sale
          </Button>
        ),
      };
    }
    if (path === '/sales/new') {
      return {
        title: 'Create Order',
        parentCrumb: { label: 'Sales', to: '/sales' },
        crumb: 'New Order',
      };
    }
    if (path.startsWith('/sales/')) {
      return {
        title: 'Order Summary',
        parentCrumb: { label: 'Sales', to: '/sales' },
        crumb: 'Order Details',
      };
    }
    if (path === '/invoices') {
      return {
        title: 'Invoices & Billing',
        crumb: 'Invoices',
      };
    }
    if (path.startsWith('/invoices/')) {
      return {
        title: 'Tax Invoice',
        parentCrumb: { label: 'Invoices', to: '/invoices' },
        crumb: 'Invoice View',
      };
    }
    if (path === '/expenses') {
      return {
        title: 'Operating Expenses',
        crumb: 'Expenses',
      };
    }
    if (path === '/reports') {
      return {
        title: 'Financial & Inventory Reports',
        crumb: 'Reports',
      };
    }
    if (path === '/settings') {
      return {
        title: 'Workspace Settings',
        crumb: 'Settings',
      };
    }

    return {
      title: 'Page',
      crumb: 'Page',
    };
  };

  const meta = getRouteMeta();

  return (
    <header className="h-14 px-4 sm:px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link
            to="/dashboard"
            className="text-[#64748B] hover:text-[#0F172A] transition-colors font-medium"
          >
            Workspace
          </Link>
          {meta.parentCrumb && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
              <Link
                to={meta.parentCrumb.to}
                className="text-[#64748B] hover:text-[#0F172A] transition-colors font-medium"
              >
                {meta.parentCrumb.label}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
          <span className="font-semibold text-[#0F172A]">{meta.crumb}</span>
        </nav>
      </div>

      {/* Right: Sandbox Indicator + Contextual CTA + Utility Triggers */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Subtle Sandbox Status Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Demo Sandbox</span>
        </div>

        {/* About Info Trigger */}
        <button
          onClick={() => setAboutModalOpen(true)}
          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
          title="About BusinessFlow"
          aria-label="About this demo"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Reset Trigger */}
        <button
          onClick={() => setResetModalOpen(true)}
          className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors cursor-pointer"
          title="Reset demo data"
          aria-label="Reset demo data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Contextual Action */}
        {meta.action && <div className="ml-1">{meta.action}</div>}
      </div>
    </header>
  );
};
