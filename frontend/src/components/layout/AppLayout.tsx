'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { api } from '@/lib/api';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    // Fetch dashboard stats for pending logsheets badge only if authenticated
    api.getDashboardMetrics()
      .then((data: any) => {
        if (data?.logsheets?.pending_approval) {
          setPendingCount(data.logsheets.pending_approval);
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingLogsheetsCount={pendingCount}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
