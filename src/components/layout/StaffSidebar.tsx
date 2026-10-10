'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  CreditCard, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  ShieldCheck, 
  LayoutDashboard, 
  Loader2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const StaffSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = [
    { 
      href: '/staff/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: 'Overview',
    },
    { 
      href: '/staff/students', 
      label: 'Enrolment', 
      icon: Users,
      badge: 'Registry',
    },
    { 
      href: '/staff/fees', 
      label: 'Fees & Payments', 
      icon: CreditCard,
      badge: 'Ledger',
    },
    { 
      href: '/staff/assessments', 
      label: 'Assessments', 
      icon: BookOpen,
      badge: 'Coursework',
    },
    { 
      href: '/staff/marksheet', 
      label: 'Marksheet & Results', 
      icon: GraduationCap,
      badge: 'Grades',
    },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/staff/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="SMS Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50 block leading-tight">
              SMS Registry
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#0269ae] dark:text-[#43b5e9]">
              Staff Portal
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Group */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <div className="px-3 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Workflows & Modules
          </div>
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#0269ae]/10 dark:bg-[#0269ae]/20 text-[#0269ae] dark:text-[#43b5e9] font-semibold shadow-xs border border-[#0269ae]/30 dark:border-[#0269ae]/40'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${
                      isActive 
                        ? 'text-[#0269ae] dark:text-[#43b5e9]' 
                        : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                    }`} />
                    <span>{link.label}</span>
                  </div>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0269ae] dark:bg-[#43b5e9]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Session & Logout Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0269ae] to-[#014777] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user?.name || 'Registry Admin'}
            </div>
            <div className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate">
              {user?.email || 'admin@sms.ac.uk'}
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0269ae]/10 dark:bg-[#0269ae]/20 text-[#0269ae] dark:text-[#43b5e9] border border-[#0269ae]/30 dark:border-[#0269ae]/40">
            STAFF
          </span>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 transition-all disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 w-full h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur flex items-center justify-between px-4">
        <Link href="/staff/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center shadow-xs">
            <Image
              src="/logo.png"
              alt="SMS Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-50">
              SMS Registry
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#0269ae]/10 dark:bg-[#0269ae]/20 text-[#0269ae] dark:text-[#43b5e9] border border-[#0269ae]/30 dark:border-[#0269ae]/40">
              Staff
            </span>
          </div>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Toggle navigation drawer"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative w-72 max-w-xs h-full shadow-2xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-zinc-200 dark:border-zinc-800 z-30">
        {sidebarContent}
      </aside>
    </>
  );
};

export default StaffSidebar;
