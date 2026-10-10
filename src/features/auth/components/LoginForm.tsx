'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../hooks/useAuth';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      await login({ email, password });
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLocalError(null);
  };

  const displayError = localError || loginError;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 p-2 shadow-md shadow-zinc-950/5 border border-zinc-200/80 dark:border-zinc-800 mb-4">
          <Image
            src="/logo.png"
            alt="Student Management System Logo"
            width={52}
            height={52}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Academic Registry Portal
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Student Management System • Secure Access
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-950/5 border border-zinc-200 dark:border-zinc-800 p-8">
        {displayError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300 font-medium">
              {displayError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label 
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Institutional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. admin@sms.ac.uk"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0269ae] hover:bg-[#015289] active:bg-[#01426e] text-white font-medium text-sm shadow-md shadow-[#0269ae]/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Evaluator Quick Demo Login Buttons */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center mb-3">
            Quick Demo Accounts (Evaluator Shortcuts)
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@sms.ac.uk', 'Staff@12345')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
            >
              <UserCheck className="w-4 h-4 text-[#0269ae] dark:text-[#43b5e9] flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Staff Admin</div>
                <div className="text-[10px] text-zinc-500">Registry Team</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('alice@sms.ac.uk', 'Student@12345')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
            >
              <GraduationCap className="w-4 h-4 text-[#0a9748] dark:text-[#22c55e] flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Student</div>
                <div className="text-[10px] text-zinc-500">Alice (BSc CS)</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
