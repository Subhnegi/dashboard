import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';
import { getProductStockStatus } from '../../lib/formatters';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { products, setResetModalOpen } = useDemoData();
  const location = useLocation();

  // Compute warning count of low or out-of-stock items
  const lowOrOutStockCount = products.filter((p) => {
    const status = getProductStockStatus(p);
    return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK';
  }).length;

  const workspaceNavItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Products',
      to: '/products',
      icon: Package,
      badge: lowOrOutStockCount > 0 ? `${lowOrOutStockCount}` : undefined,
      badgeVariant: 'warning',
    },
    { label: 'Customers', to: '/customers', icon: Users },
    { label: 'Sales', to: '/sales', icon: ShoppingCart },
    { label: 'Invoices', to: '/invoices', icon: FileText },
    { label: 'Expenses', to: '/expenses', icon: Receipt },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
  ];

  const preferenceNavItems = [
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const renderNavLink = (item: (typeof workspaceNavItems)[0]) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(`${item.to}/`));

    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onCloseMobile}
        className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-[#EEECFB] text-[#5546D7] font-semibold'
            : 'text-[#344054] hover:bg-[#F2F4F7] hover:text-[#172033]'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`w-4.5 h-4.5 transition-colors ${
              isActive ? 'text-[#5546D7]' : 'text-[#667085] group-hover:text-[#172033]'
            }`}
          />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className="px-1.5 py-0.2 text-[11px] font-semibold rounded-full bg-[#FEF0C7] text-[#B54708] border border-[#FEDF89]">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <NavLink to="/dashboard" onClick={onCloseMobile} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5546D7] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-[#172033] tracking-tight leading-tight">
                BusinessFlow
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#5546D7]">
                SaaS Demo
              </span>
            </div>
          </NavLink>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] rounded-lg"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider">
              Workspace
            </div>
            <nav className="space-y-1">{workspaceNavItems.map(renderNavLink)}</nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider">
              Preferences
            </div>
            <nav className="space-y-1">{preferenceNavItems.map(renderNavLink)}</nav>
          </div>
        </div>

        {/* Sandbox Callout & Demo Reset Quick Trigger */}
        <div className="p-3.5 border-t border-[#E5E7EB] bg-[#FCFCFD]">
          <div className="p-3 rounded-xl bg-[#F8F9FC] border border-[#EAECF0] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#172033]">Interactive Sandbox</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#12B76A] ring-4 ring-[#ECFDF3]" />
            </div>
            <p className="text-[11px] text-[#667085] leading-normal">
              Changes persist locally. Reset anytime to seed state.
            </p>
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                setResetModalOpen(true);
              }}
              className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB] hover:text-[#172033] transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#667085]" />
              <span>Reset demo data</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
