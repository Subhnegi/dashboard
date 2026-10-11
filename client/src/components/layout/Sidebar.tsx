import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Receipt,
  Settings as SettingsIcon,
  ChevronDown,
  Sidebar as SidebarIcon,
  Plus,
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';
import { getProductStockStatus } from '../../lib/formatters';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { products } = useDemoData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);

  // Warning count of low or out-of-stock items
  const lowOrOutStockCount = products.filter((p) => {
    const status = getProductStockStatus(p);
    return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK';
  }).length;

  const navLinkClass = (isActive: boolean) =>
    `relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
      isActive
        ? 'font-bold text-[#5B50E6] bg-[#EEF2FF] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#5B50E6] before:rounded-r'
        : 'font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC]'
    } ${isCollapsed ? 'justify-center px-0' : ''}`;

  return (
    <aside
      className={`h-full bg-white border-r border-[#ECEEF5] flex flex-col justify-between shrink-0 select-none transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* 1. Fixed Header */}
      <div className="h-14 px-3.5 border-b border-[#ECEEF5] flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#181A2A] tracking-wider uppercase">
              Navigation
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="w-2 h-2 rounded-full bg-[#5B50E6]" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-[#8A90A2] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <SidebarIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Middle Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 min-h-0">
        {/* Group 1: Workspace Core */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-[#8A90A2] tracking-wider uppercase mb-1.5 px-3">
              Workspace
            </div>
          )}
          <nav className="space-y-0.5">
            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              title="Overview"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Overview</span>}
            </NavLink>

            <NavLink
              to="/reports"
              onClick={onCloseMobile}
              title="Reports & Analytics"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Reports</span>}
            </NavLink>
          </nav>
        </div>

        {/* Group 2: Operations */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-[#8A90A2] tracking-wider uppercase mb-1.5 px-3">
              Operations
            </div>
          )}
          <nav className="space-y-0.5">
            {/* Products Accordion */}
            <div>
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setProductsOpen(true);
                  } else {
                    setProductsOpen(!productsOpen);
                  }
                }}
                title="Products"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Products</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5">
                    {lowOrOutStockCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">
                        {lowOrOutStockCount}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8A90A2] transition-transform ${
                        productsOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </div>
                )}
              </button>

              {/* Sub-items when expanded */}
              {!isCollapsed && productsOpen && (
                <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#ECEEF5] ml-4 mt-0.5">
                  <NavLink
                    to="/products"
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'font-bold text-[#5B50E6] bg-[#EEF2FF]'
                          : 'font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC]'
                      }`
                    }
                  >
                    All Products
                  </NavLink>

                  <NavLink
                    to="/products/new"
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'font-bold text-[#5B50E6] bg-[#EEF2FF]'
                          : 'font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC]'
                      }`
                    }
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Product</span>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink
              to="/customers"
              onClick={onCloseMobile}
              title="Customers"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Customers</span>}
            </NavLink>

            <NavLink
              to="/sales"
              onClick={onCloseMobile}
              title="Sales & Orders"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Sales & Orders</span>}
            </NavLink>
          </nav>
        </div>

        {/* Group 3: Finance */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-[#8A90A2] tracking-wider uppercase mb-1.5 px-3">
              Finance
            </div>
          )}
          <nav className="space-y-0.5">
            <NavLink
              to="/invoices"
              onClick={onCloseMobile}
              title="Invoices"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Invoices</span>}
            </NavLink>

            <NavLink
              to="/expenses"
              onClick={onCloseMobile}
              title="Expenses"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Expenses</span>}
            </NavLink>
          </nav>
        </div>

        {/* Group 4: Settings */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-[#8A90A2] tracking-wider uppercase mb-1.5 px-3">
              Preferences
            </div>
          )}
          <nav className="space-y-0.5">
            <NavLink
              to="/settings"
              onClick={onCloseMobile}
              title="Settings"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </nav>
        </div>
      </div>

      {/* 3. Fixed Footer */}
      <div className="p-3 border-t border-[#ECEEF5] shrink-0 bg-white flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <span className="text-[10px] text-[#8A90A2] font-semibold tracking-wider uppercase">
              Symphony v2.4
            </span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg text-[#8A90A2] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <SidebarIcon className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 rounded-lg text-[#8A90A2] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <SidebarIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
