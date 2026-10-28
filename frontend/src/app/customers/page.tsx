'use client';

import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, FileText, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Customer } from '@/lib/types';
import { api } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomers()
      .then((res: any) => setCustomers(Array.isArray(res) ? res : res.results || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Customers, Projects & Operating Sites" subtitle="Commercial contractor accounts, site locations, and site supervisors">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading customer accounts...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">No customer accounts registered.</div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {c.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 leading-snug">
                  {c.name}
                </h3>
                {c.contact_person && (
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    Contact: {c.contact_person}
                  </div>
                )}

                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.gstin && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      GSTIN: <span className="font-semibold text-slate-700">{c.gstin}</span>
                    </div>
                  )}
                  {c.billing_address && (
                    <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.billing_address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {c.deployed_machine_count || 0} Machines Deployed
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Credit: {c.credit_period_days} Days
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

