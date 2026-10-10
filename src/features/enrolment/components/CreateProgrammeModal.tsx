'use client';

import React, { useState } from 'react';
import { BookOpen, PoundSterling, Hash, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/shared';
import { useCreateProgramme } from '../hooks/useEnrolment';

interface CreateProgrammeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateProgrammeModal: React.FC<CreateProgrammeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { mutateAsync: createProgramme, isPending, error } = useCreateProgramme();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [tuitionFee, setTuitionFee] = useState('9250');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setCode('');
    setName('');
    setTuitionFee('9250');
    setFormError(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const feeNum = parseFloat(tuitionFee);
    if (isNaN(feeNum) || feeNum < 0) {
      setFormError('Please enter a valid tuition fee.');
      return;
    }

    try {
      const res = await createProgramme({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        tuitionFee: feeNum,
      });

      setSuccessMsg(`Programme '${res.data?.name || code}' configured successfully!`);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1300);
    } catch (err: any) {
      setFormError(err.message || 'Failed to establish programme.');
    }
  };

  const displayError = formError || error?.message;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Degree Programme"
      description="Configure a new degree programme and its baseline institutional tuition fee."
      maxWidth="md"
    >
      {successMsg ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#0a9748]/15 text-[#0a9748] dark:text-[#22c55e] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Programme Established
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {successMsg}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Programme Code */}
          <div>
            <label 
              htmlFor="prog-code"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Programme Code (Uppercase Identifier)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <input
                id="prog-code"
                type="text"
                required
                placeholder="e.g. SWE-BSC or AI-MSC"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 uppercase placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Unique 2 to 20-character reference identifier.</p>
          </div>

          {/* Programme Name */}
          <div>
            <label 
              htmlFor="prog-name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Degree Programme Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <input
                id="prog-name"
                type="text"
                required
                placeholder="e.g. BSc Software Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Tuition Fee */}
          <div>
            <label 
              htmlFor="prog-tuition"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Baseline Tuition Fee (£ GBP per academic year)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <PoundSterling className="w-3.5 h-3.5" />
              </div>
              <input
                id="prog-tuition"
                type="number"
                required
                min="0"
                step="50"
                placeholder="9250"
                value={tuitionFee}
                onChange={(e) => setTuitionFee(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Automatically applied to newly enrolled students.</p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0269ae] hover:bg-[#015289] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Establishing...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Establish Programme</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CreateProgrammeModal;
