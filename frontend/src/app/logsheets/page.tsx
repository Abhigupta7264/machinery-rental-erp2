'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  FileDown,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Fuel,
  Send,
  Ban,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LogsheetListItem, Machine, Customer, LogsheetStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function LogsheetsListPage() {
  const router = useRouter();
  const [logsheets, setLogsheets] = useState<LogsheetListItem[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal State for Reject
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLogsheetId, setSelectedLogsheetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLogsheets = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (machineFilter) params.machine = machineFilter;
      if (customerFilter) params.customer = customerFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const data: any = await api.getLogsheets(params);
      const list = Array.isArray(data) ? data : (data?.results || []);
      setLogsheets(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load logsheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsheets();
    // Load machines and customers for filter dropdowns
    api.getMachines().then((res: any) => setMachines(Array.isArray(res) ? res : res.results || []));
    api.getCustomers().then((res: any) => setCustomers(Array.isArray(res) ? res : res.results || []));
  }, []);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogsheets();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setMachineFilter('');
    setCustomerFilter('');
    setDateFrom('');
    setDateTo('');
    // Re-fetch default
    api.getLogsheets().then((data: any) => {
      setLogsheets(Array.isArray(data) ? data : data?.results || []);
    });
  };

  // Actions
  const handleSubmit = async (id: string) => {
    if (!confirm('Submit this logsheet for supervisor approval?')) return;
    try {
      await api.submitLogsheet(id);
      fetchLogsheets();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this logsheet? This will finalize working hours and update machine meters.')) return;
    try {
      await api.approveLogsheet(id);
      fetchLogsheets();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const openRejectModal = (id: string) => {
    setSelectedLogsheetId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedLogsheetId || !rejectionReason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.rejectLogsheet(selectedLogsheetId, rejectionReason);
      setRejectModalOpen(false);
      fetchLogsheets();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Aggregated Summary Stats for Current View
  const totalHours = logsheets.reduce((acc, curr) => acc + parseFloat(curr.working_hours || '0'), 0);
  const totalDiesel = logsheets.reduce((acc, curr) => acc + parseFloat(curr.diesel_consumed_litres || '0'), 0);
  const pendingCount = logsheets.filter((l) => l.status === 'SUBMITTED').length;
  const approvedCount = logsheets.filter((l) => l.status === 'APPROVED').length;

  return (
    <AppLayout
      title="Daily Machinery Logsheets"
      subtitle="Record, verify, approve, and generate certified A4 daily equipment run sheets"
    >
      {/* 1. Metric Overview Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Records in View</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{logsheets.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total working logs</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase">Pending Approval</div>
            <div className="text-2xl font-bold text-amber-800 mt-1">{pendingCount}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Awaiting site in-charge</div>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase">Total Run Hours</div>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{totalHours.toFixed(2)} <span className="text-sm font-normal">Hrs</span></div>
            <div className="text-[11px] text-emerald-600 mt-0.5">{approvedCount} approved sheets</div>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Diesel Consumed</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalDiesel.toFixed(1)} <span className="text-sm font-normal">Litres</span></div>
            <div className="text-[11px] text-slate-400 mt-0.5">Burn: {(totalHours > 0 ? (totalDiesel / totalHours).toFixed(2) : '0')} L/hr</div>
          </div>
          <div className="p-3 bg-orange-50 text-orange-700 rounded-lg">
            <Fuel className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Action Header & Multi-Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Logsheet Register</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {logsheets.length} total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogsheets}
              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium flex items-center transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/logsheets/new"
              className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Logsheet
            </Link>
          </div>
        </div>

        {/* Filter Inputs */}
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search logsheet #, machine code, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted (Pending)</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>

          <div>
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Machines</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.asset_code} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              title="Date From"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading logsheets register...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
          </div>
        ) : logsheets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <div className="text-base font-semibold text-slate-700">No logsheets found</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No daily logsheets match your current filter parameters. Try clearing the search or create a new logsheet.
            </p>
            <Link
              href="/logsheets/new"
              className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create First Logsheet
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
                  <th className="py-3 px-3.5">Logsheet #</th>
                  <th className="py-3 px-3.5">Work Date</th>
                  <th className="py-3 px-3.5">Machine / Asset</th>
                  <th className="py-3 px-3.5">Customer & Site</th>
                  <th className="py-3 px-3.5">Operator</th>
                  <th className="py-3 px-3.5 text-right">Opening HMR</th>
                  <th className="py-3 px-3.5 text-right">Closing HMR</th>
                  <th className="py-3 px-3.5 text-right font-bold text-blue-900">Run Hours</th>
                  <th className="py-3 px-3.5 text-right">Diesel (L)</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {logsheets.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Logsheet Number */}
                    <td className="py-3 px-3.5 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      <Link href={`/logsheets/${l.id}`} className="hover:underline">
                        {l.logsheet_number}
                      </Link>
                      <div className="text-[10px] text-slate-600 font-sans font-normal">
                        {l.shift_display}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{formatDate(l.date)}</div>
                    </td>

                    {/* Machine */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700 border border-slate-200">
                          {l.machine_code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {l.machine_name}
                      </div>
                    </td>

                    {/* Customer & Site */}
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-900 truncate max-w-[160px]" title={l.customer_name}>
                        {l.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]" title={l.site_name}>
                        {l.site_name}
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{l.operator_name}</div>
                    </td>

                    {/* Opening HMR */}
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                      {parseFloat(l.opening_meter).toFixed(2)}
                    </td>

                    {/* Closing HMR */}
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                      {parseFloat(l.closing_meter).toFixed(2)}
                    </td>

                    {/* Working Hours */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                      {parseFloat(l.working_hours).toFixed(2)} hrs
                      {parseFloat(l.overtime_hours || '0') > 0 && (
                        <div className="text-[10px] font-normal text-amber-600">
                          +{l.overtime_hours} OT
                        </div>
                      )}
                    </td>

                    {/* Diesel */}
                    <td className="py-3 px-3.5 text-right font-mono text-slate-700 whitespace-nowrap">
                      {parseFloat(l.diesel_consumed_litres || '0') > 0 ? (
                        <span>{parseFloat(l.diesel_consumed_litres).toFixed(1)} L</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <StatusBadge status={l.status} size="sm" />
                      {l.billed && (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          ✓ Billed
                        </div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1">
                      {/* View Detail */}
                      <Link
                        href={`/logsheets/${l.id}`}
                        className="inline-flex items-center p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Document & Audit Trail"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* Download PDF */}
                      <a
                        href={api.getLogsheetPdfUrl(l.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Download Official ReportLab PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </a>

                      {/* Submit action for Draft / Rejected */}
                      {(l.status === 'DRAFT' || l.status === 'REJECTED') && (
                        <>
                          <Link
                            href={`/logsheets/${l.id}/edit`}
                            className="inline-flex items-center p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleSubmit(l.id)}
                            className="inline-flex items-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Submit for Approval"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Supervisor Approval / Rejection actions for SUBMITTED */}
                      {l.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => handleApprove(l.id)}
                            className="inline-flex items-center p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Approve Logsheet"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRejectModal(l.id)}
                            className="inline-flex items-center p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Reject with Reason"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Reject Logsheet</h3>
            </div>

            <p className="text-xs text-slate-600">
              Please provide a clear reason for rejecting this logsheet. The record will be sent back to the operator for correction with this reason recorded in the audit history.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Closing hour-meter reading does not match site photo / Breakdown hours discrepancy..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

