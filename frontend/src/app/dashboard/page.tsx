'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  CheckCircle2,
  Clock,
  Wrench,
  Fuel,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  BarChart,
  Plus,
  RefreshCw,
  Building,
  Calendar,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics, Site } from '@/lib/types';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const fetchMetrics = async (sId?: string, dFrom?: string, dTo?: string) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      const siteVal = sId !== undefined ? sId : selectedSite;
      const fromVal = dFrom !== undefined ? dFrom : dateFrom;
      const toVal = dTo !== undefined ? dTo : dateTo;

      if (siteVal && siteVal.trim()) params.site = siteVal.trim();
      if (fromVal) params.date_from = fromVal;
      if (toVal) params.date_to = toVal;

      const data: any = await api.getDashboardMetrics(Object.keys(params).length > 0 ? params : undefined);
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    fetchMetrics();
    api.getSites()
      .then((res: any) => setSites(Array.isArray(res) ? res : res.results || []))
      .catch(() => { });
  }, [router]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchMetrics(selectedSite, dateFrom, dateTo);
  };

  const handleResetFilter = () => {
    setSelectedSite('');
    setDateFrom('');
    setDateTo('');
    fetchMetrics('', '', '');
  };

  if (!mounted) {
    return (
      <AppLayout title="Operations & Fleet Dashboard">
        <div className="py-20 text-center text-xs text-slate-400">Loading portal...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Operations & Fleet Dashboard"
      subtitle="Real-time machinery deployment, daily logsheet approvals, diesel burn, and billing analytics"
    >
      {/* Filter Ribbon with Site & Date-Range Controls */}
      <form onSubmit={handleApplyFilter} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs">
            {/* Site Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-600" /> Site / Yard
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 font-medium text-xs"
              >
                <option value="">All Operating Sites & Yards</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 lg:pt-4">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
            <Link
              href="/logsheets/new"
              className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Logsheet
            </Link>
          </div>
        </div>
      </form>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchMetrics()}
            className="px-3 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      ) : loading && !metrics ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading live operations dashboard...
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Card Row 1: Vital Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Machinery */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Fleet Registered
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {metrics.fleet?.total ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-700 font-semibold">{metrics.fleet?.available ?? 0} ready</span>
                  <span>&bull;</span>
                  <span className="text-indigo-700 font-semibold">{metrics.fleet?.rented ?? 0} deployed</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            {/* Pending Logsheet Approvals */}
            <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/25 shadow-sm flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Logsheets Pending Approval
                </div>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {metrics.logsheets?.pending_approval ?? 0}
                </div>
                <div className="text-[11px] text-amber-700 mt-1">
                  {metrics.logsheets?.approved ?? 0} approved &bull; {metrics.logsheets?.draft ?? 0} in draft
                </div>
              </div>
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Total Working Hours */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Operational Run Hours
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {(metrics.operations?.total_working_hours ?? 0).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-500">Hrs</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Idle: {(metrics.operations?.total_idle_hours ?? 0).toFixed(1)}h &bull; Breakdown: {(metrics.operations?.total_breakdown_hours ?? 0).toFixed(1)}h
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Diesel Consumed */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Diesel Consumption
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {(metrics.operations?.diesel_consumed_litres ?? 0).toFixed(0)}{' '}
                  <span className="text-xs font-normal text-slate-500">Litres</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Total Issued: {(metrics.fuel?.total_issued_litres ?? 0).toFixed(0)} L
                </div>
              </div>
              <div className="p-3 bg-orange-50 text-orange-700 rounded-xl">
                <Fuel className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card Row 2: Secondary Status Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">Fleet Utilization</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {metrics.fleet?.utilization_rate ?? 0}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {metrics.fleet?.rented ?? 0} of {metrics.fleet?.total ?? 0} machines active on sites
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">Machines Under Service</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {metrics.fleet?.maintenance ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Routine preventive or job card repairs
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600">
                <Wrench className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">Outstanding Invoices</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(metrics.finance?.outstanding_amount ?? 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {metrics.finance?.pending_invoices_count ?? 0} pending client bills
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section 3: Machine Utilization & Recent Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Machine Utilization Bar Chart */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <BarChart className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Top Machine Utilization (Approved Hours)
                  </h3>
                </div>
                <Link href="/reports" className="text-xs text-blue-600 hover:underline">
                  Full Report &rarr;
                </Link>
              </div>

              {metrics.machine_utilization && metrics.machine_utilization.length > 0 ? (
                <div className="space-y-3">
                  {metrics.machine_utilization.map((item, idx) => {
                    const maxHours = Math.max(...metrics.machine_utilization.map((m) => m.hours || 0), 1);
                    const hoursVal = item.hours || 0;
                    const pct = Math.round((hoursVal / maxHours) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-800 truncate max-w-[220px]">
                            {item.machine}
                          </span>
                          <span className="font-mono font-bold text-blue-700">
                            {hoursVal.toFixed(1)} hrs
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No approved machine hours recorded in this filter period.
                </div>
              )}
            </div>

            {/* Recent Audit / Operational Activity Feed */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Recent Operational Audit Activity
                  </h3>
                </div>
                <Link href="/settings" className="text-xs text-blue-600 hover:underline">
                  Audit Logs &rarr;
                </Link>
              </div>

              {metrics.recent_activity && metrics.recent_activity.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {metrics.recent_activity.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-100 text-blue-800">
                          {act.action}
                        </span>
                        <span className="text-slate-800 font-medium">
                          {act.entity}
                        </span>
                        <span className="text-slate-400">by {act.actor || 'System'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No recent activity logged.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}
