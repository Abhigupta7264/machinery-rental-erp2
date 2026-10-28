'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  LogOut,
  Building,
} from 'lucide-react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
}

export function TopNavbar({ onToggleSidebar, title, subtitle }: TopNavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      api.getCurrentUser()
        .then((data: any) => {
          setUser(data);
          localStorage.setItem('auth_user', JSON.stringify(data));
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title || 'Machinery Rental ERP'}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Site Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          <Building className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium">All Sites & Plants Active</span>
        </div>

        {/* User Pill - Render only after mounted to eliminate SSR hydration discrepancy */}
        {mounted && user ? (
          <div className="flex items-center space-x-3 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">
                {user.full_name || user.username}
              </div>
              <div className="text-[10px] text-blue-700 font-medium tracking-wide">
                {user.role_display}
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
              {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : mounted ? (
          <button
            onClick={() => router.push('/login')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            Sign In
          </button>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
        )}
      </div>
    </header>
  );
}
