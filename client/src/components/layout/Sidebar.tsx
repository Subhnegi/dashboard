import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  User,
  RotateCcw,
  FileText,
  Sidebar as SidebarIcon,
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { setResetModalOpen } = useDemoData();
  const [productsOpen, setProductsOpen] = useState(true);

  return (
    <aside className="w-64 h-full bg-white border-r border-[#ECEEF5] flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="p-5 space-y-6">
        {/* Group 1: Menu */}
        <div>
          <div className="text-[11px] font-bold text-[#8A90A2] tracking-wider uppercase mb-2 px-3">
            Menu
          </div>
          <nav className="space-y-0.5">
            <NavLink
              to="/dashboard"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-xl text-xs transition-colors ${
                  isActive
                    ? 'font-bold text-[#181A2A] bg-[#F7F8FC]'
                    : 'font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC]'
                }`
              }
            >
              Overview
            </NavLink>

            <NavLink
              to="/reports"
              onClick={onCloseMobile}
              className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              Analytics
            </NavLink>

            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full text-left flex items-center px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
            >
              Campaigns
            </button>

            <NavLink
              to="/customers"
              onClick={onCloseMobile}
              className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              CRM
            </NavLink>

            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full text-left flex items-center px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
            >
              Schedule
            </button>

            <NavLink
              to="/reports"
              onClick={onCloseMobile}
              className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              Reports
            </NavLink>
          </nav>
        </div>

        {/* Group 2: Shop */}
        <div>
          <div className="text-[11px] font-bold text-[#8A90A2] tracking-wider uppercase mb-2 px-3">
            Shop
          </div>
          <nav className="space-y-0.5">
            {/* Products Accordion */}
            <div>
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              >
                <span>Products</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8A90A2] transition-transform ${
                    productsOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {productsOpen && (
                <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-[#ECEEF5] ml-4 mt-0.5">
                  <NavLink
                    to="/dashboard"
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `relative block px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'font-bold text-[#5B50E6] bg-[#EEF2FF] before:absolute before:-left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#5B50E6]'
                          : 'font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC]'
                      }`
                    }
                  >
                    Sales Overview
                  </NavLink>

                  <NavLink
                    to="/reports"
                    onClick={onCloseMobile}
                    className="block px-3 py-1.5 rounded-lg text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
                  >
                    Statics
                  </NavLink>

                  <NavLink
                    to="/products"
                    onClick={onCloseMobile}
                    className="block px-3 py-1.5 rounded-lg text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
                  >
                    Top Products
                  </NavLink>

                  <NavLink
                    to="/products/new"
                    onClick={onCloseMobile}
                    className="block px-3 py-1.5 rounded-lg text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
                  >
                    Add Product
                  </NavLink>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
            >
              <span>Marketing Tools</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8A90A2]" />
            </button>

            <NavLink
              to="/customers"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              <span>Customers</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8A90A2]" />
            </NavLink>
          </nav>
        </div>

        {/* Group 3: Payments */}
        <div>
          <div className="text-[11px] font-bold text-[#8A90A2] tracking-wider uppercase mb-2 px-3">
            Payments
          </div>
          <nav className="space-y-0.5">
            <NavLink
              to="/invoices"
              onClick={onCloseMobile}
              className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              Earnings
            </NavLink>

            <NavLink
              to="/sales"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              <span>Transactions</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8A90A2]" />
            </NavLink>

            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full text-left flex items-center px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
            >
              Discounts
            </button>
          </nav>
        </div>

        {/* Group 4: Settings */}
        <div>
          <div className="text-[11px] font-bold text-[#8A90A2] tracking-wider uppercase mb-2 px-3">
            Settings
          </div>
          <nav className="space-y-0.5">
            <NavLink
              to="/settings"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-[#8A90A2]" />
              <span>Account</span>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#8A90A2]" />
              <span>Author Profile</span>
            </NavLink>

            <NavLink
              to="/sales"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8A90A2]" />
              <span>Refund Requests</span>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#8A90A2]" />
              <span>Tax Information</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Bottom Collapse Button */}
      <div className="p-4 border-t border-[#ECEEF5] flex items-center justify-between">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            setResetModalOpen(true);
          }}
          className="w-8 h-8 rounded-lg border border-[#ECEEF5] flex items-center justify-center text-[#8A90A2] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
          title="Sidebar & Workspace Controls"
        >
          <SidebarIcon className="w-4 h-4" />
        </button>

        <span className="text-[10px] text-[#8A90A2] font-medium">Symphony v2.4</span>
      </div>
    </aside>
  );
};

