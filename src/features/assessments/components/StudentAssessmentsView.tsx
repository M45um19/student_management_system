'use client';

import React, { useState } from 'react';
import { AssessmentRecord } from '../types';
import {
  calculateDeadlineStatus,
  formatSubmissionDate,
} from '../utils/assessmentCalculations';
import { SubmitCourseworkModal } from './SubmitCourseworkModal';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  ExternalLink,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface StudentAssessmentsViewProps {
  assessments: AssessmentRecord[];
  isLoading?: boolean;
}

export const StudentAssessmentsView: React.FC<StudentAssessmentsViewProps> = ({
  assessments,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'action_required' | 'submitted'>('all');
  const [selectedAssessmentForSubmit, setSelectedAssessmentForSubmit] =
    useState<AssessmentRecord | null>(null);

  // Filter assessments by tab
  const filteredAssessments = assessments.filter((a) => {
    const isSubmitted = Boolean(a.mySubmission);
    if (activeTab === 'action_required') {
      return !isSubmitted;
    }
    if (activeTab === 'submitted') {
      return isSubmitted;
    }
    return true;
  });

  const pendingCount = assessments.filter((a) => !a.mySubmission).length;
  const submittedCount = assessments.filter((a) => Boolean(a.mySubmission)).length;

  return (
    <div className="space-y-6">
      {/* Student Coursework Regulations Banner */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0a9748]/10 text-[#0a9748] dark:text-[#22c55e] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
              University Submission Regulations
            </span>
            <span>
              Resubmission is permitted prior to deadlines. Submissions past the deadline will be accepted but permanently tagged as <strong>LATE</strong>.
            </span>
          </div>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800 p-1 rounded-xl text-xs shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All ({assessments.length})
          </button>
          <button
            onClick={() => setActiveTab('action_required')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'action_required'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Action Required ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'submitted'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Submitted ({submittedCount})
          </button>
        </div>
      </div>

      {/* Coursework Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0a9748]" />
          <p className="text-xs text-zinc-500 font-medium">Loading your enrolled coursework...</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
          <CheckCircle2 className="w-10 h-10 mx-auto text-[#0a9748] mb-3" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {activeTab === 'action_required'
              ? 'All Coursework Submitted'
              : 'No Coursework Deliverables Found'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'action_required'
              ? 'You have submitted all active coursework requirements for your degree modules.'
              : 'There are currently no coursework deliverables scheduled for your enrolled programme.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssessments.map((assessment) => {
            const deadlineStatus = calculateDeadlineStatus(assessment.deadline);
            const sub = assessment.mySubmission;
            const isSubmitted = Boolean(sub);
            const isLate = sub?.isLate ?? false;
            const canResubmitBeforeDeadline = isSubmitted && !deadlineStatus.isPastDeadline;

            return (
              <div
                key={assessment.id}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header badges: Module & Deadline */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0a9748] dark:text-[#22c55e] border border-emerald-200 dark:border-emerald-900/60 font-mono">
                      {assessment.module}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        deadlineStatus.isPastDeadline
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : deadlineStatus.isDueSoon
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{deadlineStatus.relativeTime}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {assessment.title}
                  </h3>

                  {/* Deadline line */}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-4">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Official Deadline: {deadlineStatus.formattedDeadline}</span>
                  </p>

                  {/* Submission Status Box */}
                  <div
                    className={`p-3.5 rounded-xl border mb-2 ${
                      isSubmitted
                        ? isLate
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                          : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                        : deadlineStatus.isPastDeadline
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        Submission Status
                      </span>
                      {isSubmitted ? (
                        isLate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Submitted Late</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Submitted On-Time</span>
                          </span>
                        )
                      ) : deadlineStatus.isPastDeadline ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Overdue (Not Submitted)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                          Pending Upload
                        </span>
                      )}
                    </div>

                    {isSubmitted && sub ? (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400">Timestamp:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-100">
                            {formatSubmissionDate(sub.submittedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a9748] hover:text-[#087d3c] dark:text-[#22c55e] dark:hover:text-[#4ade80] group"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[190px]">{sub.fileName}</span>
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {deadlineStatus.isPastDeadline
                          ? 'The deadline has passed, but submissions remain accepted with late tag.'
                          : 'Please upload your coursework deliverable prior to the deadline.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                  {isSubmitted ? (
                    canResubmitBeforeDeadline ? (
                      <button
                        onClick={() => setSelectedAssessmentForSubmit(assessment)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resubmit Before Deadline</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium italic">
                        {deadlineStatus.isPastDeadline
                          ? 'Submission locked past deadline'
                          : 'Submitted successfully'}
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => setSelectedAssessmentForSubmit(assessment)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors ${
                        deadlineStatus.isPastDeadline
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#0a9748] hover:bg-[#087d3c]'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>
                        {deadlineStatus.isPastDeadline ? 'Submit Late Coursework' : 'Submit Coursework'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coursework Submission Modal */}
      <SubmitCourseworkModal
        isOpen={Boolean(selectedAssessmentForSubmit)}
        onClose={() => setSelectedAssessmentForSubmit(null)}
        assessment={selectedAssessmentForSubmit}
      />
    </div>
  );
};
