'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { MarksheetStatsOverview } from './MarksheetStatsOverview';
import { AssessmentGradesTable } from './AssessmentGradesTable';
import { useGrades, useAssessmentGrades } from '../hooks/useMarksheet';
import { useAssessments } from '@/features/assessments';
import { BookOpen } from 'lucide-react';

export const MarksheetDashboard: React.FC = () => {
  // Coursework / Assessment selection state
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'graded' | 'ungraded' | 'published' | 'draft'
  >('all');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  // Fetch all active assessments for selector
  const { data: assessmentsData, isLoading: isLoadingAssessments } = useAssessments({
    limit: 50,
  });
  const assessmentsList = assessmentsData?.data || [];

  // Derive current assessment cleanly without cascading setState in effect
  const activeAssessmentId =
    selectedAssessmentId || (assessmentsList.length > 0 ? assessmentsList[0].id : '');

  // Overall institutional grades KPIs
  const { data: overallGradesData, isLoading: isLoadingStats } = useGrades({
    limit: 10,
  });
  const overallStats = overallGradesData?.meta?.stats;

  // Selected assessment cohort grading roster
  const {
    data: cohortGradesData,
    isLoading: isLoadingCohort,
  } = useAssessmentGrades(activeAssessmentId || undefined, {
    search: searchTerm,
    status: statusFilter,
    classification: classificationFilter,
    page,
    limit: 15,
  });

  const selectedAssessment = cohortGradesData?.meta?.assessment;
  const cohortMetrics = cohortGradesData?.meta?.metrics;
  const cohortPagination = cohortGradesData?.meta?.pagination;
  const rosterEntries = cohortGradesData?.data || [];

  const handleAssessmentChange = (id: string) => {
    setSelectedAssessmentId(id);
    setPage(1);
    setSearchTerm('');
    setStatusFilter('all');
    setClassificationFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Marksheet & Examination Results"
        description="Award numeric grades (0–100), compute UK university classifications, manage publish/withhold gating, and generate official electronic marksheets."
        badge="Module 4 • Examination Board"
        gradient="blue"
      />

      {/* Institutional Overview KPI Cards */}
      <MarksheetStatsOverview stats={overallStats} isLoading={isLoadingStats} />

      {/* Assessment Coursework Selector Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0269ae]/10 text-[#0269ae] dark:text-[#43b5e9] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Coursework Assessment Deliverable
              </h3>
              <p className="text-xs text-zinc-500">
                Select an assignment to view its enrolled class roster and award grades
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <select
              value={activeAssessmentId}
              onChange={(e) => handleAssessmentChange(e.target.value)}
              disabled={isLoadingAssessments || assessmentsList.length === 0}
              className="w-full py-2 px-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae]"
            >
              {assessmentsList.length === 0 ? (
                <option value="">No active assessments found</option>
              ) : (
                assessmentsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.module}: {a.title} ({a.programme?.code})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selected Assessment Class Metrics Banner */}
        {selectedAssessment && cohortMetrics && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Class Enrolled
              </span>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                {cohortMetrics.totalEnrolled}
              </p>
              <p className="text-[11px] text-zinc-500">{selectedAssessment.programme?.code}</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Submissions
              </span>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                {cohortMetrics.totalSubmitted}
              </p>
              <p className="text-[11px] text-zinc-500">
                {Math.round(
                  (cohortMetrics.totalSubmitted / Math.max(1, cohortMetrics.totalEnrolled)) * 100
                )}
                % completed
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Graded
              </span>
              <p className="text-lg font-black text-[#0269ae] dark:text-[#43b5e9]">
                {cohortMetrics.totalGraded}
              </p>
              <p className="text-[11px] text-zinc-500">{cohortMetrics.pendingGrading} pending</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Class Average
              </span>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                {cohortMetrics.totalGraded > 0 ? `${cohortMetrics.averageScore}%` : '—'}
              </p>
              <p className="text-[11px] text-zinc-500">Pass Rate: {cohortMetrics.passRate}%</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Published
              </span>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {cohortMetrics.publishedCount}
              </p>
              <p className="text-[11px] text-emerald-600/80">Visible to students</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Draft Moderation
              </span>
              <p className="text-lg font-black text-amber-700 dark:text-amber-300">
                {cohortMetrics.draftCount}
              </p>
              <p className="text-[11px] text-amber-600/80">Hidden from students</p>
            </div>
          </div>
        )}
      </div>

      {/* Cohort Grades Interactive Table */}
      {selectedAssessment ? (
        <AssessmentGradesTable
          assessment={selectedAssessment}
          roster={rosterEntries}
          metrics={cohortMetrics}
          isLoading={isLoadingCohort}
          pagination={cohortPagination}
          onNextPage={() => setPage((p) => p + 1)}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          classificationFilter={classificationFilter}
          onClassificationFilterChange={setClassificationFilter}
        />
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm font-semibold">Please select an assessment to view its grading roster</p>
        </div>
      )}
    </div>
  );
};
