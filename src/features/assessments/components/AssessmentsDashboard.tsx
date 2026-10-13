'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared';
import { useAssessments } from '../hooks/useAssessments';
import { useProgrammes } from '@/features/enrolment';
import { AssessmentStatsOverview } from './AssessmentStatsOverview';
import { AssessmentList } from './AssessmentList';
import { CreateAssessmentModal } from './CreateAssessmentModal';
import { Plus } from 'lucide-react';

export const AssessmentsDashboard: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passed' | 'archived'>('all');
  const [limit, setLimit] = useState(9);
  const [page, setPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);

  const currentCursor = cursorHistory[currentCursorIndex] || null;

  const { data: assessmentsData, isLoading: isLoadingAssessments } = useAssessments({
    search: searchTerm,
    programmeId: programmeId || undefined,
    status: statusFilter,
    limit,
    page,
    cursor: currentCursor,
  });

  const { data: programmesData } = useProgrammes();

  const assessments = assessmentsData?.data || [];
  const stats = assessmentsData?.meta?.stats;
  const pagination = assessmentsData?.meta?.pagination;
  const programmes = programmesData?.data || [];

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

  const handleStatusFilterChange = (status: 'all' | 'active' | 'passed' | 'archived') => {
    setStatusFilter(status);
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

  const handleProgrammeChange = (id: string) => {
    setProgrammeId(id);
    setPage(1);
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Registry Header */}
      <PageHeader
        title="Coursework & Assessment Management"
        description="Publish module coursework deliverables, establish strict submission deadlines, monitor class submission completion rates, and audit late submission tags."
        badge="Academic Registry • Coursework Operations"
        gradient="blue"
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assessment Deliverable</span>
        </button>
      </PageHeader>

      {/* Institutional Statistics Overview */}
      <AssessmentStatsOverview stats={stats} isLoading={isLoadingAssessments} />

      {/* Main Coursework List & Filter Grid */}
      <AssessmentList
        assessments={assessments}
        isLoading={isLoadingAssessments}
        pagination={pagination}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onLimitChange={handleLimitChange}
        programmes={programmes}
        selectedProgrammeId={programmeId}
        onProgrammeChange={handleProgrammeChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Create Assessment Modal */}
      <CreateAssessmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};

export default AssessmentsDashboard;
