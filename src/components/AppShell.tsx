'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Boxes,
  Package,
  ArrowLeftRight,
  TrendingUp,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  PlusCircle,
  Truck,
  RotateCcw,
  Search,
  Menu,
  X,
  DatabaseZap,
  SlidersHorizontal,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Stock Balances', href: '/inventory', icon: Boxes },
      { label: 'Products & SKUs', href: '/inventory/products', icon: Package },
      { label: 'Stock Movements', href: '/inventory/movements', icon: TrendingUp },
      { label: 'Receive Inward', href: '/inventory/receipts', icon: PlusCircle },
      { label: 'Transfers', href: '/inventory/transfers', icon: ArrowLeftRight },
      { label: 'Adjustments', href: '/inventory/adjustments', icon: SlidersHorizontal },
      { label: 'Warehouses', href: '/inventory/warehouses', icon: Building2 },
    ],
  },
  {
    title: 'Orders & Fulfillment',
    items: [
      { label: 'All Orders', href: '/orders', icon: FileText },
      { label: 'New Order', href: '/orders/new', icon: PlusCircle },
      { label: 'Dispatches', href: '/orders/dispatches', icon: Truck },
      { label: 'Customer Returns', href: '/orders/returns', icon: RotateCcw },
      { label: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    title: 'Reports & Control',
    items: [
      { label: 'Reports & Export', href: '/reports', icon: FileText },
      { label: 'Reconciliation', href: '/inventory/reconciliation', icon: DatabaseZap },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Team & Access', href: '/team', icon: Users },
      { label: 'Audit Trail', href: '/audit', icon: ShieldCheck },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  // If on login page, render only the login view with no shell chrome
  if (pathname === '/login') {
    return <>{children}</>;
  }

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.data) {
          setUser(data.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/me', { method: 'POST' });
    } catch {
      // Proceed with redirect regardless of network state
    }
    window.location.href = '/login';
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ME';

  return (
    <div className="min-h-screen flex bg-[#F3F5F4] text-[#171B18] antialiased">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#E7EBE7] shrink-0 sticky top-0 h-screen overflow-y-auto z-20 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#E7EBE7] gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#171B18] flex items-center justify-center text-[#A7F432] font-black text-base shadow-sm ring-1 ring-black/5">
            m
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-stone-900 leading-tight">
              MiEstilo
            </h1>
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest block">
              Luxury Bed & Bath Linen
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-4 py-5 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                {section.title}
              </span>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-[#F0FBD9] text-[#162402] font-semibold shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-[#366804]' : 'text-stone-400'
                        )}
                      />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A7F432] ml-auto ring-2 ring-lime-400/40" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-[#E7EBE7] bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-1 ring-black/5">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-xs font-bold text-stone-900 block truncate leading-tight">
                {user?.name || 'Authorized Staff'}
              </span>
              <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider block truncate">
                {user?.role ? user.role.replace(/_/g, ' ') : 'Verified'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E7EBE7] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-800">MiEstilo Operations</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <span className="capitalize">{pathname.split('/')[1] || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, order, customer..."
                className="w-full bg-[#F3F5F4] border-0 rounded-full pl-9 pr-4 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-[#A7F432] focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Role & User Badge */}
            <div className="flex items-center gap-3 pl-3 border-l border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-semibold text-stone-900 block leading-tight">
                    {user?.name || 'Authorized Staff'}
                  </span>
                  <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider block">
                    {user?.role ? user.role.replace(/_/g, ' ') : 'Operations'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50">
              <div className="h-16 flex items-center justify-between px-6 border-b border-stone-200">
                <span className="font-extrabold text-sm tracking-tight text-stone-900">
                  MiEstilo Luxury Linen
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-stone-500 hover:text-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                {navSections.map((sec) => (
                  <div key={sec.title}>
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-2">
                      {sec.title}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {sec.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={clsx(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium',
                            pathname === item.href
                              ? 'bg-[#F0FBD9] text-[#162402] font-semibold'
                              : 'text-stone-600 hover:bg-stone-50'
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-stone-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-stone-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
