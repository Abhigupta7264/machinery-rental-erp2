'use client';

import React, { useState, useEffect } from 'react';
import { Users, Phone, ShieldCheck, Calendar, Award } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Operator } from '@/lib/types';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOperators()
      .then((res: any) => setOperators(Array.isArray(res) ? res : res.results || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Operators & Site Crew" subtitle="Licensed plant machinery operators, driving licenses, and contact tracking">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading operator directory...</div>
        ) : operators.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No operators registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3.5">Emp ID</th>
                  <th className="py-3 px-3.5">Operator Name</th>
                  <th className="py-3 px-3.5">Mobile Phone</th>
                  <th className="py-3 px-3.5">Machinery License Type</th>
                  <th className="py-3 px-3.5">License Expiry</th>
                  <th className="py-3 px-3.5 text-center">Experience</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {operators.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {op.employee_id}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-900">
                      {op.name}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700">
                      {op.phone}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="text-slate-800 font-medium">{op.license_type}</div>
                      {op.license_number && (
                        <div className="text-[10px] text-slate-400 font-mono">{op.license_number}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {op.license_expiry ? (
                        <span className="font-mono text-slate-700">{formatDate(op.license_expiry)}</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center font-medium">
                      {op.experience_years} Years
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {op.status_display || op.status}
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

