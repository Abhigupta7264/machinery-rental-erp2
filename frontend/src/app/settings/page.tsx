'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, History, Building } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CompanySettings } from '@/lib/types';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'audit'>('settings');

  useEffect(() => {
    api.getSettings().then((data: any) => setSettings(data));
    // Fetch audit logs
    fetch('http://127.0.0.1:8000/api/common/audit-logs/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setAuditLogs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage('');
    try {
      const updated: any = await api.updateSettings(settings);
      setSettings(updated);
      setMessage('Company settings updated successfully.');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Settings & Audit History" subtitle="Configure company legal branding for official PDF documents and review system audit records">
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Company Branding & PDF Settings
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Audit Trail Logs ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 max-w-3xl">
          {message && (
            <div className="p-3 rounded bg-blue-50 text-blue-800 text-xs font-semibold">
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Company Name (Appears on PDF)</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Tagline / Business Nature</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">GSTIN</label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Registration / CIN</label>
                <input
                  type="text"
                  value={settings.registration_no}
                  onChange={(e) => setSettings({ ...settings, registration_no: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Official Phone Numbers</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Operations Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Registered Office Address</label>
              <textarea
                rows={2}
                value={settings.registered_address}
                onChange={(e) => setSettings({ ...settings, registered_address: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Company Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b font-bold uppercase tracking-wider text-slate-800">
            Audit Trail Logs
          </div>
          <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-100 text-blue-800">
                      {log.action}
                    </span>
                    <span>{log.entity_name} ({log.entity_id})</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Triggered by <span className="font-medium text-slate-700">{log.actor_name || 'System User'}</span>
                  </div>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

