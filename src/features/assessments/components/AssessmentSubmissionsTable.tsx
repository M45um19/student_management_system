'use client';

import React from 'react';
import { StudentAssessmentRosterEntry, CursorPaginationMeta } from '../types';
import { formatSubmissionDate } from '../utils/assessmentCalculations';
import {
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AssessmentSubmissionsTableProps {
  roster: StudentAssessmentRosterEntry[];
  isLoading?: boolean;
  pagination?: CursorPaginationMeta;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onLimitChange?: (limit: number) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  statusFilter?: 'all' | 'submitted' | 'late' | 'missing';
  onStatusFilterChange?: (status: 'all' | 'submitted' | 'late' | 'missing') => void;
}

export const AssessmentSubmissionsTable: React.FC<AssessmentSubmissionsTableProps> = ({
  roster,
  isLoading = false,
  pagination,
  onNextPage,
  onPrevPage,
  onLimitChange,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
}) => {
  // Local state fallbacks if not controlled from parent
  const [localSearch, setLocalSearch] = React.useState('');
  const [localStatus, setLocalStatus] = React.useState<'all' | 'submitted' | 'late' | 'missing'>('all');

  const activeSearch = onSearchChange ? searchTerm : localSearch;
  const activeStatus = onStatusFilterChange ? statusFilter : localStatus;

  const handleSearch = (term: string) => {
    if (onSearchChange) {
      onSearchChange(term);
    } else {
      setLocalSearch(term);
    }
  };

  const handleStatus = (status: 'all' | 'submitted' | 'late' | 'missing') => {
    if (onStatusFilterChange) {
      onStatusFilterChange(status);
    } else {
      setLocalStatus(status);
    }
  };

  // Client-side fallback filter if not using server-side pagination
  const displayRoster = onSearchChange
    ? roster
    : roster.filter((entry) => {
        const matchesSearch =
          entry.student.fullName.toLowerCase().includes(activeSearch.toLowerCase()) ||
          entry.student.studentId.toLowerCase().includes(activeSearch.toLowerCase()) ||
          entry.student.email.toLowerCase().includes(activeSearch.toLowerCase());

        const matchesStatus =
          activeStatus === 'all' ||
          (activeStatus === 'submitted' && entry.hasSubmitted) ||
          (activeStatus === 'late' && entry.status === 'LATE') ||
          (activeStatus === 'missing' && entry.status === 'MISSING');

        return matchesSearch && matchesStatus;
      });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student by name, SMS ID or email..."
            value={activeSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
            {(
              [
                { label: 'All', value: 'all' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Late', value: 'late' },
                { label: 'Missing', value: 'missing' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeStatus === tab.value
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4">Student ID & Name</th>
              <th className="py-3 px-4">Submission Status</th>
              <th className="py-3 px-4">Submitted At</th>
              <th className="py-3 px-4">Deliverable File</th>
              <th className="py-3 px-4 text-right">Registry Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-[#0269ae] border-t-transparent rounded-full mb-2" />
                  <p>Loading cohort submissions roster...</p>
                </td>
              </tr>
            ) : displayRoster.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                  <p className="font-medium">No students match current search or status filter.</p>
                </td>
              </tr>
            ) : (
              displayRoster.map((entry) => {
                const sub = entry.submission;
                const isLate = entry.status === 'LATE';
                const isOnTime = entry.status === 'ON_TIME';

                return (
                  <tr
                    key={entry.student.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {entry.student.fullName}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {entry.student.studentId} • {entry.student.email}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {isOnTime ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-[#0a9748]" />
                          <span>Submitted On-Time</span>
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>LATE Submission</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>Not Submitted</span>
                        </span>
                      )}
                    </td>

                    {/* Submitted At */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                      {entry.submittedAt ? formatSubmissionDate(entry.submittedAt) : '—'}
                    </td>

                    {/* Deliverable File */}
                    <td className="py-3.5 px-4">
                      {sub ? (
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-colors group"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0269ae]" />
                          <span className="truncate max-w-[180px]">{sub.fileName}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
                        </a>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 italic text-[11px]">
                          No deliverable
                        </span>
                      )}
                    </td>

                    {/* Grade Status */}
                    <td className="py-3.5 px-4 text-right">
                      {sub?.grade ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {sub.grade.numericGrade}/100
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                            {sub.grade.classification} • {sub.grade.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                          Ungraded
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Summary Footer */}
      {pagination && pagination.total > 0 && (
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-500">
            <span>
              Showing Page <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.page}</span>
              {pagination.totalPages > 1 ? ` of ${pagination.totalPages}` : ''}
            </span>
            <span className="text-zinc-400">
              ({pagination.total} student{pagination.total === 1 ? '' : 's'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onLimitChange && (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <span>Per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0269ae]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
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
