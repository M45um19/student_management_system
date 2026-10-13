'use client';

import React from 'react';
import { Modal } from '@/components/shared';
import { useStudentMarksheet } from '../hooks/useMarksheet';
import { StudentMarksheetView } from './StudentMarksheetView';
import { Loader2, AlertCircle } from 'lucide-react';

interface StudentMarksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
}

export const StudentMarksheetModal: React.FC<StudentMarksheetModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
}) => {
  const { data, isLoading, error } = useStudentMarksheet(isOpen ? studentId : undefined);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentName ? `Official Marksheet — ${studentName}` : 'Official Student Marksheet'}
      description="Registry Board marksheet inspection, cumulative GPA standing, and module results."
      maxWidth="2xl"
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0269ae]" />
            <span className="text-xs font-medium">Loading official marksheet record...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">
                Failed to load student marksheet
              </h4>
              <p className="mt-1">{error.message}</p>
            </div>
          </div>
        ) : data?.data ? (
          <StudentMarksheetView marksheet={data.data} isStaffInspection />
        ) : null}
      </div>
    </Modal>
  );
};
