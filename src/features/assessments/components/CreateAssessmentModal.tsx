'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/shared';
import { useProgrammes } from '@/features/enrolment';
import { useCreateAssessment } from '../hooks/useAssessments';
import { Loader2, AlertCircle } from 'lucide-react';

function getDefaultDeadline(): string {
  const defaultDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
  return defaultDate.toISOString().slice(0, 16);
}

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: programmesData, isLoading: isLoadingProgrammes } = useProgrammes();
  const createMutation = useCreateAssessment();

  const [programmeId, setProgrammeId] = useState('');
  const [module, setModule] = useState('');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(getDefaultDeadline);
  const [formError, setFormError] = useState<string | null>(null);

  const programmes = programmesData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!programmeId) {
      setFormError('Please select a degree programme.');
      return;
    }

    if (!module.trim()) {
      setFormError('Please enter a module name or code (e.g. CS101 - Algorithms).');
      return;
    }

    if (!title.trim()) {
      setFormError('Please enter an assessment title (e.g. Coursework 1: Implementation).');
      return;
    }

    if (!deadline) {
      setFormError('Please specify a submission deadline.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        programmeId,
        module: module.trim(),
        title: title.trim(),
        deadline: new Date(deadline).toISOString(),
      });

      // Reset and close
      setProgrammeId('');
      setModule('');
      setTitle('');
      setDeadline('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish assessment.';
      setFormError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Module Assessment"
      description="Configure and publish an assessment deliverable with a strict submission deadline for enrolled students."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Programme Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Degree Programme <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={programmeId}
              onChange={(e) => setProgrammeId(e.target.value)}
              disabled={isLoadingProgrammes || createMutation.isPending}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
            >
              <option value="">Select degree programme...</option>
              {programmes.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.code} — {prog.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Module Code & Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Module Code & Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. CS101 - Algorithms & Data Structures"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Assessment Title */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Assessment Deliverable Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Coursework 1: Algorithm Complexity Analysis"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={createMutation.isPending}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Submission Deadline */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Submission Deadline <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Submissions uploaded after this deadline will be permanently flagged with a late tag in the registry.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0269ae] hover:bg-[#01538c] shadow-xs transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing Assessment...</span>
              </>
            ) : (
              <span>Publish Assessment</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
