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
  Layers,
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

  // Warning count of low or out-of-stock items
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
    const isActive =
      location.pathname === item.to ||
      (item.to !== '/dashboard' && location.pathname.startsWith(`${item.to}/`));

    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onCloseMobile}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
          isActive
            ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold shadow-2xs'
            : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            className={`w-4 h-4 transition-colors ${
              isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#0F172A]'
            }`}
          />
          <span className="tracking-tight">{item.label}</span>
        </div>
        {item.badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] tabular-nums">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="w-60 h-full bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-14 px-4.5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <NavLink to="/dashboard" onClick={onCloseMobile} className="flex items-center gap-2.5">
            {/* Precision Geometric Brand Mark */}
            <div className="w-7 h-7 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#0F172A] tracking-tight leading-none">
                BusinessFlow
              </span>
              <span className="text-[10px] font-medium tracking-wide text-[#64748B] mt-0.5">
                Operations Platform
              </span>
            </div>
          </NavLink>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Workspace
            </div>
            <nav className="space-y-0.5">{workspaceNavItems.map(renderNavLink)}</nav>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              System
            </div>
            <nav className="space-y-0.5">{preferenceNavItems.map(renderNavLink)}</nav>
          </div>
        </div>

        {/* Sandbox Callout & Demo Reset */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col gap-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[11px] font-semibold text-[#0F172A]">Demo Sandbox</span>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono">v1.2</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-tight">
              Isolated local persistence.
            </p>
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                setResetModalOpen(true);
              }}
              className="w-full mt-0.5 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-[#334155] bg-[#F8FAFC] border border-[#CBD5E1] rounded-md hover:bg-white hover:text-[#0F172A] hover:border-[#94A3B8] transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <RotateCcw className="w-3 h-3 text-[#64748B]" />
              <span>Reset demo data</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
