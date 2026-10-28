'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Fuel,
  Wrench,
  FileText,
  Calculator,
  Building,
  UserCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Machine, Customer, Project, Site, Operator } from '@/lib/types';

export default function CreateLogsheetPage() {
  const router = useRouter();

  // Reference data
  const [machines, setMachines] = useState<Machine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [nextLogsheetNumber, setNextLogsheetNumber] = useState('LOG-2026-XXXXX');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'DAY' | 'NIGHT' | 'GENERAL'>('DAY');
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [operatorId, setOperatorId] = useState('');

  // Meter & Hours
  const [openingMeter, setOpeningMeter] = useState('');
  const [closingMeter, setClosingMeter] = useState('');
  const [idleHours, setIdleHours] = useState('0.00');
  const [breakdownHours, setBreakdownHours] = useState('0.00');
  const [overtimeHours, setOvertimeHours] = useState('0.00');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');

  // Fuel
  const [openingFuel, setOpeningFuel] = useState('');
  const [dieselReceived, setDieselReceived] = useState('0');
  const [dieselConsumed, setDieselConsumed] = useState('0');
  const [closingFuel, setClosingFuel] = useState('');
  const [fuelRemarks, setFuelRemarks] = useState('');

  // Operational & Site
  const [workDescription, setWorkDescription] = useState('');
  const [equipmentCondition, setEquipmentCondition] = useState<'EXCELLENT' | 'NORMAL' | 'ATTENTION_NEEDED' | 'BREAKDOWN'>('NORMAL');
  const [breakdownDetails, setBreakdownDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [customerRepName, setCustomerRepName] = useState('');
  const [customerSignatureConfirmed, setCustomerSignatureConfirmed] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  useEffect(() => {
    // 1. Fetch next logsheet number
    api.getNextLogsheetNumber()
      .then((data) => setNextLogsheetNumber(data.next_number))
      .catch(() => {});

    // 2. Fetch masters
    api.getMachines().then((res: any) => setMachines(Array.isArray(res) ? res : res.results || []));
    api.getCustomers().then((res: any) => setCustomers(Array.isArray(res) ? res : res.results || []));
    api.getOperators().then((res: any) => setOperators(Array.isArray(res) ? res : res.results || []));
  }, []);

  // When customer changes, fetch projects and reset project/site
  const handleCustomerChange = (cid: string) => {
    setCustomerId(cid);
    setProjectId('');
    setSiteId('');
    if (cid) {
      api.getProjects(cid).then((res: any) => setProjects(Array.isArray(res) ? res : res.results || []));
    } else {
      setProjects([]);
      setSites([]);
    }
  };

  // When project changes, fetch sites
  const handleProjectChange = (pid: string) => {
    setProjectId(pid);
    setSiteId('');
    if (pid) {
      api.getSites(pid).then((res: any) => setSites(Array.isArray(res) ? res : res.results || []));
    } else {
      setSites([]);
    }
  };

  // When machine is selected, auto-populate opening meter from machine's current reading
  const handleMachineChange = (mid: string) => {
    setMachineId(mid);
    const m = machines.find((item) => item.id === mid) || null;
    setSelectedMachine(m);
    if (m) {
      setOpeningMeter(m.current_hour_meter || '0.00');
      // If machine is currently assigned to a customer/site/operator, prefill them!
      if (m.current_customer && !customerId) {
        handleCustomerChange(m.current_customer);
      }
      if (m.current_site && !siteId) {
        setSiteId(m.current_site);
      }
      if (m.current_operator && !operatorId) {
        setOperatorId(m.current_operator);
      }
    }
  };

  // Live calculation of working hours
  const openVal = parseFloat(openingMeter) || 0;
  const closeVal = parseFloat(closingMeter) || 0;
  const calculatedWorkingHours = (closeVal >= openVal && openingMeter !== '' && closingMeter !== '')
    ? (closeVal - openVal).toFixed(2)
    : '0.00';

  const isMeterInvalid = closingMeter !== '' && openingMeter !== '' && closeVal < openVal;

  const handleSubmitForm = async (submitNow: boolean) => {
    setFormError('');

    // Validation
    if (!machineId) {
      setFormError('Please select a machine.');
      return;
    }
    if (!customerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (!siteId) {
      setFormError('Please select a site location.');
      return;
    }
    if (!operatorId) {
      setFormError('Please select an operator.');
      return;
    }
    if (openingMeter === '' || closingMeter === '') {
      setFormError('Please enter valid opening and closing meter readings.');
      return;
    }
    if (isMeterInvalid) {
      setFormError(`Closing meter (${closeVal}) cannot be less than opening meter (${openVal}).`);
      return;
    }
    if (!workDescription.trim()) {
      setFormError('Please enter a description of work performed.');
      return;
    }

    setLoading(true);

    const payload = {
      date,
      shift,
      customer: customerId,
      project: projectId || (sites.find((s) => s.id === siteId)?.project),
      site: siteId,
      machine: machineId,
      operator: operatorId,
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
      submit_now: submitNow,
    };

    try {
      const response: any = await api.createLogsheet(payload);
      router.push(`/logsheets/${response.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save logsheet.');
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Create Daily Machinery Logsheet"
      subtitle="Enter equipment running hours, hour-meter readings, diesel issued, and site work logs"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <Link
          href="/logsheets"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Logsheets Register
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {nextLogsheetNumber}
          </span>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <div className="font-bold">Form Validation Notice</div>
            <div>{formError}</div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Section 1: General & Deployment Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-900">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Section 1: General & Machinery Deployment Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Logsheet Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Work Shift <span className="text-rose-500">*</span>
              </label>
              <select
                value={shift}
                onChange={(e: any) => setShift(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              >
                <option value="DAY">Day Shift (08:00 - 20:00)</option>
                <option value="NIGHT">Night Shift (20:00 - 08:00)</option>
                <option value="GENERAL">General / Single Shift (09:00 - 18:00)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Machine (Asset Code) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={machineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="">-- Choose Machine --</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.asset_code}] {m.name} ({m.make_model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned Operator <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="">-- Choose Operator --</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name} (ID: {op.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer / Client <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project Name
              </label>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                disabled={!customerId}
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Site Location <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                disabled={!customerId}
              >
                <option value="">-- Select Site Location --</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Working Hours & Hour-Meter Readings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-blue-900">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Section 2: Hour-Meter (HMR) & Working Hours Details
              </h3>
            </div>

            {/* Live Working Hours Pill */}
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-800">Computed Working Hours:</span>
              <span className="text-base font-bold font-mono text-blue-900">
                {calculatedWorkingHours} Hrs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Opening Hour-Meter (HMR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={openingMeter}
                onChange={(e) => setOpeningMeter(e.target.value)}
                placeholder="e.g. 2450.50"
                className="w-full px-3 py-2 font-mono font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Reading at start of shift
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Closing Hour-Meter (HMR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={closingMeter}
                onChange={(e) => setClosingMeter(e.target.value)}
                placeholder="e.g. 2459.50"
                className={`w-full px-3 py-2 font-mono font-semibold border rounded-lg focus:ring-2 ${
                  isMeterInvalid
                    ? 'border-rose-500 focus:ring-rose-500 bg-rose-50 text-rose-900'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {isMeterInvalid ? (
                <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
                  Closing meter cannot be less than opening meter!
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Reading at end of shift
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Idle Hours</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={idleHours}
                onChange={(e) => setIdleHours(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Machine engine on but idle (no load)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Breakdown Hours</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={breakdownHours}
                onChange={(e) => setBreakdownHours(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Time lost due to breakdown
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Overtime Hours</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Equipment Condition</label>
              <select
                value={equipmentCondition}
                onChange={(e: any) => setEquipmentCondition(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="EXCELLENT">Excellent / Heavy Load Ready</option>
                <option value="NORMAL">Normal Working Condition</option>
                <option value="ATTENTION_NEEDED">Minor Fault / Service Needed</option>
                <option value="BREAKDOWN">Breakdown / Non-Operational</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Diesel & Fuel Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-900">
            <Fuel className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Section 3: Diesel & Fuel Consumption Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Opening Fuel Level (Litres)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={openingFuel}
                onChange={(e) => setOpeningFuel(e.target.value)}
                placeholder="Optional dipstick reading"
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Diesel Received / Filled (Litres)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={dieselReceived}
                onChange={(e) => setDieselReceived(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3 py-2 font-mono font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Litres issued from site bowser or pump
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Diesel Consumed in Shift (Litres)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={dieselConsumed}
                onChange={(e) => setDieselConsumed(e.target.value)}
                placeholder="e.g. 110"
                className="w-full px-3 py-2 font-mono font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Closing Fuel Level (Litres)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={closingFuel}
                onChange={(e) => setClosingFuel(e.target.value)}
                placeholder="Optional dipstick reading"
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="block font-semibold text-slate-700 mb-1">
                Fuel Slip Number & Voucher Remarks
              </label>
              <input
                type="text"
                value={fuelRemarks}
                onChange={(e) => setFuelRemarks(e.target.value)}
                placeholder="e.g. Bowser Slip #BS-9021, Dispenser Reading: 45210 L, Issued by Bharat Bowser operator"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Operational Log & Work Carried Out */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-blue-900">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Section 4: Operational Log, Work Carried Out & Verification
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Description of Work Performed <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Specify operations completed (e.g. Pier foundation excavation P-12 to P-14, loading 18 tippers with rocky muck, backfilling pipeline trench...)"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Breakdown / Idle Loss Details (If Any)
                </label>
                <textarea
                  rows={2}
                  value={breakdownDetails}
                  onChange={(e) => setBreakdownDetails(e.target.value)}
                  placeholder="e.g. Hydraulic pipe punctured at 11:30 AM; site team replaced O-ring by 12:45 PM"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  General Remarks / Site Notes
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Heavy rain between 3 PM and 4 PM; ground slippery"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Client / Customer Representative Name
                </label>
                <input
                  type="text"
                  value={customerRepName}
                  onChange={(e) => setCustomerRepName(e.target.value)}
                  placeholder="e.g. K. N. Murthy (L&T Senior Site Engineer)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerSignatureConfirmed}
                    onChange={(e) => setCustomerSignatureConfirmed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-800 font-medium">
                    Physical logsheet signed / acknowledged by customer representative on-site
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Save & Submission Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900 rounded-xl text-white">
          <div className="text-xs">
            <div className="font-semibold text-white">Logsheet Action Controls</div>
            <div className="text-slate-400">
              Save as Draft to continue editing later, or Submit for immediate site supervisor verification.
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading || isMeterInvalid}
              onClick={() => handleSubmitForm(false)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Draft
            </button>

            <button
              type="button"
              disabled={loading || isMeterInvalid}
              onClick={() => handleSubmitForm(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Submit for Approval
            </button>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}

