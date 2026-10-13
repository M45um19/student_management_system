'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AssessmentRecord, CursorPaginationMeta } from '../types';
import { calculateDeadlineStatus } from '../utils/assessmentCalculations';
import { useArchiveAssessment } from '../hooks/useAssessments';
import {
  Search,
  BookOpen,
  Clock,
  AlertTriangle,
  ArrowRight,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface AssessmentListProps {
  assessments: AssessmentRecord[];
  isLoading?: boolean;
  pagination?: CursorPaginationMeta;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onLimitChange?: (limit: number) => void;
  programmes?: Array<{ id: string; code: string; name: string }>;
  selectedProgrammeId?: string;
  onProgrammeChange?: (id: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  statusFilter?: 'all' | 'active' | 'passed' | 'archived';
  onStatusFilterChange?: (status: 'all' | 'active' | 'passed' | 'archived') => void;
  onCreateClick?: () => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  isLoading = false,
  pagination,
  onNextPage,
  onPrevPage,
  onLimitChange,
  programmes = [],
  selectedProgrammeId = '',
  onProgrammeChange,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  onCreateClick,
}) => {
  const archiveMutation = useArchiveAssessment();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleArchive = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        `Archive "${title}"? This assessment will be marked as inactive and hidden from normal rosters and student dashboards. You can restore it anytime from the Archived tab.`
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(id);
      await archiveMutation.mutateAsync({ id, isActive: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to archive assessment.';
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        `Restore "${title}" to the active assessment roster? It will become visible again to enrolled students and staff.`
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(id);
      await archiveMutation.mutateAsync({ id, isActive: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to restore assessment.';
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search module code, coursework title, or programme..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae]"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Programme Filter */}
          <select
            value={selectedProgrammeId}
            onChange={(e) => onProgrammeChange?.(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#0269ae]"
          >
            <option value="">All Degree Programmes</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
            {(
              [
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Past Deadline', value: 'passed' },
                { label: 'Archived', value: 'archived' },
              ] as const
            ).map((s) => (
              <button
                key={s.value}
                onClick={() => onStatusFilterChange?.(s.value)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === s.value
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assessments Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0269ae]" />
          <p className="text-xs text-zinc-500 font-medium">Loading coursework assessments...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
          {statusFilter === 'archived' ? (
            <>
              <Archive className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                No Archived Assessments
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                There are currently no archived coursework deliverables. Archived assessments are kept here safe from student access and can be restored anytime.
              </p>
            </>
          ) : (
            <>
              <BookOpen className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                No Assessments Found
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                No assessments match your current filters. Create a new coursework deliverable to begin.
              </p>
              {onCreateClick && (
                <button
                  onClick={onCreateClick}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0269ae] hover:bg-[#01538c] transition-colors"
                >
                  Create Assessment
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assessments.map((assessment) => {
            const deadlineStatus = calculateDeadlineStatus(assessment.deadline);
            const metrics = assessment.metrics || {
              totalEnrolled: 0,
              totalSubmitted: assessment._count?.submissions ?? 0,
              lateCount: 0,
              submissionRate: 0,
            };
            const isArchived = assessment.isActive === false;

            return (
              <div
                key={assessment.id}
                className={`p-6 rounded-2xl bg-white dark:bg-zinc-900 border ${
                  isArchived
                    ? 'border-dashed border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md'
                } transition-all flex flex-col justify-between group`}
              >
                <div>
                  {/* Top badges: Programme & Deadline / Archived Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0269ae] dark:text-[#43b5e9] border border-blue-200 dark:border-blue-900/60 font-mono">
                      {assessment.programme?.code || 'PROGRAMME'}
                    </span>
                    {isArchived ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <Archive className="w-3 h-3" />
                        <span>Archived</span>
                      </span>
                    ) : (
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
                    )}
                  </div>

                  {/* Module Code and Title */}
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    {assessment.module}
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#0269ae] transition-colors leading-snug">
                    {assessment.title}
                  </h3>

                  {/* Deadline text */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{deadlineStatus.formattedDeadline}</span>
                  </div>

                  {/* Cohort Submission Progress */}
                  <div className="mt-5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">
                        Submissions
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {metrics.totalSubmitted} / {metrics.totalEnrolled || '—'} ({metrics.submissionRate}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0269ae] to-[#43b5e9] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, metrics.submissionRate)}%` }}
                      />
                    </div>

                    {/* Late Tag Counter */}
                    {metrics.lateCount > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{metrics.lateCount} submitted past deadline (tagged late)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <Link
                    href={`/staff/assessments/${assessment.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0269ae] hover:text-[#01538c] dark:text-[#43b5e9] dark:hover:text-[#38a3d4]"
                  >
                    <span>Inspect Class Roster</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {isArchived ? (
                    <button
                      onClick={(e) => handleRestore(e, assessment.id, assessment.title)}
                      disabled={actionLoadingId === assessment.id}
                      title="Restore assessment to active roster"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
                    >
                      {actionLoadingId === assessment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      )}
                      <span>Restore</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleArchive(e, assessment.id, assessment.title)}
                      disabled={actionLoadingId === assessment.id}
                      title="Archive assessment"
                      className="inline-flex items-center gap-1 p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    >
                      {actionLoadingId === assessment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Toolbar */}
      {pagination && pagination.total > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-500">
            <span>
              Showing Page{' '}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.page}</span>
              {pagination.totalPages > 1 ? ` of ${pagination.totalPages}` : ''}
            </span>
            <span className="text-zinc-400">
              ({pagination.total} coursework assessment{pagination.total === 1 ? '' : 's'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onLimitChange && (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <span>Per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0269ae]"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={18}>18</option>
                  <option value={36}>36</option>
                </select>
              </div>
            )}

            <span className="text-[10px] text-zinc-400 font-mono hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              UUIDv7 Cursor
            </span>

            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={onPrevPage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={onNextPage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
