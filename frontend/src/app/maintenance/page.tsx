'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function MaintenancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMaintenanceRecords()
      .then((res: any) => setRecords(Array.isArray(res) ? res : res.results || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Maintenance, Repairs & Service Job Cards" subtitle="Preventive maintenance intervals, emergency breakdown tickets, and spare parts logs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading maintenance job cards...</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No maintenance tickets recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3.5">Job Card #</th>
                  <th className="py-3 px-3.5">Machine</th>
                  <th className="py-3 px-3.5">Service Type</th>
                  <th className="py-3 px-3.5">Start Date</th>
                  <th className="py-3 px-3.5">Reported Issue / Work</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900">Total Cost</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {r.job_card_number}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-semibold text-slate-900">{r.machine_code}</span>
                      <div className="text-[11px] text-slate-500">{r.machine_name}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                        {r.service_type_display}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-900">
                      {formatDate(r.start_date)}
                    </td>
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="font-medium text-slate-900 truncate" title={r.problem_reported}>
                        {r.problem_reported}
                      </div>
                      {r.parts_replaced && (
                        <div className="text-[10px] text-slate-500 truncate" title={r.parts_replaced}>
                          Parts: {r.parts_replaced}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.total_cost)}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                        {r.status_display || r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

