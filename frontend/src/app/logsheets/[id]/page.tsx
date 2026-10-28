'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileDown,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  Edit,
  History,
  ShieldCheck,
  Building,
  Truck,
  Fuel,
  Ban,
  Calendar,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LogsheetDetail, CompanySettings } from '@/lib/types';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function LogsheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [logsheet, setLogsheet] = useState<LogsheetDetail | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLogsheet = async () => {
    setLoading(true);
    try {
      const data: any = await api.getLogsheet(id);
      setLogsheet(data);
      const settingsData: any = await api.getSettings();
      setCompany(settingsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load logsheet details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLogsheet();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!confirm('Submit this logsheet for supervisor approval?')) return;
    setActionLoading(true);
    try {
      await api.submitLogsheet(id);
      fetchLogsheet();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this logsheet? This records official operating hours and updates machine meter readings.')) return;
    setActionLoading(true);
    try {
      await api.approveLogsheet(id);
      fetchLogsheet();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.rejectLogsheet(id, rejectionReason);
      setRejectModalOpen(false);
      fetchLogsheet();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!voidReason.trim()) {
      alert('A reason is required to void this record.');
      return;
    }
    setActionLoading(true);
    try {
      await api.voidLogsheet(id, voidReason);
      setVoidModalOpen(false);
      fetchLogsheet();
    } catch (err: any) {
      alert(`Void failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppLayout title="Logsheet Details">
        <div className="py-24 text-center text-slate-500 text-sm">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          Loading logsheet document...
        </div>
      </AppLayout>
    );
  }

  if (error || !logsheet) {
    return (
      <AppLayout title="Error">
        <div className="p-8 text-center text-rose-600 bg-white rounded-xl border border-rose-200">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <div className="font-bold text-base">{error || 'Logsheet not found'}</div>
          <Link
            href="/logsheets"
            className="mt-4 inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Logsheets
          </Link>
        </div>
      </AppLayout>
    );
  }

  const runHours = parseFloat(logsheet.working_hours || '0');
  const dieselConsumed = parseFloat(logsheet.diesel_consumed_litres || '0');
  const burnRate = runHours > 0 && dieselConsumed > 0 ? (dieselConsumed / runHours).toFixed(2) : '--';

  return (
    <AppLayout
      title={`Logsheet ${logsheet.logsheet_number}`}
      subtitle={`Equipment Operational Record & Verification for ${logsheet.machine_code}`}
    >
      {/* Action Command Toolbar - Hidden on Print */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <Link
          href="/logsheets"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Register
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Official ReportLab PDF */}
          <a
            href={api.getLogsheetPdfUrl(logsheet.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            Download PDF
          </a>

          {/* In-Browser Print */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print A4 Document
          </button>

          {/* Submit Action for Draft / Rejected */}
          {(logsheet.status === 'DRAFT' || logsheet.status === 'REJECTED') && (
            <>
              <Link
                href={`/logsheets/${logsheet.id}/edit`}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit Record
              </Link>

              <button
                disabled={actionLoading}
                onClick={handleSubmit}
                className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submit for Approval
              </button>
            </>
          )}

          {/* Approval / Rejection Actions for Supervisor on SUBMITTED */}
          {logsheet.status === 'SUBMITTED' && (
            <>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Approve Logsheet
              </button>

              <button
                disabled={actionLoading}
                onClick={() => setRejectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Reject
              </button>
            </>
          )}

          {/* Void Action for Approved */}
          {logsheet.status === 'APPROVED' && !logsheet.billed && (
            <button
              onClick={() => setVoidModalOpen(true)}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Authorized Void Workflow"
            >
              <Ban className="w-3.5 h-3.5 mr-1" />
              Void
            </button>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner if status is REJECTED */}
      {logsheet.status === 'REJECTED' && logsheet.rejection_reason && (
        <div className="print:hidden p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold">Logsheet Requires Correction & Resubmission</div>
            <p className="mt-1 font-medium">{logsheet.rejection_reason}</p>
            <div className="text-[11px] text-rose-700 mt-1">
              Reviewed by {logsheet.approved_by_name || 'Site Supervisor'} on {formatDate(logsheet.approved_at)}
            </div>
          </div>
        </div>
      )}

      {/* 4. THE DOCUMENT CONTAINER (Clean A4 Paper Style with Dedicated Print CSS) */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-lg p-6 sm:p-10 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-900">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-blue-950 uppercase">
            {company?.company_name || 'INFRA-EQUIP RENTALS & HEAVY FLEET PVT LTD'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {company?.tagline} &bull; {company?.registration_no} &bull; GSTIN: {company?.gstin}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Registered Office: {company?.registered_address} | Phone: {company?.phone}
          </p>
        </div>

        {/* Document Subtitle & Meta Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 border-b border-slate-300 bg-slate-50 px-4 mt-3 rounded-lg text-xs gap-2">
          <div className="font-bold tracking-wider text-slate-900 text-sm">
            MACHINERY DAILY WORK LOGSHEET
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-blue-900 text-sm">
              {logsheet.logsheet_number}
            </span>
            <StatusBadge status={logsheet.status} size="sm" />
          </div>
        </div>

        {/* Grid 1: Machinery & Site/Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-xs">
          {/* Box 1: Machine & Operator */}
          <div className="p-4 border border-slate-300 rounded-lg bg-slate-50/50 space-y-1.5">
            <div className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 mb-2 text-blue-900">
              1. Machinery & Operator Details
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Asset / Machine Code:</span>
              <span className="font-bold font-mono text-slate-900">{logsheet.machine_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Machine Name:</span>
              <span className="font-semibold text-slate-900">{logsheet.machine_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Make & Model:</span>
              <span className="text-slate-900">{logsheet.machine_make_model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registration / Serial:</span>
              <span className="font-mono text-slate-900">{logsheet.machine_reg || 'N/A'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Assigned Operator:</span>
              <span className="font-bold text-slate-900">{logsheet.operator_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Operator Mobile:</span>
              <span className="font-mono text-slate-900">{logsheet.operator_phone || 'N/A'}</span>
            </div>
          </div>

          {/* Box 2: Customer & Deployment */}
          <div className="p-4 border border-slate-300 rounded-lg bg-slate-50/50 space-y-1.5">
            <div className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 mb-2 text-blue-900">
              2. Client & Site Deployment Details
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Client / Customer:</span>
              <span className="font-bold text-slate-900">{logsheet.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Project:</span>
              <span className="font-semibold text-slate-900">{logsheet.project_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Site Location:</span>
              <span className="text-slate-900">{logsheet.site_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Work Date:</span>
              <span className="font-bold text-slate-900">{formatDate(logsheet.date)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Work Shift:</span>
              <span className="font-semibold text-slate-900">{logsheet.shift_display}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Client In-charge:</span>
              <span className="text-slate-900">{logsheet.customer_rep_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Grid 2: Working Hours & HMR Record */}
        <div className="mt-5 border border-slate-300 rounded-lg overflow-hidden text-xs">
          <div className="bg-slate-100 px-4 py-2 font-bold uppercase text-[11px] text-blue-900 border-b border-slate-300">
            3. Working Hours & Hour-Meter Record (HMR)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-300 text-center bg-white">
            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Opening HMR</div>
              <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                {parseFloat(logsheet.opening_meter).toFixed(2)}
              </div>
            </div>

            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Closing HMR</div>
              <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                {parseFloat(logsheet.closing_meter).toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-blue-50/60">
              <div className="text-[10px] uppercase font-bold text-blue-800">Net Run Hours</div>
              <div className="text-base font-mono font-extrabold text-blue-900 mt-1">
                {runHours.toFixed(2)} Hrs
              </div>
            </div>

            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Idle Hours</div>
              <div className="text-sm font-mono text-slate-700 mt-1">
                {parseFloat(logsheet.idle_hours || '0').toFixed(2)} Hrs
              </div>
            </div>

            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Breakdown Hrs</div>
              <div className="text-sm font-mono text-slate-700 mt-1">
                {parseFloat(logsheet.breakdown_hours || '0').toFixed(2)} Hrs
              </div>
            </div>

            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Overtime Hrs</div>
              <div className="text-sm font-mono text-slate-700 mt-1">
                {parseFloat(logsheet.overtime_hours || '0').toFixed(2)} Hrs
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-2 border-t border-slate-300 flex justify-between text-[11px] text-slate-600">
            <div>
              <b>Operating Window:</b> {logsheet.start_time?.slice(0, 5) || '--:--'} to {logsheet.end_time?.slice(0, 5) || '--:--'}
            </div>
            <div>
              <b>Equipment Condition:</b> {logsheet.condition_display}
            </div>
          </div>
        </div>

        {/* Grid 3: Diesel & Fuel Record */}
        <div className="mt-5 border border-slate-300 rounded-lg overflow-hidden text-xs">
          <div className="bg-amber-100/70 px-4 py-2 font-bold uppercase text-[11px] text-amber-950 border-b border-slate-300 flex items-center justify-between">
            <span>4. Diesel / Fuel Issued & Consumed</span>
            <span className="font-mono text-xs font-semibold">
              Burn Rate: {burnRate} L/hr
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 text-center bg-white">
            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Opening Fuel Level</div>
              <div className="text-sm font-mono text-slate-800 mt-1">
                {logsheet.opening_fuel_litres ? `${parseFloat(logsheet.opening_fuel_litres).toFixed(1)} L` : '--'}
              </div>
            </div>

            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Diesel Received</div>
              <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                {parseFloat(logsheet.diesel_received_litres || '0').toFixed(1)} L
              </div>
            </div>

            <div className="p-3 bg-amber-50/50">
              <div className="text-[10px] uppercase font-bold text-amber-900">Diesel Consumed</div>
              <div className="text-base font-mono font-bold text-amber-800 mt-1">
                {dieselConsumed.toFixed(1)} L
              </div>
            </div>

            <div className="p-3">
              <div className="text-[10px] uppercase text-slate-500">Closing Fuel Level</div>
              <div className="text-sm font-mono text-slate-800 mt-1">
                {logsheet.closing_fuel_litres ? `${parseFloat(logsheet.closing_fuel_litres).toFixed(1)} L` : '--'}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-2 border-t border-slate-300 text-[11px] text-slate-600">
            <b>Fuel / Bowser Remarks:</b> {logsheet.fuel_remarks || 'No slip remarks logged'}
          </div>
        </div>

        {/* Grid 4: Operational Description & Breakdown Notes */}
        <div className="mt-5 border border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-3 text-xs">
          <div className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 text-blue-900">
            5. Work Carried Out & Breakdown Logs
          </div>
          <div>
            <div className="font-semibold text-slate-700">Work Description:</div>
            <p className="text-slate-800 mt-0.5 leading-relaxed whitespace-pre-wrap">
              {logsheet.work_description}
            </p>
          </div>

          {(logsheet.breakdown_details || logsheet.remarks) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-slate-700">
              {logsheet.breakdown_details && (
                <div>
                  <span className="font-semibold text-rose-700">Breakdown Incident:</span> {logsheet.breakdown_details}
                </div>
              )}
              {logsheet.remarks && (
                <div>
                  <span className="font-semibold text-slate-700">Site Remarks:</span> {logsheet.remarks}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grid 5: Tri-Party Sign-Off Block */}
        <div className="mt-8 border border-slate-300 rounded-lg overflow-hidden text-xs">
          <div className="grid grid-cols-3 divide-x divide-slate-300 text-center">
            {/* Operator Signature */}
            <div className="p-4 space-y-2">
              <div className="font-bold text-slate-800 uppercase text-[10px]">
                1. Operator Sign-off
              </div>
              <div className="h-16 flex items-end justify-center font-serif italic text-slate-400">
                {logsheet.operator_name}
              </div>
              <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-600">
                <b>Name:</b> {logsheet.operator_name}<br/>
                <b>Date:</b> {formatDate(logsheet.date)}
              </div>
            </div>

            {/* Site Supervisor Sign-off */}
            <div className="p-4 space-y-2 bg-slate-50/30">
              <div className="font-bold text-slate-800 uppercase text-[10px]">
                2. Site Supervisor Verification
              </div>
              <div className="h-16 flex items-end justify-center font-serif italic text-emerald-700 font-bold">
                {logsheet.status === 'APPROVED' ? `✓ Approved: ${logsheet.approved_by_name}` : '-- Pending Verification --'}
              </div>
              <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-600">
                <b>Verified By:</b> {logsheet.approved_by_name || 'Assigned Supervisor'}<br/>
                <b>Date:</b> {formatDate(logsheet.approved_at)}
              </div>
            </div>

            {/* Client Sign-off */}
            <div className="p-4 space-y-2">
              <div className="font-bold text-slate-800 uppercase text-[10px]">
                3. Customer / Client Representative
              </div>
              <div className="h-16 flex items-end justify-center font-serif italic text-slate-700">
                {logsheet.customer_signature_confirmed ? `✓ Signed on Site` : '-- Signature Space --'}
              </div>
              <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-600">
                <b>Client Rep:</b> {logsheet.customer_rep_name || 'Client Site Incharge'}<br/>
                <b>Status:</b> {logsheet.customer_signature_confirmed ? 'Acknowledged' : 'Pending Signature'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Audit Bar */}
        <div className="mt-6 pt-3 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono">
          <div>Official Record Ref: SYS-DOC-{logsheet.id.slice(0, 8).toUpperCase()}</div>
          <div>Generated by Machinery ERP Digital System &bull; Page 1 of 1</div>
        </div>
      </div>

      {/* 5. Live Audit Trail & Revision History (Hidden on Print) */}
      <div className="print:hidden bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-200 pb-3">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Audit Trail & Revision History
          </h3>
        </div>

        {logsheet.audit_trail && logsheet.audit_trail.length > 0 ? (
          <div className="space-y-3">
            {logsheet.audit_trail.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start space-x-3 text-xs p-3 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="p-1.5 rounded-full bg-blue-100 text-blue-700 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{entry.action}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Action performed by <span className="font-semibold text-slate-800">{entry.performed_by_name || 'System User'}</span>
                  </div>
                  {entry.notes && (
                    <div className="text-slate-500 text-[11px] mt-1 bg-white p-2 rounded border border-slate-200">
                      {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No historical audit changes recorded.</div>
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
              Please enter the specific reason for rejecting this logsheet. The record will be updated to REJECTED and returned for operator rectification.
            </p>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Meter readings do not match photo..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleReject}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <Ban className="w-5 h-5 shrink-0 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Void Approved Logsheet</h3>
            </div>
            <p className="text-xs text-slate-600">
              Voiding an approved logsheet is an audited management action. Please document why this record is being cancelled.
            </p>
            <textarea
              rows={3}
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Entered on incorrect machine code; replaced by LOG-2026-00099..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setVoidModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !voidReason.trim()}
                onClick={handleVoid}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {actionLoading ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

