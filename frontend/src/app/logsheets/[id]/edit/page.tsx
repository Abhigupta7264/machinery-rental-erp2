'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, AlertCircle, Calculator, Building, Fuel, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Machine, Customer, Project, Site, Operator, LogsheetDetail } from '@/lib/types';

export default function EditLogsheetPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [date, setDate] = useState('');
  const [shift, setShift] = useState<'DAY' | 'NIGHT' | 'GENERAL'>('DAY');
  const [openingMeter, setOpeningMeter] = useState('');
  const [closingMeter, setClosingMeter] = useState('');
  const [idleHours, setIdleHours] = useState('0');
  const [breakdownHours, setBreakdownHours] = useState('0');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [openingFuel, setOpeningFuel] = useState('');
  const [dieselReceived, setDieselReceived] = useState('0');
  const [dieselConsumed, setDieselConsumed] = useState('0');
  const [closingFuel, setClosingFuel] = useState('');
  const [fuelRemarks, setFuelRemarks] = useState('');

  const [workDescription, setWorkDescription] = useState('');
  const [equipmentCondition, setEquipmentCondition] = useState<any>('NORMAL');
  const [breakdownDetails, setBreakdownDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [customerRepName, setCustomerRepName] = useState('');
  const [customerSignatureConfirmed, setCustomerSignatureConfirmed] = useState(false);

  const [logsheetNumber, setLogsheetNumber] = useState('');

  useEffect(() => {
    if (id) {
      api.getLogsheet(id)
        .then((l: any) => {
          setLogsheetNumber(l.logsheet_number);
          setDate(l.date);
          setShift(l.shift);
          setOpeningMeter(l.opening_meter || '');
          setClosingMeter(l.closing_meter || '');
          setIdleHours(l.idle_hours || '0');
          setBreakdownHours(l.breakdown_hours || '0');
          setOvertimeHours(l.overtime_hours || '0');
          setStartTime(l.start_time?.slice(0, 5) || '');
          setEndTime(l.end_time?.slice(0, 5) || '');
          setOpeningFuel(l.opening_fuel_litres || '');
          setDieselReceived(l.diesel_received_litres || '0');
          setDieselConsumed(l.diesel_consumed_litres || '0');
          setClosingFuel(l.closing_fuel_litres || '');
          setFuelRemarks(l.fuel_remarks || '');
          setWorkDescription(l.work_description || '');
          setEquipmentCondition(l.equipment_condition || 'NORMAL');
          setBreakdownDetails(l.breakdown_details || '');
          setRemarks(l.remarks || '');
          setCustomerRepName(l.customer_rep_name || '');
          setCustomerSignatureConfirmed(l.customer_signature_confirmed || false);
        })
        .catch((err) => setFormError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const openVal = parseFloat(openingMeter) || 0;
  const closeVal = parseFloat(closingMeter) || 0;
  const isMeterInvalid = closingMeter !== '' && openingMeter !== '' && closeVal < openVal;
  const calculatedHours = (closeVal >= openVal && openingMeter !== '' && closingMeter !== '')
    ? (closeVal - openVal).toFixed(2)
    : '0.00';

  const handleUpdate = async (submitNow: boolean) => {
    setFormError('');
    if (isMeterInvalid) {
      setFormError('Closing meter cannot be less than opening meter.');
      return;
    }
    setSaving(true);

    const payload: any = {
      opening_meter: parseFloat(openingMeter),
      closing_meter: parseFloat(closingMeter),
      idle_hours: parseFloat(idleHours) || 0,
      breakdown_hours: parseFloat(breakdownHours) || 0,
      overtime_hours: parseFloat(overtimeHours) || 0,
      start_time: startTime ? `${startTime}:00` : null,
      end_time: endTime ? `${endTime}:00` : null,
      work_description: workDescription,
      opening_fuel_litres: openingFuel ? parseFloat(openingFuel) : null,
      diesel_received_litres: parseFloat(dieselReceived) || 0,
      diesel_consumed_litres: parseFloat(dieselConsumed) || 0,
      closing_fuel_litres: closingFuel ? parseFloat(closingFuel) : null,
      fuel_remarks: fuelRemarks,
      equipment_condition: equipmentCondition,
      breakdown_details: breakdownDetails,
      remarks,
      customer_rep_name: customerRepName,
      customer_signature_confirmed: customerSignatureConfirmed,
    };

    try {
      await api.updateLogsheet(id, payload);
      if (submitNow) {
        await api.submitLogsheet(id);
      }
      router.push(`/logsheets/${id}`);
    } catch (err: any) {
      setFormError(err.message || 'Update failed');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Edit Logsheet">
        <div className="py-20 text-center text-slate-500 text-sm">Loading logsheet form...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Edit Logsheet ${logsheetNumber}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <Link
          href={`/logsheets/${id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Document View
        </Link>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Working Hours */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-blue-900">
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Hour-Meter Readings & Working Hours
            </h3>
            <div className="text-xs font-mono font-bold bg-blue-50 text-blue-900 px-3 py-1 rounded">
              Calculated Run: {calculatedHours} Hrs
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Opening HMR</label>
              <input
                type="number"
                step="0.01"
                required
                value={openingMeter}
                onChange={(e) => setOpeningMeter(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Closing HMR</label>
              <input
                type="number"
                step="0.01"
                required
                value={closingMeter}
                onChange={(e) => setClosingMeter(e.target.value)}
                className={`w-full px-3 py-2 font-mono border rounded-lg ${
                  isMeterInvalid ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Idle Hours</label>
              <input
                type="number"
                step="0.25"
                value={idleHours}
                onChange={(e) => setIdleHours(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Breakdown Hours</label>
              <input
                type="number"
                step="0.25"
                value={breakdownHours}
                onChange={(e) => setBreakdownHours(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Diesel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-900 pb-3 border-b border-slate-100">
            Diesel & Fuel Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diesel Received (L)</label>
              <input
                type="number"
                step="0.5"
                value={dieselReceived}
                onChange={(e) => setDieselReceived(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diesel Consumed (L)</label>
              <input
                type="number"
                step="0.5"
                value={dieselConsumed}
                onChange={(e) => setDieselConsumed(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fuel Slip Remarks</label>
              <input
                type="text"
                value={fuelRemarks}
                onChange={(e) => setFuelRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Work Description */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100">
            Work Carried Out & Operational Details
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Description</label>
            <textarea
              rows={3}
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Breakdown Details</label>
              <textarea
                rows={2}
                value={breakdownDetails}
                onChange={(e) => setBreakdownDetails(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            disabled={saving || isMeterInvalid}
            onClick={() => handleUpdate(false)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Save Changes
          </button>
          <button
            type="button"
            disabled={saving || isMeterInvalid}
            onClick={() => handleUpdate(true)}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
          >
            Save & Submit for Approval
          </button>
        </div>
      </form>
    </AppLayout>
  );
}

