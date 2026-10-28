'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both work email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Invalid email or password.');
      }
      // Force hard navigate to ensure fresh session cookies are picked up by layout and middleware
      window.location.href = returnUrl;
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="card-surface p-8 bg-white space-y-6 shadow-xl border border-stone-200/80 rounded-2xl">
      <div className="border-b border-stone-100 pb-4">
        <h2 className="text-base font-bold text-stone-900 tracking-tight">Staff Authentication</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Enter your authorized enterprise credentials to access the inventory system.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-stone-800 block mb-1.5 text-xs">
            Work Email / Login ID
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="name@miestilo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-stone-800 block mb-1.5 text-xs">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#171B18] text-[#A7F432] hover:bg-stone-800 disabled:opacity-60 rounded-xl py-3 text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>{loading ? 'Verifying Credentials...' : 'Sign In to Operations'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Security footer */}
      <div className="pt-4 border-t border-stone-100 flex items-center justify-center gap-2 text-[11px] text-stone-400">
        <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
        <span>256-Bit Encrypted • Authorized Personnel Only</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F4] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <img
            src="/brand/logo.png"
            alt="MiEstilo Logo"
            className="w-20 h-20 rounded-2xl object-contain mx-auto shadow-lg border border-amber-300/30 bg-[#0E1528] p-1.5 ring-4 ring-amber-400/10"
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-stone-900">
              MiEstilo
            </h1>
            <p className="text-xs font-medium text-stone-500 mt-0.5">
              Hospitality Linen ERP & Inventory Operations
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="card-surface p-8 bg-white text-center text-xs text-stone-400">Loading sign-in...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[11px] text-stone-400">
          MiEstilo Lifestyle Private Limited &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
