'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Plus, CheckCircle, Clock, FileSpreadsheet, ArrowRight, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Customer, LogsheetListItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [approvedLogsheets, setApprovedLogsheets] = useState<LogsheetListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedLogsheetIds, setSelectedLogsheetIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res: any = await api.getInvoices();
      setInvoices(Array.isArray(res) ? res : res.results || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
    api.getCustomers().then((res: any) => setCustomers(Array.isArray(res) ? res : res.results || []));
  }, []);

  const openGenerateModal = async () => {
    setErrorMsg('');
    setSelectedCustomer('');
    setSelectedLogsheetIds([]);
    setModalOpen(true);

    // Fetch approved unbilled logsheets
    try {
      const res: any = await api.getLogsheets({ status: 'APPROVED', billed: 'false' });
      setApprovedLogsheets(Array.isArray(res) ? res : res.results || []);
    } catch {}
  };

  const handleToggleLogsheet = (id: string) => {
    if (selectedLogsheetIds.includes(id)) {
      setSelectedLogsheetIds(selectedLogsheetIds.filter((item) => item !== id));
    } else {
      setSelectedLogsheetIds([...selectedLogsheetIds, id]);
    }
  };

  const filteredLogsheets = selectedCustomer
    ? approvedLogsheets.filter((l) => l.customer === selectedCustomer)
    : approvedLogsheets;

  const handleGenerateInvoice = async () => {
    if (!selectedCustomer || selectedLogsheetIds.length === 0) {
      setErrorMsg('Please select a customer and at least one approved logsheet.');
      return;
    }
    setGenerating(true);
    setErrorMsg('');
    try {
      await api.generateInvoiceFromLogsheets(selectedCustomer, selectedLogsheetIds);
      setModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invoice generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout title="Billing & Invoicing" subtitle="Contractor billing invoices generated directly from verified & approved daily logsheets">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Commercial Invoices Register</h2>
          <p className="text-xs text-slate-500">GST-compliant rental invoices linked to verified machinery logs</p>
        </div>

        <button
          onClick={openGenerateModal}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Generate Invoice from Approved Logsheets
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading billing invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No invoices generated yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3.5">Invoice #</th>
                  <th className="py-3 px-3.5">Customer / Client</th>
                  <th className="py-3 px-3.5">Invoice Date</th>
                  <th className="py-3 px-3.5 text-right">Subtotal</th>
                  <th className="py-3 px-3.5 text-right">GST (18%)</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900">Grand Total</th>
                  <th className="py-3 px-3.5 text-right font-bold text-amber-700">Balance Due</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-900">
                      {inv.customer_name}
                      {inv.project_name && (
                        <div className="text-[11px] text-slate-500 font-normal">{inv.project_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800">
                      {formatDate(inv.invoice_date)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(inv.tax_amount)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(inv.grand_total)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                      {formatCurrency(inv.balance_due)}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {inv.status_display || inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Generate Invoice from Approved Logsheets
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-50 text-rose-700 text-xs shrink-0 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4 overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Customer to Bill *</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setSelectedLogsheetIds([]);
                  }}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-800">
                    Eligible Approved & Unbilled Logsheets ({filteredLogsheets.length} available)
                  </span>
                  {filteredLogsheets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedLogsheetIds.length === filteredLogsheets.length) {
                          setSelectedLogsheetIds([]);
                        } else {
                          setSelectedLogsheetIds(filteredLogsheets.map((l) => l.id));
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      {selectedLogsheetIds.length === filteredLogsheets.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {filteredLogsheets.length === 0 ? (
                  <div className="p-6 bg-slate-50 border rounded-lg text-center text-slate-400">
                    No approved, unbilled logsheets found for this customer.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                    {filteredLogsheets.map((l) => {
                      const isChecked = selectedLogsheetIds.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => handleToggleLogsheet(l.id)}
                          className={`p-2.5 rounded border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isChecked ? 'bg-blue-50 border-blue-400 text-blue-900' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                              <span className="font-mono font-bold">{l.logsheet_number}</span>
                              <span className="text-slate-400 mx-1.5">&bull;</span>
                              <span>{formatDate(l.date)}</span>
                              <span className="text-slate-400 mx-1.5">&bull;</span>
                              <span className="font-medium text-slate-800">{l.machine_code} ({l.machine_name})</span>
                            </div>
                          </div>
                          <div className="font-mono font-bold text-right text-blue-900">
                            {parseFloat(l.working_hours).toFixed(2)} Hrs
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generating || !selectedCustomer || selectedLogsheetIds.length === 0}
                onClick={handleGenerateInvoice}
                className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 text-xs shadow-sm"
              >
                {generating ? 'Generating Invoice...' : `Generate Invoice (${selectedLogsheetIds.length} Logsheets)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

