'use client';

import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  UserPlus, 
  Plus, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/shared';
import { 
  useStudents, 
  useProgrammes, 
  useUpdateStudentStatus 
} from '../hooks/useEnrolment';
import { StudentFilterParams, EnrolmentStatusType } from '../types';
import { StudentFilterBar } from './StudentFilterBar';
import { StudentTable } from './StudentTable';
import { EnrolStudentModal } from './EnrolStudentModal';
import { StudentDetailModal } from './StudentDetailModal';
import { ProgrammeList } from './ProgrammeList';
import { CreateProgrammeModal } from './CreateProgrammeModal';

export const EnrolmentDashboard: React.FC = () => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'students' | 'programmes'>('students');

  // Filter state
  const [filters, setFilters] = useState<StudentFilterParams>({
    search: '',
    programmeId: '',
    status: '',
    academicYear: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Modal dialog states
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);
  const [isProgrammeModalOpen, setIsProgrammeModalOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  // Queries
  const { 
    data: studentsData, 
    isLoading: isLoadingStudents 
  } = useStudents(filters);

  const { 
    data: programmesData, 
    isLoading: isLoadingProgrammes 
  } = useProgrammes();

  // Mutation
  const { 
    mutateAsync: updateStatus, 
    isPending: isUpdatingStatus 
  } = useUpdateStudentStatus();

  const students = studentsData?.data ?? [];
  const pagination = studentsData?.meta?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 };
  const stats = studentsData?.meta?.stats ?? { total: 0, enrolled: 0, deferred: 0, withdrawn: 0, completed: 0, programmesCount: 0 };
  const programmes = programmesData?.data ?? [];

  // Cursor history stack for forward/backward UUIDv7 navigation
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentCursorIndex, setCurrentCursorIndex] = useState(0);

  // Handlers
  const handleFilterChange = (newFilters: Partial<StudentFilterParams>) => {
    // Reset cursor stack on new query criteria
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      cursor: null,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
    setFilters({
      search: '',
      programmeId: '',
      status: '',
      academicYear: '',
      cursor: null,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleNextPage = () => {
    if (pagination.nextCursor) {
      const nextCur = pagination.nextCursor;
      const nextIdx = currentCursorIndex + 1;
      setCursorHistory((prev) => {
        const updated = prev.slice(0, currentCursorIndex + 1);
        updated.push(nextCur);
        return updated;
      });
      setCurrentCursorIndex(nextIdx);
      setFilters((prev) => ({
        ...prev,
        cursor: nextCur,
        page: nextIdx + 1,
      }));
    }
  };

  const handlePrevPage = () => {
    if (currentCursorIndex > 0) {
      const prevIdx = currentCursorIndex - 1;
      const prevCur = cursorHistory[prevIdx] || null;
      setCurrentCursorIndex(prevIdx);
      setFilters((prev) => ({
        ...prev,
        cursor: prevCur,
        page: prevIdx + 1,
      }));
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
    setFilters((prev) => ({
      ...prev,
      limit: newLimit,
      cursor: null,
      page: 1,
    }));
  };

  const handleStatusChange = async (studentId: string, newStatus: EnrolmentStatusType) => {
    await updateStatus({ id: studentId, status: newStatus });
  };

  const handleFilterByProgrammeFromList = (progId: string) => {
    setCursorHistory([null]);
    setCurrentCursorIndex(0);
    setFilters((prev) => ({ ...prev, programmeId: progId, cursor: null, page: 1 }));
    setActiveTab('students');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        title="Student Enrolment & Programmes"
        description="Core Academic Registry module: enrol students, auto-generate sequential SMS IDs, manage degree curriculums, and oversee student lifecycle statuses."
        badge="Module 1 • Registry Domain"
        gradient="blue"
      >
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => setIsEnrolModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#013b63] hover:bg-white/90 text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-[#0269ae]" />
            <span>Enrol New Student</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProgrammeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold backdrop-blur-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Programme</span>
          </button>
        </div>
      </PageHeader>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.total}
          subtitle="All-time registered profiles"
          icon={Users}
          badge="Registry"
        />
        <StatCard
          title="Actively Enrolled"
          value={stats.enrolled}
          subtitle="Active academic cohorts"
          icon={CheckCircle2}
          badge="Active"
        />
        <StatCard
          title="Deferred / Withdrawn"
          value={stats.deferred + stats.withdrawn}
          subtitle={`${stats.deferred} Deferred • ${stats.withdrawn} Withdrawn`}
          icon={Clock}
        />
        <StatCard
          title="Degree Programmes"
          value={programmes.length || stats.programmesCount}
          subtitle="Accredited degree courses"
          icon={BookOpen}
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'students'
                ? 'bg-[#0269ae] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Directory</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'students'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programmes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'programmes'
                ? 'bg-[#0269ae] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Degree Programmes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'programmes'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {programmes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'students' ? (
        <div className="space-y-4">
          <StudentFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            programmes={programmes}
            totalResults={pagination.total}
          />

          <StudentTable
            students={students}
            isLoading={isLoadingStudents}
            pagination={pagination}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onLimitChange={handleLimitChange}
            onSelectStudent={(std) => setDetailStudentId(std.id)}
            onStatusChange={handleStatusChange}
            isUpdatingStatus={isUpdatingStatus}
            onOpenEnrolModal={() => setIsEnrolModalOpen(true)}
          />
        </div>
      ) : (
        <ProgrammeList
          programmes={programmes}
          isLoading={isLoadingProgrammes}
          onOpenCreateModal={() => setIsProgrammeModalOpen(true)}
          onFilterByProgramme={handleFilterByProgrammeFromList}
        />
      )}

      {/* Enrol Student Modal Dialog */}
      <EnrolStudentModal
        isOpen={isEnrolModalOpen}
        onClose={() => setIsEnrolModalOpen(false)}
        programmes={programmes}
      />

      {/* Create Programme Modal Dialog */}
      <CreateProgrammeModal
        isOpen={isProgrammeModalOpen}
        onClose={() => setIsProgrammeModalOpen(false)}
      />

      {/* Student Detail Modal Drawer */}
      <StudentDetailModal
        studentId={detailStudentId}
        isOpen={Boolean(detailStudentId)}
        onClose={() => setDetailStudentId(null)}
      />
    </div>
  );
};

export default EnrolmentDashboard;
