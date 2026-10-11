import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  ShoppingBag,
  Users,
  Code2,
  ShieldCheck,
  MessageSquare,
  GraduationCap,
  User,
  Settings,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { setResetModalOpen, setAboutModalOpen, showToast } = useDemoData();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const resourcesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 px-4 sm:px-6 bg-white border-b border-[#ECEEF5] flex items-center justify-between shrink-0 sticky top-0 z-30 select-none">
      {/* 1. Left: Brand & Mobile Toggle */}
      <div className="flex items-center gap-3 w-48 sm:w-60 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-[#5E6478] hover:text-[#181A2A] hover:bg-[#F7F8FC] rounded-lg cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Symphony Brand Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-[#5B50E6] flex items-center justify-center p-1.5 shadow-xs group-hover:bg-[#4E44D4] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
              <rect x="3" y="3" width="7" height="7" rx="2.5" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2.5" fill="currentColor" fillOpacity="0.75" />
              <rect x="3" y="14" width="7" height="7" rx="2.5" fill="currentColor" fillOpacity="0.75" />
              <rect x="14" y="14" width="7" height="7" rx="2.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-base font-bold text-[#181A2A] tracking-tight">Symphony</span>
        </NavLink>
      </div>

      {/* 2. Center: Smaller, Centered Navbar Links */}
      <nav className="hidden md:flex flex-1 items-center justify-center gap-5 lg:gap-7 text-[11px] font-medium text-[#5E6478]">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `relative py-4 transition-colors ${
              isActive
                ? 'text-[#181A2A] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#5B50E6] after:rounded-full'
                : 'hover:text-[#181A2A]'
            }`
          }
        >
          Dashboard
        </NavLink>

        <button
          onClick={() => setAboutModalOpen(true)}
          className="hover:text-[#181A2A] transition-colors cursor-pointer py-4"
        >
          Documentation
        </button>

        {/* Resources Dropdown */}
        <div className="relative" ref={resourcesRef}>
          <button
            onClick={() => setResourcesOpen(!resourcesOpen)}
            className="flex items-center gap-1 hover:text-[#181A2A] transition-colors cursor-pointer py-4"
          >
            <span>Resources</span>
            <ChevronDown className="w-3 h-3 text-[#8A90A2]" />
          </button>

          {resourcesOpen && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 bg-white border border-[#ECEEF5] rounded-lg shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 grid grid-cols-2 gap-1.5">
              <div
                onClick={() => {
                  setResourcesOpen(false);
                  showToast('Opening Symphony Marketplace...', 'info');
                }}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#5B50E6] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#181A2A]">Marketplace</div>
                  <div className="text-[10px] text-[#8A90A2]">Templates & Plugins</div>
                </div>
              </div>

              <div
                onClick={() => {
                  setResourcesOpen(false);
                  showToast('Viewing community meetups...', 'info');
                }}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#181A2A]">Meetups</div>
                  <div className="text-[10px] text-[#8A90A2]">Upcoming Events</div>
                </div>
              </div>

              <div
                onClick={() => {
                  setResourcesOpen(false);
                  showToast('Connecting with dev experts...', 'info');
                }}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#181A2A]">Experts</div>
                  <div className="text-[10px] text-[#8A90A2]">Connecting Devs</div>
                </div>
              </div>

              <div
                onClick={() => {
                  setResourcesOpen(false);
                  showToast('Partner affiliate program...', 'info');
                }}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#181A2A]">Partners</div>
                  <div className="text-[10px] text-[#8A90A2]">Affiliate Program</div>
                </div>
              </div>

              <div
                onClick={() => {
                  setResourcesOpen(false);
                  showToast('Reading blog posts...', 'info');
                }}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#181A2A]">Blog</div>
                  <div className="text-[10px] text-[#8A90A2]">Our Insights</div>
                </div>
              </div>

              <div
                onClick={() => {
                  setResourcesOpen(false);
                  showToast('Opening Symphony Academy...', 'info');
                }}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F7F8FC] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#181A2A]">Academy</div>
                  <div className="text-[10px] text-[#8A90A2]">Watch Tutorials</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => showToast('Connecting to community forum...', 'info')}
          className="hover:text-[#181A2A] transition-colors cursor-pointer py-4"
        >
          Community
        </button>

        <button
          onClick={() => showToast('Support center: support@symphony.io', 'info')}
          className="hover:text-[#181A2A] transition-colors cursor-pointer py-4"
        >
          Support
        </button>
      </nav>

      {/* 3. Right: Feedback Button, Demo Picture Avatar & Grid Switcher */}
      <div className="flex items-center justify-end gap-3 w-48 sm:w-60 shrink-0">
        {/* Feedback Button with rounded-lg */}
        <button
          onClick={() => showToast('Thank you for your feedback!', 'success')}
          className="bg-[#5B50E6] hover:bg-[#4E44D4] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          Feedback
        </button>

        {/* Demo User Profile Picture Avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#ECEEF5] hover:ring-2 hover:ring-[#5B50E6]/30 transition-all cursor-pointer"
            aria-label="User profile menu"
          >
            <img
              src="/avatar.jpg"
              alt="Demo User Profile"
              className="w-full h-full rounded-full object-cover"
            />
            {/* Green Online Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-48 bg-white border border-[#ECEEF5] rounded-lg shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#ECEEF5]">
                <p className="text-xs font-semibold text-[#181A2A]">Sarah Jenkins</p>
                <p className="text-[10px] text-[#8A90A2] truncate">sarah.jenkins@symphony.io</p>
              </div>

              <NavLink
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#5E6478] hover:bg-[#F7F8FC] hover:text-[#181A2A] rounded-lg mx-1 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#8A90A2]" />
                <span>View Profile</span>
              </NavLink>

              <NavLink
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#5E6478] hover:bg-[#F7F8FC] hover:text-[#181A2A] rounded-lg mx-1 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#8A90A2]" />
                <span>Account Settings</span>
              </NavLink>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  setResetModalOpen(true);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg mx-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>

              <div className="my-1 border-t border-[#ECEEF5]" />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  showToast('Signed out of demo session.', 'info');
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-[#5E6478] hover:bg-[#F7F8FC] hover:text-[#181A2A] rounded-lg mx-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#8A90A2]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* 9-Dot Grid App Switcher */}
        <button
          onClick={() => showToast('Symphony Apps Suite', 'info')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A90A2] hover:text-[#181A2A] hover:bg-[#F7F8FC] border border-[#ECEEF5] transition-colors cursor-pointer"
          title="App Switcher"
          aria-label="App switcher"
        >
          <div className="grid grid-cols-3 gap-0.5">
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
          </div>
        </button>
      </div>
    </header>
  );
};
