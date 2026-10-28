'use client';

import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FuelPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFuelRecords()
      .then((res: any) => setRecords(Array.isArray(res) ? res : res.results || []))
      .finally(() => setLoading(false));
  }, []);

  const totalLitres = records.reduce((acc, curr) => acc + parseFloat(curr.litres_issued || '0'), 0);
  const totalCost = records.reduce((acc, curr) => acc + parseFloat(curr.total_cost || '0'), 0);

  return (
    <AppLayout title="Fuel & Diesel Dispensing Logs" subtitle="Track diesel issued to machinery from site bowsers, local fuel stations and consumption records">
      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Diesel Issued</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalLitres.toFixed(1)} <span className="text-sm font-normal">Litres</span></div>
            <div className="text-[11px] text-slate-400 mt-0.5">{records.length} dispensing vouchers</div>
          </div>
          <div className="p-3 bg-orange-50 text-orange-700 rounded-lg">
            <Fuel className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Fuel Expenditure</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCost)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Average rate ₹92.50 / L</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <Fuel className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading fuel records...</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No fuel records logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3.5">Issue Date</th>
                  <th className="py-3 px-3.5">Slip #</th>
                  <th className="py-3 px-3.5">Machine</th>
                  <th className="py-3 px-3.5">Operating Site</th>
                  <th className="py-3 px-3.5 text-right">Litres Issued</th>
                  <th className="py-3 px-3.5 text-right">Rate / Litre</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900">Total Cost</th>
                  <th className="py-3 px-3.5">Bowser / Dispenser Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-900">
                      {formatDate(r.issue_date)}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {r.fuel_slip_number || '--'}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-semibold text-slate-900">{r.machine_code}</span>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{r.machine_name}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-800">
                      {r.site_name}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-orange-700">
                      {parseFloat(r.litres_issued).toFixed(1)} L
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                      ₹{parseFloat(r.fuel_rate).toFixed(2)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(r.total_cost)}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">
                      {r.bowser_source || 'Site Dispenser'}
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

