'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  CreditCard, 
  BookOpen, 
  GraduationCap, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOverdueFees, formatGBP } from '@/features/fees';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: overdueData } = useOverdueFees();

  const overdueStats = overdueData?.meta?.stats;
  const overdueCount = overdueStats?.totalOverdueStudents ?? 0;
  const overdueDebt = overdueStats?.totalOutstanding ?? 0;

  const workflowCards = [
    {
      title: '1. Student Enrolment',
      desc: 'Create student profiles, auto-generate SMS IDs, manage enrolment statuses, and query the student registry.',
      href: '/staff/students',
      icon: Users,
      badge: 'Core Workflow',
    },
    {
      title: '2. Fees & Payments',
      desc: 'Track programme tuition fees, log payment transactions, compute real-time balances, and monitor overdue accounts.',
      href: '/staff/fees',
      icon: CreditCard,
      badge: overdueCount > 0 ? `${overdueCount} Overdue Accounts` : 'Ledger Settled',
      isAlert: overdueCount > 0,
    },
    {
      title: '3. Assessments & Submissions',
      desc: 'Publish module coursework, set submission deadlines, inspect student uploads, and review late submission flags.',
      href: '/staff/assessments',
      icon: BookOpen,
      badge: 'Academics',
    },
    {
      title: '4. Marksheet & Results',
      desc: 'Award numeric marks (0-100), compute UK classifications, and control publish or withhold visibility per student.',
      href: '/staff/marksheet',
      icon: GraduationCap,
      badge: 'Examination Board',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-[#013b63] via-[#0269ae] to-[#012640] p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/25 text-white mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#43b5e9]" />
            <span>Academic Registry Administrator Session Active</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-50/90 leading-relaxed">
            Manage day-to-day student lifecycle operations: admissions, fee reconciliation, coursework submissions, and official exam results release.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10 text-white pointer-events-none">
          <ShieldCheck className="w-64 h-64" />
        </div>
      </div>

      {/* Registry Overdue Debt Alert Banner */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/40 border border-amber-200 dark:border-amber-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Registry Financial Action Required
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  {overdueCount} Overdue
                </span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-400 mt-0.5">
                {overdueCount} student {overdueCount === 1 ? 'account has' : 'accounts have'} outstanding tuition balances totalling{' '}
                <span className="font-extrabold text-rose-600 dark:text-rose-400">{formatGBP(overdueDebt)}</span>.
              </p>
            </div>
          </div>

          <Link
            href="/staff/fees"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0269ae] hover:bg-[#015289] text-white shadow-xs transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <span>Review Overdue Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4 Workflows Quick Jump Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Core Registry Workflows
          </h2>
          <span className="text-xs text-zinc-500 font-medium">
            4 Modules Configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workflowCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        card.isAlert
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                    {card.desc}
                  </p>
                </div>

                <Link
                  href={card.href}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#0269ae] dark:text-[#43b5e9] hover:text-[#015289] dark:hover:text-[#64c5f0] group"
                >
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
