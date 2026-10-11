import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  RotateCcw,
  Info,
  Plus,
  Sparkles,
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
            leftIcon={<Plus className="w-4 h-4" />}
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
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/products/new')}
          >
            Add product
          </Button>
        ),
      };
    }
    if (path === '/products/new') {
      return {
        title: 'Add New Product',
        parentCrumb: { label: 'Products', to: '/products' },
        crumb: 'New Product',
      };
    }
    if (path.startsWith('/products/')) {
      return {
        title: 'Product Details',
        parentCrumb: { label: 'Products', to: '/products' },
        crumb: 'Product Details',
      };
    }
    if (path === '/customers') {
      return {
        title: 'Customer Directory',
        crumb: 'Customers',
      };
    }
    if (path.startsWith('/customers/')) {
      return {
        title: 'Customer Profile',
        parentCrumb: { label: 'Customers', to: '/customers' },
        crumb: 'Customer Profile',
      };
    }
    if (path === '/sales') {
      return {
        title: 'Sales & Orders',
        crumb: 'Sales',
        action: (
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/sales/new')}
          >
            New Sale
          </Button>
        ),
      };
    }
    if (path === '/sales/new') {
      return {
        title: 'Create New Sale',
        parentCrumb: { label: 'Sales', to: '/sales' },
        crumb: 'New Sale',
      };
    }
    if (path.startsWith('/sales/')) {
      return {
        title: 'Sale Details',
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
        title: 'Invoice View',
        parentCrumb: { label: 'Invoices', to: '/invoices' },
        crumb: 'Invoice View',
      };
    }
    if (path === '/expenses') {
      return {
        title: 'Business Expenses',
        crumb: 'Expenses',
      };
    }
    if (path === '/reports') {
      return {
        title: 'Business Reports & Analytics',
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
    <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Mobile Toggle + Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] rounded-lg"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#667085]">
            <Link to="/dashboard" className="hover:text-[#172033] transition-colors">
              Workspace
            </Link>
            {meta.parentCrumb && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3]" />
                <Link to={meta.parentCrumb.to} className="hover:text-[#172033] transition-colors">
                  {meta.parentCrumb.label}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3]" />
            <span className="font-medium text-[#172033]">{meta.crumb}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#172033] leading-tight">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Sandbox Indicator + Contextual CTA + Demo Menu Modals */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Demo Workspace Sandbox Badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEECFB] border border-[#D4CEF9] text-[#5546D7] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#5546D7]" />
          <span>Demo Sandbox</span>
        </div>

        {/* About this Demo */}
        <button
          onClick={() => setAboutModalOpen(true)}
          className="p-2 text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] rounded-lg transition-colors"
          title="About this BusinessFlow demo"
          aria-label="About this demo"
        >
          <Info className="w-4.5 h-4.5" />
        </button>

        {/* Reset Demo Data quick icon button */}
        <button
          onClick={() => setResetModalOpen(true)}
          className="p-2 text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] rounded-lg transition-colors"
          title="Reset demo data"
          aria-label="Reset demo data"
        >
          <RotateCcw className="w-4.5 h-4.5" />
        </button>

        {/* Contextual Action */}
        {meta.action && <div className="ml-1">{meta.action}</div>}
      </div>
    </header>
  );
};
