'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter, Wrench, Shield, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Machine, MachineCategory, Customer, Site } from '@/lib/types';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function FleetPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [categories, setCategories] = useState<MachineCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Register Machine Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [assetCode, setAssetCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [rentalRate, setRentalRate] = useState('1800');
  const [billingType, setBillingType] = useState('HOURLY');
  const [currentMeter, setCurrentMeter] = useState('0.00');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res: any = await api.getMachines(params);
      setMachines(Array.isArray(res) ? res : res.results || []);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchMachines();
    api.getMachineCategories().then((res: any) => setCategories(Array.isArray(res) ? res : res.results || []));
    api.getCustomers().then((res: any) => setCustomers(Array.isArray(res) ? res : res.results || []));
    api.getSites().then((res: any) => setSites(Array.isArray(res) ? res : res.results || []));
  }, []);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!assetCode || !name || !categoryId || !makeModel) {
      setModalError('Please fill in required fields (Asset code, name, category, make/model).');
      return;
    }
    setSaving(true);
    try {
      await api.createMachine({
        asset_code: assetCode,
        name,
        category: categoryId,
        make_model: makeModel,
        registration_number: regNumber,
        serial_number: serialNumber,
        rental_rate: parseFloat(rentalRate) || 0,
        billing_type: billingType,
        current_hour_meter: parseFloat(currentMeter) || 0,
        status: 'AVAILABLE',
      });
      setModalOpen(false);
      // Reset
      setAssetCode('');
      setName('');
      setMakeModel('');
      setRegNumber('');
      fetchMachines();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create machine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Fleet & Machinery Master" subtitle="Heavy machinery asset tracking, deployments, and current meter readings">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search asset code, model, registration..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Fleet Statuses</option>
            <option value="AVAILABLE">Available / Ready</option>
            <option value="RENTED">Rented / On Site</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="BREAKDOWN">Breakdown</option>
          </select>

          <button
            onClick={fetchMachines}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            Filter
          </button>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Register New Machine
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading machinery fleet...</div>
        ) : machines.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No machinery found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3.5">Asset Code</th>
                  <th className="py-3 px-3.5">Machine Name & Model</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Current Site / Deployment</th>
                  <th className="py-3 px-3.5 text-right">Current HMR</th>
                  <th className="py-3 px-3.5 text-right">Rental Rate</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {machines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {m.asset_code}
                      {m.registration_number && (
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {m.registration_number}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.make_model}</div>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium">
                        {m.category_name}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      {m.customer_name ? (
                        <>
                          <div className="font-medium text-slate-900 truncate max-w-[180px]" title={m.customer_name}>
                            {m.customer_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                            {m.site_name || 'Assigned Site'}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Central Heavy Yard (Idle)</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      {parseFloat(m.current_hour_meter || '0').toFixed(2)} Hrs
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono text-slate-800 whitespace-nowrap">
                      {formatCurrency(m.rental_rate)}
                      <span className="text-[10px] text-slate-400">/{m.billing_type_display?.toLowerCase() || 'hr'}</span>
                    </td>

                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Machine Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Register New Machinery Asset
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-rose-50 text-rose-700 text-xs">{modalError}</div>
            )}

            <form onSubmit={handleCreateMachine} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Asset Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EXC-0109"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Machine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Komatsu PC210-10M0 Hydraulic Excavator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Make & Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Komatsu PC210"
                    value={makeModel}
                    onChange={(e) => setMakeModel(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Reg Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-04-EK-9182"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Current HMR (Hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentMeter}
                    onChange={(e) => setCurrentMeter(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Billing Type</label>
                  <select
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="SHIFT">Shift</option>
                    <option value="DAILY">Daily</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rental Rate (₹)</label>
                  <input
                    type="number"
                    value={rentalRate}
                    onChange={(e) => setRentalRate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Register Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

