'use client';

import React, { useState } from 'react';
import {
  StudentAssessmentGradeEntry,
  CursorPaginationMeta,
  GradeAssessment,
  AssessmentGradesMetrics,
} from '../types';
import { AwardGradeModal } from './AwardGradeModal';
import { StudentMarksheetModal } from './StudentMarksheetModal';
import { useTogglePublishGrade, useBulkPublishGrades } from '../hooks/useMarksheet';
import {
  formatGradeDate,
  getClassificationBadgeProps,
} from '../utils/gradeCalculations';
import {
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Globe,
  Lock,
  Loader2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface AssessmentGradesTableProps {
  assessment: GradeAssessment;
  roster: StudentAssessmentGradeEntry[];
  metrics?: AssessmentGradesMetrics;
  isLoading?: boolean;
  pagination?: CursorPaginationMeta;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onLimitChange?: (limit: number) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  statusFilter?: 'all' | 'graded' | 'ungraded' | 'published' | 'draft';
  onStatusFilterChange?: (status: 'all' | 'graded' | 'ungraded' | 'published' | 'draft') => void;
  classificationFilter?: string;
  onClassificationFilterChange?: (c: string) => void;
}

export const AssessmentGradesTable: React.FC<AssessmentGradesTableProps> = ({
  assessment,
  roster,
  metrics,
  isLoading = false,
  pagination,
  onNextPage,
  onPrevPage,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  classificationFilter = 'all',
  onClassificationFilterChange,
}) => {
  // Modal states
  const [selectedEntryForGrading, setSelectedEntryForGrading] =
    useState<StudentAssessmentGradeEntry | null>(null);
  const [selectedStudentForMarksheet, setSelectedStudentForMarksheet] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Hook mutations
  const togglePublishMutation = useTogglePublishGrade();
  const bulkPublishMutation = useBulkPublishGrades();

  const handleTogglePublish = async (entry: StudentAssessmentGradeEntry) => {
    if (!entry.grade) return;
    try {
      await togglePublishMutation.mutateAsync({
        gradeId: entry.grade.id,
        isPublished: !entry.grade.isPublished,
        studentId: entry.student.id,
        assessmentId: assessment.id,
      });
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleBulkPublish = async (isPublished: boolean) => {
    const action = isPublished ? 'publish' : 'withhold';
    if (
      !confirm(
        `Are you sure you want to ${action} all awarded grades for this assessment (${assessment.title})?`
      )
    ) {
      return;
    }

    try {
      await bulkPublishMutation.mutateAsync({
        assessmentId: assessment.id,
        isPublished,
      });
    } catch (err) {
      console.error('Failed to bulk publish grades:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-hidden space-y-0">
      {/* Search and Action Bar */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search student by name, SMS ID or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae]"
            />
          </div>

          {/* Classification selector */}
          <select
            value={classificationFilter}
            onChange={(e) => onClassificationFilterChange?.(e.target.value)}
            className="py-2 px-3 rounded-xl text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae]"
          >
            <option value="all">All Classifications</option>
            <option value="Distinction">Distinction (≥70%)</option>
            <option value="Merit">Merit (60–69%)</option>
            <option value="Pass">Pass (40–59%)</option>
            <option value="Fail">Fail (&lt;40%)</option>
          </select>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={() => handleBulkPublish(true)}
            disabled={bulkPublishMutation.isPending || !metrics || metrics.totalGraded === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Publish all awarded grades to student marksheets"
          >
            <Globe className="w-3.5 h-3.5 text-[#0a9748]" />
            <span>Publish All</span>
          </button>

          <button
            type="button"
            onClick={() => handleBulkPublish(false)}
            disabled={bulkPublishMutation.isPending || !metrics || metrics.publishedCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Withhold all grades (revert to Registry draft moderation)"
          >
            <Lock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Withhold All</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/20 flex items-center gap-1.5 overflow-x-auto text-xs">
        {[
          { key: 'all', label: 'Entire Class', count: metrics?.totalEnrolled },
          { key: 'graded', label: 'Graded', count: metrics?.totalGraded },
          { key: 'ungraded', label: 'Pending Grading', count: metrics?.pendingGrading },
          { key: 'published', label: 'Published to Students', count: metrics?.publishedCount },
          { key: 'draft', label: 'Staff Drafts', count: metrics?.draftCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() =>
              onStatusFilterChange?.(
                tab.key as 'all' | 'graded' | 'ungraded' | 'published' | 'draft'
              )
            }
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              statusFilter === tab.key
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.key
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Class Grades Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-50/70 dark:bg-zinc-850 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Deliverable File</th>
              <th className="py-3 px-4 text-center">Numeric Mark</th>
              <th className="py-3 px-4 text-center">UK Classification</th>
              <th className="py-3 px-4 text-center">Marksheet Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0269ae]" />
                    <span>Loading student records and grades...</span>
                  </div>
                </td>
              </tr>
            ) : roster.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-zinc-400" />
                    <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                      No class records match current filters
                    </p>
                    <p className="text-xs text-zinc-400">
                      Try clearing your search query or switching tabs.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              roster.map((entry) => {
                const gr = entry.grade;
                const sub = entry.submission;
                const badge = gr ? getClassificationBadgeProps(gr.classification) : null;

                return (
                  <tr
                    key={entry.student.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {entry.student.fullName}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {entry.student.studentId} • {entry.student.email}
                      </div>
                    </td>

                    {/* Deliverable File */}
                    <td className="py-3.5 px-4">
                      {sub ? (
                        <div className="space-y-1">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-colors group"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#0269ae]" />
                            <span className="truncate max-w-[140px]">{sub.fileName}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600" />
                          </a>
                          <div>
                            {sub.isLate ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Late Submission
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                On-Time ({formatGradeDate(sub.submittedAt)})
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">
                          No deliverable uploaded
                        </span>
                      )}
                    </td>

                    {/* Numeric Mark */}
                    <td className="py-3.5 px-4 text-center">
                      {gr ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                            {gr.numericGrade}
                            <span className="text-[10px] text-zinc-400 font-normal">/100</span>
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-1">
                            <div
                              className={`h-full ${
                                gr.numericGrade >= 70
                                  ? 'bg-[#0a9748]'
                                  : gr.numericGrade >= 60
                                  ? 'bg-[#0269ae]'
                                  : gr.numericGrade >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, gr.numericGrade)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic font-mono">—</span>
                      )}
                    </td>

                    {/* Classification */}
                    <td className="py-3.5 px-4 text-center">
                      {badge && gr ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.badgeClass}`}
                        >
                          {gr.classification}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">Ungraded</span>
                      )}
                    </td>

                    {/* Marksheet Gating Status & Switch */}
                    <td className="py-3.5 px-4 text-center">
                      {gr ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(entry)}
                            disabled={togglePublishMutation.isPending}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              gr.isPublished
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                            }`}
                            title={
                              gr.isPublished
                                ? 'Click to withhold from student marksheet'
                                : 'Click to publish to student marksheet'
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                gr.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                              }`}
                            />
                            <span>{gr.isPublished ? 'Published' : 'Draft Only'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">Awaiting Mark</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEntryForGrading(entry)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0269ae] dark:text-[#43b5e9] bg-[#0269ae]/10 hover:bg-[#0269ae]/20 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{gr ? 'Edit Mark' : 'Award Mark'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudentForMarksheet({
                              id: entry.student.id,
                              name: entry.student.fullName,
                            })
                          }
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Inspect Student's Full Marksheet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
              Showing Page{' '}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.page}</span>
              {pagination.totalPages > 1 ? ` of ${pagination.totalPages}` : ''}
            </span>
            <span className="text-zinc-400">•</span>
            <span>
              Total{' '}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {pagination.total}
              </span>{' '}
              students in class
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevPage}
              disabled={!pagination.hasPrevPage}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Previous</span>
            </button>
            <button
              onClick={onNextPage}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Award Grade Modal */}
      {selectedEntryForGrading && (
        <AwardGradeModal
          isOpen={Boolean(selectedEntryForGrading)}
          onClose={() => setSelectedEntryForGrading(null)}
          student={{
            id: selectedEntryForGrading.student.id,
            studentId: selectedEntryForGrading.student.studentId,
            fullName: selectedEntryForGrading.student.fullName,
            email: selectedEntryForGrading.student.email,
          }}
          assessment={{
            id: assessment.id,
            title: assessment.title,
            module: assessment.module,
            deadline: assessment.deadline,
          }}
          submission={selectedEntryForGrading.submission}
          existingGrade={selectedEntryForGrading.grade}
          onSuccess={() => setSelectedEntryForGrading(null)}
        />
      )}

      {/* Student Marksheet Inspection Modal */}
      {selectedStudentForMarksheet && (
        <StudentMarksheetModal
          isOpen={Boolean(selectedStudentForMarksheet)}
          onClose={() => setSelectedStudentForMarksheet(null)}
          studentId={selectedStudentForMarksheet.id}
          studentName={selectedStudentForMarksheet.name}
        />
      )}
    </div>
  );
};
