'use client';

import React, { useState } from 'react';
import { 
  UserPlus, 
  Mail, 
  Calendar, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Modal } from '@/components/shared';
import { Programme, EnrolmentStatusType } from '../types';
import { useCreateStudent } from '../hooks/useEnrolment';

interface EnrolStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  programmes: Programme[];
  onSuccess?: () => void;
}

export const EnrolStudentModal: React.FC<EnrolStudentModalProps> = ({
  isOpen,
  onClose,
  programmes,
  onSuccess,
}) => {
  const { mutateAsync: createStudent, isPending, error } = useCreateStudent();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id || '');
  const [status, setStatus] = useState<EnrolmentStatusType>('ENROLLED');
  const [createAccount, setCreateAccount] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Derive preview year for Student ID
  const targetYear = academicYear.match(/20\d{2}/g)?.slice(-1)[0] || '2025';
  const selectedProgramme = programmes.find((p) => p.id === programmeId);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setDateOfBirth('');
    setAcademicYear('2024/2025');
    setProgrammeId(programmes[0]?.id || '');
    setStatus('ENROLLED');
    setCreateAccount(true);
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

    if (!programmeId) {
      setFormError('Please select a degree programme.');
      return;
    }

    try {
      const result = await createStudent({
        fullName,
        email,
        dateOfBirth,
        academicYear,
        programmeId,
        status,
        createAccount,
      });

      setSuccessMsg(`Student enrolled successfully with ID ${result.data?.studentId || ''}!`);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1400);
    } catch (err: any) {
      setFormError(err.message || 'Failed to enrol student.');
    }
  };

  const displayError = formError || error?.message;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enrol New Student"
      description="Register a new student into the university registry and configure their curriculum."
      maxWidth="lg"
    >
      {successMsg ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#0a9748]/15 text-[#0a9748] dark:text-[#22c55e] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Enrolment Confirmed
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

          {/* Student ID Preview Banner */}
          <div className="p-3 rounded-xl bg-[#0269ae]/10 dark:bg-[#0269ae]/20 border border-[#0269ae]/30 text-xs flex items-center justify-between text-[#0269ae] dark:text-[#43b5e9]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Auto-Generated Student ID:</span>
            </div>
            <span className="font-mono font-bold text-sm bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-[#0269ae]/30">
              SMS-{targetYear}-XXXX
            </span>
          </div>

          {/* Full Name */}
          <div>
            <label 
              htmlFor="enrol-fullName"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Full Legal Name
            </label>
            <input
              id="enrol-fullName"
              type="text"
              required
              placeholder="e.g. Fiona Gallagher"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
            />
          </div>

          {/* Email & Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label 
                htmlFor="enrol-email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="enrol-email"
                  type="email"
                  required
                  placeholder="fiona@sms.ac.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="enrol-dob"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  id="enrol-dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Academic Programme Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label 
                htmlFor="enrol-programme"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
              >
                Degree Programme
              </label>
              {selectedProgramme && (
                <span className="text-[11px] font-semibold text-[#0a9748] dark:text-[#22c55e]">
                  Tuition: £{selectedProgramme.tuitionFee.toLocaleString()}/yr
                </span>
              )}
            </div>
            <select
              id="enrol-programme"
              required
              value={programmeId}
              onChange={(e) => setProgrammeId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all cursor-pointer"
            >
              <option value="" disabled>
                Select academic programme...
              </option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} (£{p.tuitionFee.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year & Lifecycle Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label 
                htmlFor="enrol-academicYear"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Academic Intake Year
              </label>
              <input
                id="enrol-academicYear"
                type="text"
                required
                placeholder="e.g. 2024/2025"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label 
                htmlFor="enrol-status"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Initial Enrolment Status
              </label>
              <select
                id="enrol-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EnrolmentStatusType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="ENROLLED">Enrolled (Active)</option>
                <option value="DEFERRED">Deferred</option>
                <option value="WITHDRAWN">Withdrawn</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Account Creation Checkbox */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-start gap-3">
            <input
              id="createAccount"
              type="checkbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="mt-0.5 rounded text-[#0269ae] focus:ring-[#0269ae] cursor-pointer"
            />
            <label htmlFor="createAccount" className="text-xs cursor-pointer select-none">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                Provision Student Portal User Account
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Allows the student to log in with this email and temporary password{' '}
                <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-mono">
                  Student@12345
                </code>
              </span>
            </label>
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
                  <span>Enrolling Student...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Confirm Enrolment</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EnrolStudentModal;
