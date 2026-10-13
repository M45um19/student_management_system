'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/shared';
import { useAwardGrade } from '../hooks/useMarksheet';
import { calculateClassification, getClassificationBadgeProps } from '../utils/gradeCalculations';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface StudentInfo {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  programmeName?: string;
}

interface AssessmentInfo {
  id: string;
  title: string;
  module: string;
  deadline?: string;
}

interface SubmissionInfo {
  id: string;
  fileName: string;
  fileUrl: string;
  submittedAt: string;
  isLate: boolean;
}

interface ExistingGradeInfo {
  id: string;
  numericGrade: number;
  classification: string;
  isPublished: boolean;
}

interface AwardGradeFormProps {
  student: StudentInfo;
  assessment: AssessmentInfo;
  submission?: SubmissionInfo | null;
  existingGrade?: ExistingGradeInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const AwardGradeForm: React.FC<AwardGradeFormProps> = ({
  student,
  assessment,
  submission,
  existingGrade,
  onClose,
  onSuccess,
}) => {
  const initialGrade = existingGrade ? existingGrade.numericGrade : 65;
  const [numericGrade, setNumericGrade] = useState<number>(initialGrade);
  const [gradeInputStr, setGradeInputStr] = useState<string>(initialGrade.toString());
  const [isPublished, setIsPublished] = useState<boolean>(
    existingGrade ? existingGrade.isPublished : false
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const awardGradeMutation = useAwardGrade();

  const handleInputChange = (valStr: string) => {
    setGradeInputStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setNumericGrade(parsed);
      setErrorMsg(null);
    } else if (valStr === '') {
      setErrorMsg('Please enter a grade between 0 and 100');
    } else {
      setErrorMsg('Grade must be between 0 and 100');
    }
  };

  const handleSliderChange = (val: number) => {
    setNumericGrade(val);
    setGradeInputStr(val.toString());
    setErrorMsg(null);
  };

  const currentClassification = calculateClassification(numericGrade);
  const badgeProps = getClassificationBadgeProps(currentClassification);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericGrade < 0 || numericGrade > 100 || isNaN(numericGrade)) {
      setErrorMsg('Grade must be between 0 and 100.');
      return;
    }

    try {
      await awardGradeMutation.mutateAsync({
        assessmentId: assessment.id,
        studentId: student.id,
        numericGrade: Math.round(numericGrade * 10) / 10,
        isPublished,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj.message || 'Failed to record grade. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header context card */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Student
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {student.fullName}
            </h4>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              {student.studentId} • {student.email}
            </p>
          </div>
          <div className="text-right max-w-[200px]">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Module / Assessment
            </span>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              {assessment.module}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {assessment.title}
            </p>
          </div>
        </div>

        {/* Submission Deliverable Context */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Coursework Deliverable:</span>
          {submission ? (
            <div className="flex items-center gap-2">
              {submission.isLate ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Late Submission
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  On-Time
                </span>
              )}
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#0269ae] dark:text-[#43b5e9] hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[140px]">{submission.fileName}</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-medium italic">
              No deliverable uploaded
            </span>
          )}
        </div>
      </div>

      {/* Numeric Grade Input & Dynamic Classification Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="numericGradeInput"
            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
          >
            Numeric Mark (0 – 100)
          </label>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>Standard:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">UK Higher Ed</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Input field */}
          <div className="relative">
            <input
              id="numericGradeInput"
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={gradeInputStr}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full text-2xl font-black py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae] shadow-xs"
              placeholder="0 - 100"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
              / 100
            </span>
          </div>

          {/* Dynamic Classification Badge Box */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-center transition-all ${badgeProps.badgeClass}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                UK Classification
              </span>
              <span className="text-xs font-black">{currentClassification}</span>
            </div>
            <p className="mt-1 text-[11px] opacity-90 leading-tight">
              {currentClassification === 'Distinction'
                ? 'First Class Standard (≥70%)'
                : currentClassification === 'Merit'
                ? 'Upper Second 2:1 Standard (60–69%)'
                : currentClassification === 'Pass'
                ? 'Third Class Standard (40–59%)'
                : 'Fail standard (<40%) • Resit required'}
            </p>
          </div>
        </div>

        {/* Interactive Range Slider */}
        <div className="pt-2">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={numericGrade}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            className="w-full accent-[#0269ae] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-0.5">
            <span>0 (Fail)</span>
            <span>40 (Pass)</span>
            <span>60 (Merit)</span>
            <span>70 (Distinction)</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Publication Control Gating */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/70">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-zinc-300 text-[#0269ae] focus:ring-[#0269ae]"
          />
          <div className="text-xs">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0a9748]" />
              Publish result to Student Marksheet immediately
            </span>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {isPublished ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  This mark will be visible to the student immediately upon saving.
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Strictly gated: Mark will remain hidden in draft moderation until published by the Registry Board.
                </span>
              )}
            </p>
          </div>
        </label>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={awardGradeMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0269ae] to-[#014d82] hover:opacity-95 shadow-md shadow-[#0269ae]/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {awardGradeMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Recording Grade...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{existingGrade ? 'Update Grade' : 'Save Grade'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

interface AwardGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentInfo;
  assessment: AssessmentInfo;
  submission?: SubmissionInfo | null;
  existingGrade?: ExistingGradeInfo | null;
  onSuccess?: () => void;
}

export const AwardGradeModal: React.FC<AwardGradeModalProps> = ({
  isOpen,
  onClose,
  student,
  assessment,
  submission,
  existingGrade,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingGrade ? 'Edit Awarded Grade' : 'Award & Record Coursework Mark'}
      description="Record numeric mark (0-100), compute UK university classification, and set publication visibility."
      maxWidth="lg"
    >
      <AwardGradeForm
        student={student}
        assessment={assessment}
        submission={submission}
        existingGrade={existingGrade}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
};
