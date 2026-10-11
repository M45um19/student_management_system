'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, BookOpen, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useStudentFees, formatGBP } from '@/features/fees';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: feeData } = useStudentFees(user ? 'me' : undefined);

  const ledger = feeData?.data;
  const isSettled = ledger ? ledger.balance === 0 : false;
  const feeBadge = ledger
    ? isSettled
      ? 'Paid in Full'
      : `${formatGBP(ledger.balance)} Due`
    : 'Finance';

  const studentCards = [
    {
      title: 'Tuition Fees & Payments',
      desc: ledger 
        ? `Enrolled Programme: ${ledger.programme?.name || 'Degree'} (£${ledger.tuitionFee.toLocaleString()}). Paid: ${formatGBP(ledger.totalPaid)}.`
        : 'Check your assigned programme fee, inspect transaction receipts, and view your real-time outstanding balance.',
      href: '/student/fees',
      icon: CreditCard,
      badge: feeBadge,
      isSettled,
    },
    {
      title: 'Coursework Submissions',
      desc: 'View active module coursework, upload deliverables (.pdf / .docx), and check submission timestamps.',
      href: '/student/assessments',
      icon: BookOpen,
      badge: 'Uploads',
    },
    {
      title: 'Official Marksheet & Results',
      desc: 'View your grades and classifications once formally approved and published by the Registry Board.',
      href: '/student/marksheet',
      icon: GraduationCap,
      badge: 'Results',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Student Welcome Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-[#043318] via-[#0a9748] to-[#021f0e] p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/25 text-white mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>Student Self-Service Portal Active</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Welcome, {user?.name || 'Student'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-50/90 leading-relaxed">
            Monitor your fee payments, upload coursework for grading, and view published examination marksheets.
          </p>
        </div>
      </div>

      {/* Student Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {studentCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0a9748]/10 dark:bg-[#0a9748]/20 text-[#0a9748] dark:text-[#22c55e] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  {card.badge && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        card.isSettled
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : card.badge.includes('Due')
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {card.badge}
                    </span>
                  )}
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
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0a9748] dark:text-[#22c55e] hover:text-[#087d3c] dark:hover:text-[#4ade80] group"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentDashboard;
