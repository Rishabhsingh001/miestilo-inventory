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
  Sparkles,
  Search,
  Menu,
  X,
  DatabaseZap,
  SlidersHorizontal,
  ChevronRight,
  LogOut,
  UserCheck
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
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
      { label: 'Audit Trail', href: '/audit', icon: ShieldCheck },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('SUPER_ADMIN');

  const handleQuickSeed = async () => {
    try {
      setIsSeeding(true);
      setSeedMessage(null);
      const res = await fetch('/api/v1/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage('Demo linen inventory seeded successfully!');
        setTimeout(() => {
          setSeedMessage(null);
          window.location.reload();
        }, 1500);
      } else {
        setSeedMessage('Seed failed: ' + (data.error?.message || 'Error'));
      }
    } catch (err: any) {
      setSeedMessage('Seed failed: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F3F5F4] text-[#171B18]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#E7EBE7] shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#E7EBE7] gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#171B18] flex items-center justify-center text-[#A7F432] font-bold text-lg shadow-sm">
            M
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-stone-900 leading-tight">
              MISTERIO
            </h1>
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest block">
              Lifestyle Linen
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
                          ? 'bg-[#F0FBD9] text-[#162402] font-semibold'
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

        {/* Quick Seed & Demo Helper */}
        <div className="p-4 border-t border-[#E7EBE7] bg-stone-50/50">
          <button
            onClick={handleQuickSeed}
            disabled={isSeeding}
            className="w-full btn-secondary text-xs py-2 bg-white flex items-center justify-center gap-2 shadow-xs hover:border-lime-400"
          >
            <Sparkles className={clsx('w-3.5 h-3.5 text-lime-600', isSeeding && 'animate-spin')} />
            <span>{isSeeding ? 'Seeding Data...' : 'Reset Demo Inventory'}</span>
          </button>
          {seedMessage && (
            <p className="mt-1.5 text-[11px] text-center font-medium text-emerald-700 bg-emerald-50 rounded py-1 px-2">
              {seedMessage}
            </p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E7EBE7] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
              <span className="font-medium text-stone-800">Misterio Operations</span>
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
            <div className="flex items-center gap-2.5 pl-3 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-lime-100 border border-lime-300 text-lime-900 font-bold text-xs flex items-center justify-center">
                RS
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-stone-900 block leading-tight">
                  Rishabh Singh
                </span>
                <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider block">
                  Super Admin
                </span>
              </div>
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
                <span className="font-bold text-sm tracking-tight text-stone-900">
                  Misterio Lifestyle
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
