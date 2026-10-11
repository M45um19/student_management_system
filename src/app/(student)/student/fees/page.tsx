'use client';

import React from 'react';
import { PageHeader } from '@/components/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useStudentFees, StudentFeeLedgerView } from '@/features/fees';
import { Loader2, AlertCircle } from 'lucide-react';

export default function StudentFeesPage() {
  const { user, isLoadingSession } = useAuth();
  
  // Fetch fees for the authenticated student
  const { data, isLoading: isLoadingFees, error } = useStudentFees('me');

  const ledger = data?.data || null;

  return (
    <div className="space-y-6">
      {/* Student Portal Header */}
      <PageHeader
        title="Tuition Fees & Payments Ledger"
        description="Official statement of account: inspect your accredited degree tuition fee liability, examine logged payment receipts, and verify your current balance."
        badge="Student Self-Service • Finance"
        gradient="green"
      />

      {isLoadingSession || isLoadingFees ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0a9748]" />
          <p className="text-xs text-zinc-500 font-medium">
            Retrieving official bursar fee statement...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">
              Unable to load fee ledger
            </h4>
            <p className="mt-1">{error.message || 'Please contact Registry & Admissions.'}</p>
          </div>
        </div>
      ) : (
        <StudentFeeLedgerView
          ledger={ledger}
          isLoading={false}
          isStaff={false}
        />
      )}
    </div>
  );
}
