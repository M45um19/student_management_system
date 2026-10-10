'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  GraduationCap, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Modal } from '@/components/shared';
import { StatusBadge } from './StatusBadge';
import { useStudent, useUpdateStudentStatus } from '../hooks/useEnrolment';
import { EnrolmentStatusType } from '../types';

interface StudentDetailModalProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  isOpen,
  onClose,
}) => {
  const { data, isLoading } = useStudent(studentId || undefined);
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateStudentStatus();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const student = data?.data ?? null;

  const handleStatusChange = async (status: EnrolmentStatusType) => {
    if (!student) return;
    setStatusMenuOpen(false);
    await updateStatus({ id: student.id, status });
  };

  const statusOptions: { value: EnrolmentStatusType; label: string }[] = [
    { value: 'ENROLLED', label: 'Enrolled' },
    { value: 'DEFERRED', label: 'Deferred' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? `${student.fullName}` : 'Student Profile'}
      description={student ? `Official Registry Record • ${student.studentId}` : 'Loading profile...'}
      maxWidth="xl"
    >
      {isLoading || !student ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0269ae]" />
          <p className="text-xs text-zinc-500">Loading student registry details...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Profile Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0269ae] to-[#0a9748] text-white font-bold text-base flex items-center justify-center shadow-xs">
                {student.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {student.fullName}
                  </h4>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold">
                    {student.studentId}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {student.email}
                </div>
              </div>
            </div>

            {/* Lifecycle Status Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="inline-flex items-center gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors"
              >
                <StatusBadge status={student.status} size="md" />
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mr-1" />
              </button>

              {statusMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setStatusMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 z-30">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700 mb-1">
                      Transition Lifecycle
                    </div>
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(opt.value)}
                        className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition-colors ${
                          student.status === opt.value
                            ? 'bg-zinc-100 dark:bg-zinc-700 font-semibold text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {student.status === opt.value && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0a9748]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Info */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <BookOpen className="w-4 h-4 text-[#0269ae]" />
                <span>Academic Curriculum</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Degree Programme:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                    {student.programme?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Programme Code:</span>
                  <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                    {student.programme?.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Academic Year:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {student.academicYear}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Date of Birth:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {new Date(student.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Status */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <CreditCard className="w-4 h-4 text-[#0a9748]" />
                <span>Fees & Tuition Ledger</span>
              </div>
              {student.financialSummary ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Programme Tuition Fee:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      £{student.financialSummary.tuitionFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Amount Paid:</span>
                    <span className="font-semibold text-[#0a9748] dark:text-[#22c55e]">
                      £{student.financialSummary.totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Outstanding Balance:</span>
                    <span
                      className={`font-bold ${
                        student.financialSummary.balance > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-[#0a9748] dark:text-[#22c55e]'
                      }`}
                    >
                      £{student.financialSummary.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500">Ledger Status:</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        student.financialSummary.balance === 0
                          ? 'bg-[#0a9748]/10 text-[#0a9748]'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                      }`}
                    >
                      {student.financialSummary.balance === 0 ? 'Settled' : 'Payment Overdue'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500">No payment records located.</div>
              )}
            </div>
          </div>

          {/* Activity Metrics Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 text-center">
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {student._count?.payments ?? 0}
              </div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Payments Logged
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {student._count?.submissions ?? 0}
              </div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Submissions
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {student._count?.grades ?? 0}
              </div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Grades Awarded
              </div>
            </div>
          </div>

          {/* Close Action */}
          <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StudentDetailModal;
