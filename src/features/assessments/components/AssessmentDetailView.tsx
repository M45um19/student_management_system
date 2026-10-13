'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAssessmentSubmissions } from '../hooks/useAssessments';
import { calculateDeadlineStatus } from '../utils/assessmentCalculations';
import { AssessmentSubmissionsTable } from './AssessmentSubmissionsTable';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  Loader2,
  GraduationCap,
} from 'lucide-react';

interface AssessmentDetailViewProps {
  assessmentId: string;
}

export const AssessmentDetailView: React.FC<AssessmentDetailViewProps> = ({ assessmentId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'late' | 'missing'>('all');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);

  const currentCursor = cursorHistory[currentCursorIndex] || null;

  const { data, isLoading, error } = useAssessmentSubmissions(assessmentId, {
    search: searchTerm,
    status: statusFilter,
    limit,
    page,
    cursor: currentCursor,
  });

  const payload = data?.data;
  const assessment = payload?.assessment;
  const roster = payload?.roster || [];
  const stats = payload?.stats;
  const pagination = payload?.pagination || data?.meta?.pagination;

  const handleNextPage = () => {
    if (pagination?.nextCursor) {
      const nextCur = pagination.nextCursor;
      const nextIdx = currentCursorIndex + 1;
      setCursorHistory((prev) => {
        const updated = prev.slice(0, currentCursorIndex + 1);
        updated.push(nextCur);
        return updated;
      });
      setCurrentCursorIndex(nextIdx);
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentCursorIndex > 0) {
      const prevIdx = currentCursorIndex - 1;
      setCurrentCursorIndex(prevIdx);
      setPage((prev) => Math.max(1, prev - 1));
    } else if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
  };

  const handleStatusFilterChange = (status: 'all' | 'submitted' | 'late' | 'missing') => {
    setStatusFilter(status);
    setPage(1);
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
  };

  if (isLoading && !payload) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0269ae]" />
        <p className="text-xs text-zinc-500 font-medium">Retrieving class assessment roster...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <AlertTriangle className="w-10 h-10 mx-auto text-rose-500 mb-3" />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Assessment Not Found
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
          {error?.message || 'Unable to retrieve the requested module assessment record.'}
        </p>
        <Link
          href="/staff/assessments"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0269ae]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Coursework Hub</span>
        </Link>
      </div>
    );
  }

  const deadlineStatus = calculateDeadlineStatus(assessment.deadline);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/staff/assessments"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Coursework Hub</span>
        </Link>
      </div>

      {/* Assessment Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0269ae] dark:text-[#43b5e9] border border-blue-200 dark:border-blue-900/60 font-mono">
                {assessment.programme?.code || 'DEGREE'}
              </span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {assessment.module}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {assessment.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Enrolled Programme: {assessment.programme?.name}
            </p>
          </div>

          {/* Deadline Pill & Marksheet Action */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <Link
              href="/staff/marksheet"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#0269ae] dark:text-[#43b5e9] bg-[#0269ae]/10 hover:bg-[#0269ae]/20 border border-[#0269ae]/30 transition-colors shadow-2xs"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Marksheet Board</span>
            </Link>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                deadlineStatus.isPastDeadline
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  : deadlineStatus.isDueSoon
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{deadlineStatus.relativeTime}</span>
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Deadline: {deadlineStatus.formattedDeadline}
            </span>
          </div>
        </div>

        {/* Cohort Key Stats Bar */}
        {stats && (
          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                Enrolled Students
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {stats.totalEnrolled}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                Total Submissions
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {stats.totalSubmitted}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                Submission Rate
              </span>
              <span className="text-lg font-bold text-[#0269ae] dark:text-[#43b5e9] font-mono">
                {stats.submissionRate}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">
                On-Time Submissions
              </span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200 font-mono">
                {stats.onTimeCount}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl ${
                stats.lateCount > 0
                  ? 'bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60'
                  : 'bg-zinc-50 dark:bg-zinc-800/50'
              }`}
            >
              <span
                className={`text-[11px] font-medium block ${
                  stats.lateCount > 0
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                Late Submissions
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  stats.lateCount > 0
                    ? 'text-rose-800 dark:text-rose-200'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {stats.lateCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                Pending / Missing
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {stats.missingCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cohort Submissions Roster Table */}
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          Class Submission Roster
        </h2>
        <AssessmentSubmissionsTable
          roster={roster}
          isLoading={isLoading}
          pagination={pagination}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          onLimitChange={handleLimitChange}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />
      </div>
    </div>
  );
};
