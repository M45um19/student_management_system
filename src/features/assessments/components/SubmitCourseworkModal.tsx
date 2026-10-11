'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/shared';
import { useSubmitCoursework } from '../hooks/useAssessments';
import {
  calculateDeadlineStatus,
  formatSubmissionDate,
  isAllowedFileType,
  formatFileSize,
  MAX_FILE_SIZE_BYTES,
} from '../utils/assessmentCalculations';
import { AssessmentRecord } from '../types';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Loader2,
  Clock,
} from 'lucide-react';

interface SubmitCourseworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentRecord | null;
  onSuccess?: () => void;
}

export const SubmitCourseworkModal: React.FC<SubmitCourseworkModalProps> = ({
  isOpen,
  onClose,
  assessment,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitMutation = useSubmitCoursework();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!assessment) return null;

  const deadlineStatus = calculateDeadlineStatus(assessment.deadline);
  const existingSubmission = assessment.mySubmission;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    if (!isAllowedFileType(file.name)) {
      setErrorMessage(
        'Invalid file type. Please upload a PDF (.pdf) or Word document (.docx, .doc).'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 20MB limit. Please compress your document.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please choose a file to submit.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      await submitMutation.mutateAsync({
        assessmentId: assessment.id,
        payload: formData,
      });

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingSubmission ? 'Resubmit Coursework Deliverable' : 'Submit Coursework Deliverable'}
      description={`${assessment.module} • ${assessment.title}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Deadline Status Banner */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span>
              Deadline: <strong className="text-zinc-900 dark:text-zinc-100">{deadlineStatus.formattedDeadline}</strong>
            </span>
          </div>
          <span
            className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
              deadlineStatus.isPastDeadline
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : deadlineStatus.isDueSoon
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {deadlineStatus.relativeTime}
          </span>
        </div>

        {/* Late Warning Notice */}
        {deadlineStatus.isPastDeadline && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <strong className="block font-semibold">Late Submission Notice</strong>
              The deadline for this assessment has passed. Your submission will still be accepted, but it will be permanently recorded in the Registry with a <strong>LATE</strong> submission flag.
            </div>
          </div>
        )}

        {/* Existing Submission Resubmission Notice */}
        {existingSubmission && (
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <strong className="block font-semibold">Previous Submission on File</strong>
              You previously submitted <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-[11px]">{existingSubmission.fileName}</code> on {formatSubmissionDate(existingSubmission.submittedAt)}. Submitting a new deliverable will overwrite your previous file.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* File Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#0a9748] bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0a9748]/10 dark:bg-[#0a9748]/20 text-[#0a9748] dark:text-[#22c55e] flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Click to browse or drag and drop your deliverable
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Accepted formats: PDF (.pdf) or Word (.docx, .doc) — Max size 20MB
              </p>
            </div>
          </div>
        </div>

        {/* Selected File Card */}
        {selectedFile && (
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-[#0a9748] dark:text-[#22c55e] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitMutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedFile || submitMutation.isPending}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 ${
              deadlineStatus.isPastDeadline
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#0a9748] hover:bg-[#087d3c]'
            }`}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading Deliverable...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {deadlineStatus.isPastDeadline
                    ? 'Submit Late Deliverable'
                    : existingSubmission
                    ? 'Confirm Resubmission'
                    : 'Submit Coursework'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
