'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, FileDown, Fuel, Clock, Truck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { DashboardMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardMetrics()
      .then((data: any) => setMetrics(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Operational & Fleet Intelligence Reports" subtitle="Machine productivity, diesel burn rate analysis, idle & breakdown loss metrics">
      {loading || !metrics ? (
        <div className="py-20 text-center text-xs text-slate-400">Compiling analytical aggregates...</div>
      ) : (
        <div className="space-y-6 text-xs">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Effective Working Run Hours</div>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {metrics.operations.total_working_hours.toFixed(1)} <span className="text-xs font-normal text-slate-500">Hrs</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">From approved daily logsheets</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Idle / Standby Loss Time</div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {metrics.operations.total_idle_hours.toFixed(1)} <span className="text-xs font-normal text-slate-500">Hrs</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Engine on without productive load</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Breakdown Loss Hours</div>
              <div className="text-2xl font-black text-rose-800 mt-1">
                {metrics.operations.total_breakdown_hours.toFixed(1)} <span className="text-xs font-normal text-slate-500">Hrs</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Job card emergency maintenance loss</div>
            </div>
          </div>

          {/* Machine Utilization Detail */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Machine-wise Verified Working Hours
              </h3>
              <span className="text-slate-400 font-mono text-[11px]">Ranked by billing hours</span>
            </div>

            <div className="space-y-4">
              {metrics.machine_utilization.map((item, idx) => {
                const max = Math.max(...metrics.machine_utilization.map((m) => m.hours), 1);
                const pct = Math.round((item.hours / max) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-900">{item.machine}</span>
                      <span className="font-mono font-bold text-blue-700">{item.hours.toFixed(2)} Run Hours</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

