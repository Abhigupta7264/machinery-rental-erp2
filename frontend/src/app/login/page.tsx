'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, KeyRound, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('supervisor');
  const [password, setPassword] = useState('SupervisorPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login({ username, password });
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    // Immediate login
    setLoading(true);
    setError('');
    api.login({ username: userVal, password: passVal })
      .then((res) => {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        router.push('/dashboard');
      })
      .catch((err) => {
        setError(err.message || 'Login failed');
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Truck className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          INFRA-EQUIP RENTALS ERP
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Heavy Machinery Operations & Digital Logsheet Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username or Employee Code
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="e.g. supervisor or admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick 1-Click Role Login (Demo)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('supervisor', 'SupervisorPassword123!')}
                className="p-2 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium text-left transition-colors"
              >
                <div className="font-semibold text-xs">👷 Site Supervisor</div>
                <div className="text-[10px] text-blue-700">Creates & approves</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'AdminPassword123!')}
                className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 font-medium text-left transition-colors"
              >
                <div className="font-semibold text-xs">👑 Administrator</div>
                <div className="text-[10px] text-slate-500">Full system control</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator_ravi', 'OperatorPassword123!')}
                className="p-2 border border-amber-200 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-left transition-colors"
              >
                <div className="font-semibold text-xs">🚜 Equipment Operator</div>
                <div className="text-[10px] text-amber-700">Enters daily meters</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accountant', 'AccountantPassword123!')}
                className="p-2 border border-emerald-200 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium text-left transition-colors"
              >
                <div className="font-semibold text-xs">💼 Accountant</div>
                <div className="text-[10px] text-emerald-700">Invoices & billing</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

