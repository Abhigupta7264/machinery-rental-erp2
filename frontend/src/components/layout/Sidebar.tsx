'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Building2,
  MapPin,
  Users,
  FileSpreadsheet,
  Fuel,
  Wrench,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  pendingLogsheetsCount?: number;
}

export function Sidebar({ isOpen, onClose, pendingLogsheetsCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navSections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
          href: '/logsheets',
          label: 'Logsheet Management',
          icon: ClipboardList,
          badge: pendingLogsheetsCount > 0 ? pendingLogsheetsCount : undefined,
          highlight: true,
        },
      ],
    },
    {
      title: 'OPERATIONS & ASSETS',
      items: [
        { href: '/fleet', label: 'Fleet & Machinery', icon: Truck },
        { href: '/fuel', label: 'Fuel & Diesel Logs', icon: Fuel },
        { href: '/maintenance', label: 'Maintenance & Service', icon: Wrench },
      ],
    },
    {
      title: 'COMMERCIAL & SITES',
      items: [
        { href: '/customers', label: 'Customers & Accounts', icon: Building2 },
        { href: '/operators', label: 'Operators & Staff', icon: Users },
        { href: '/billing', label: 'Billing & Invoices', icon: Receipt },
      ],
    },
    {
      title: 'INTELLIGENCE & ADMIN',
      items: [
        { href: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
        { href: '/settings', label: 'Settings & Audit Trail', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 border-r border-slate-800',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                INFRA-EQUIP <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">ERP</span>
              </div>
              <div className="text-[11px] text-slate-400">Machinery & Logsheet Hub</div>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group relative',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                        item.highlight && !isActive && 'border border-blue-500/30 bg-blue-950/20 text-blue-200'
                      )}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={cn(
                            'w-4 h-4 transition-colors',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className="flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Orecs-Class Engine</span>
          </div>
          <span className="text-slate-400 font-mono text-[10px]">v1.0.0</span>
        </div>
      </aside>
    </>
  );
}

