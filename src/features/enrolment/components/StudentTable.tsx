'use client';

import React, { useState } from 'react';
import { 
  Users, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  CreditCard,
  Check,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Student, PaginationMeta, EnrolmentStatusType } from '../types';
import { StatusBadge } from './StatusBadge';

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  pagination: PaginationMeta;
  onPageChange?: (page: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onLimitChange?: (limit: number) => void;
  onSelectStudent: (student: Student) => void;
  onStatusChange: (studentId: string, newStatus: EnrolmentStatusType) => Promise<void> | void;
  isUpdatingStatus: boolean;
  onOpenEnrolModal: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  isLoading,
  pagination,
  onPageChange,
  onNextPage,
  onPrevPage,
  onLimitChange,
  onSelectStudent,
  onStatusChange,
  isUpdatingStatus,
  onOpenEnrolModal,
}) => {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const statusOptions: { value: EnrolmentStatusType; label: string }[] = [
    { value: 'ENROLLED', label: 'Enrolled' },
    { value: 'DEFERRED', label: 'Deferred' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const handleStatusSelect = async (studentId: string, status: EnrolmentStatusType) => {
    setActiveDropdownId(null);
    await onStatusChange(studentId, status);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Table Area */}
      <div className="overflow-x-auto min-h-[320px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/75 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <th className="py-3 px-4">Student ID</th>
              <th className="py-3 px-4">Student Name & Contact</th>
              <th className="py-3 px-4">Degree Programme</th>
              <th className="py-3 px-4">Academic Year</th>
              <th className="py-3 px-4">Tuition / Ledger</th>
              <th className="py-3 px-4">Enrolment Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                        <div className="h-2.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : students.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      No Student Records Found
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 text-center">
                      Try adjusting your search criteria or register a new student to the registry.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenEnrolModal}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0269ae] hover:bg-[#015289] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Enrol New Student</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              // Real Data Rows
              students.map((student) => {
                const initials = student.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const isDropdownOpen = activeDropdownId === student.id;
                const fin = student.financialSummary;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Student ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
                        {student.studentId}
                      </span>
                    </td>

                    {/* Student Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0269ae] to-[#0a9748] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student)}
                            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[#0269ae] dark:hover:text-[#43b5e9] truncate block text-left"
                          >
                            {student.fullName}
                          </button>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Degree Programme */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {student.programme?.name || 'Unassigned'}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {student.programme?.code}
                      </div>
                    </td>

                    {/* Academic Year */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                      {student.academicYear}
                    </td>

                    {/* Tuition & Financial Balance */}
                    <td className="py-3.5 px-4">
                      {fin ? (
                        <div>
                          <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                            £{fin.tuitionFee.toLocaleString()}
                          </div>
                          <div className="text-[10px] flex items-center gap-1">
                            {fin.balance === 0 ? (
                              <span className="text-[#0a9748] dark:text-[#22c55e] font-semibold">
                                Paid in Full
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                £{fin.balance.toLocaleString()} Due
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Enrolment Status with Quick Switcher */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveDropdownId(isDropdownOpen ? null : student.id)
                          }
                          className="flex items-center gap-1.5 focus:outline-none rounded-full"
                          title="Click to transition lifecycle status"
                        >
                          <StatusBadge status={student.status} />
                          <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
                        </button>

                        {/* Status Change Dropdown Menu */}
                        {isDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveDropdownId(null)}
                            />
                            <div className="absolute left-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 mb-1">
                                Change Status
                              </div>
                              {statusOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  disabled={isUpdatingStatus}
                                  onClick={() => handleStatusSelect(student.id, opt.value)}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                                    student.status === opt.value
                                      ? 'bg-zinc-100 dark:bg-zinc-700/70 font-semibold text-zinc-900 dark:text-zinc-100'
                                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {student.status === opt.value && (
                                    <Check className="w-3.5 h-3.5 text-[#0a9748]" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(student)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0269ae] dark:text-[#43b5e9] hover:bg-[#0269ae]/10 dark:hover:bg-[#0269ae]/20 transition-colors"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.total > 0 && (
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs">
          <div className="flex items-center gap-3 text-zinc-500">
            <span>
              Showing{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {students.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {(pagination.page - 1) * pagination.limit + students.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {pagination.total}
              </span>{' '}
              students
            </span>

            {/* Page Size Selector */}
            {onLimitChange && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] text-zinc-400">Rows:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
                  aria-label="Items per page"
                  className="px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-mono hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              UUIDv7 Cursor
            </span>

            <button
              type="button"
              disabled={pagination.hasPrevPage === false && pagination.page <= 1}
              onClick={() => {
                if (onPrevPage) onPrevPage();
                else if (onPageChange) onPageChange(pagination.page - 1);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-xs"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="px-2.5 font-semibold text-zinc-800 dark:text-zinc-200">
              Page {pagination.page}
              {pagination.totalPages > 1 ? ` of ${pagination.totalPages}` : ''}
            </span>

            <button
              type="button"
              disabled={pagination.hasNextPage === false || (pagination.totalPages > 0 && pagination.page >= pagination.totalPages)}
              onClick={() => {
                if (onNextPage) onNextPage();
                else if (onPageChange) onPageChange(pagination.page + 1);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-xs"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
