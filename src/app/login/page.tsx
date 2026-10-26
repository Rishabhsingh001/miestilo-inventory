'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@miestilo.com');
  const [password, setPassword] = useState('Misterio@2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Login failed');
      }
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Misterio@2026');
  };

  return (
    <div className="min-h-screen bg-[#F3F5F4] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#171B18] text-[#A7F432] font-black text-2xl flex items-center justify-center mx-auto shadow-md ring-1 ring-black/10">
            m
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            miestilo
          </h1>
          <p className="text-xs font-medium text-stone-500">
            Luxury Linen Inventory & Order Management
          </p>
        </div>

        {/* Login Card */}
        <div className="card-surface p-8 bg-white space-y-5 shadow-lg">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900">Staff Authentication</h2>
            <p className="text-xs text-stone-500">Sign in with your verified operational role.</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-xs py-2.5 font-bold shadow-sm"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Operations'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Picker */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block text-center">
              Quick Role Switcher (Demo)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('owner@miestilo.com')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-lime-50 hover:border-lime-400 border border-stone-200 text-left transition-all"
              >
                <span className="font-bold text-stone-900 block leading-tight">Super Admin</span>
                <span className="text-[10px] text-stone-500">Full Operations Access</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('inventory@miestilo.com')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-lime-50 hover:border-lime-400 border border-stone-200 text-left transition-all"
              >
                <span className="font-bold text-stone-900 block leading-tight">Inventory Lead</span>
                <span className="text-[10px] text-stone-500">Receipts & Stock Audit</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sales@miestilo.com')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-lime-50 hover:border-lime-400 border border-stone-200 text-left transition-all"
              >
                <span className="font-bold text-stone-900 block leading-tight">Sales Manager</span>
                <span className="text-[10px] text-stone-500">Orders & Reservations</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('warehouse@miestilo.com')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-lime-50 hover:border-lime-400 border border-stone-200 text-left transition-all"
              >
                <span className="font-bold text-stone-900 block leading-tight">Warehouse Staff</span>
                <span className="text-[10px] text-stone-500">Pick, Pack & Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
