'use client';

import React from 'react';
import { PageHeader } from '@/components/shared';
import { useAssessments, StudentAssessmentsView } from '@/features/assessments';
import { AlertCircle } from 'lucide-react';

export default function StudentAssessmentsPage() {
  const { data, isLoading, error } = useAssessments();
  const assessments = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coursework Submissions"
        description="Inspect scheduled module coursework deliverables, upload your documents (.pdf, .docx), verify submission timestamps, and monitor deadline countdowns."
        badge="Student Self-Service • Academics"
        gradient="green"
      />

      {error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">
              Unable to load coursework requirements
            </h4>
            <p className="mt-1">{error.message || 'Please contact Registry & Admissions.'}</p>
          </div>
        </div>
      ) : (
        <StudentAssessmentsView assessments={assessments} isLoading={isLoading} />
      )}
    </div>
  );
}
