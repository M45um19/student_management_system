'use client';

import React from 'react';
import { PageHeader } from '@/components/shared';
import { useStudentMarksheet, StudentMarksheetView } from '@/features/marksheet';
import { Loader2, AlertCircle } from 'lucide-react';

export default function StudentMarksheetPage() {
  const { data, isLoading, error } = useStudentMarksheet('me');
  const marksheet = data?.data || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Academic Marksheet"
        description="Verified Registry Statement of Examination Results: inspect your ratified module coursework marks, cumulative weighted average, and official degree award classification."
        badge="Student Self-Service • Results"
        gradient="green"
      />

      {isLoading ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0a9748]" />
          <p className="text-sm font-semibold">Retrieving verified academic marksheet...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">
              Unable to load official marksheet
            </h4>
            <p className="mt-1">{error.message || 'Please contact Registry & Admissions.'}</p>
          </div>
        </div>
      ) : marksheet ? (
        <StudentMarksheetView marksheet={marksheet} />
      ) : null}
    </div>
  );
}
