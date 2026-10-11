'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Hash, 
  User, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Search
} from 'lucide-react';
import { Modal } from '@/components/shared';
import { useRecordPayment, useStudentFees } from '../hooks/useFees';
import { useStudents } from '@/features/enrolment/hooks/useEnrolment';
import { formatGBP, generateReferenceNumber } from '../utils/feeCalculations';
import { RecordPaymentInput, recordPaymentFormSchema, RecordPaymentResult } from '../types';

interface PreselectedStudentInfo {
  id: string;
  studentId: string;
  fullName: string;
  balance?: number;
  tuitionFee?: number;
}

interface RecordPaymentFormProps {
  preselectedStudent?: PreselectedStudentInfo | null;
  onClose: () => void;
  onSuccess?: (result: RecordPaymentResult) => void;
}

const RecordPaymentForm: React.FC<RecordPaymentFormProps> = ({
  preselectedStudent,
  onClose,
  onSuccess,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || ''
  );
  const [searchStudentTerm, setSearchStudentTerm] = useState<string>('');
  const [amount, setAmount] = useState<string>(
    preselectedStudent?.balance && preselectedStudent.balance > 0
      ? preselectedStudent.balance.toString()
      : ''
  );
  const [referenceNo, setReferenceNo] = useState<string>(generateReferenceNumber());
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Queries & Mutations
  const { mutateAsync: recordPayment, isPending: isSubmitting } = useRecordPayment();

  // Search students for selector
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    search: searchStudentTerm,
    limit: 10,
  });

  // Query real-time fees for currently chosen student
  const { data: studentFeeData } = useStudentFees(
    selectedStudentId || undefined
  );

  const studentsList = studentsData?.data ?? [];
  const activeStudentLedger = studentFeeData?.data;

  const handleRegenerateRef = () => {
    setReferenceNo(generateReferenceNumber());
  };

  const handleApplyPreset = (value: number) => {
    setAmount(value.toString());
  };

  const handleSelectCandidate = (std: { id: string }) => {
    setSelectedStudentId(std.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than £0.');
      return;
    }

    if (!selectedStudentId) {
      setErrorMessage('Please select a student to record this payment against.');
      return;
    }

    const payload: RecordPaymentInput = {
      studentId: selectedStudentId,
      amount: parsedAmount,
      referenceNo: referenceNo.trim(),
      paymentDate: paymentDate || undefined,
    };

    const validation = recordPaymentFormSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Invalid payment details.');
      return;
    }

    try {
      const response = await recordPayment(payload);
      setSuccessInfo(`Payment of ${formatGBP(parsedAmount)} recorded successfully!`);

      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess(response.data);
        }
      }, 900);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || 'Failed to record payment. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successInfo && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successInfo}</span>
        </div>
      )}

      {/* Student Selector Section */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Student Profile <span className="text-rose-500">*</span>
        </label>

        {preselectedStudent ? (
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0269ae]/10 dark:bg-[#0269ae]/20 text-[#0269ae] dark:text-[#43b5e9] flex items-center justify-center font-bold text-xs">
                {preselectedStudent.fullName.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {preselectedStudent.fullName}
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  {preselectedStudent.studentId}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              Selected
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name, SMS ID or email..."
                value={searchStudentTerm}
                onChange={(e) => setSearchStudentTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {isLoadingStudents ? (
              <div className="p-3 text-center text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-1 text-[#0269ae]" />
                Searching student directory...
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-900">
                {studentsList.map((std) => (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() => handleSelectCandidate(std)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left ${
                      selectedStudentId === std.id
                        ? 'bg-[#0269ae]/10 text-[#0269ae] font-semibold border border-[#0269ae]/30'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{std.fullName}</span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        ({std.studentId})
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                      {std.programme?.code}
                    </span>
                  </button>
                ))}
                {studentsList.length === 0 && (
                  <div className="p-3 text-center text-xs text-zinc-400">
                    No matching students located.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Real-time Ledger Preview */}
        {activeStudentLedger && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs">
            <div className="flex items-center justify-between font-semibold text-blue-900 dark:text-blue-200 mb-1">
              <span>Tuition Fee Liability:</span>
              <span>{formatGBP(activeStudentLedger.tuitionFee)}</span>
            </div>
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 text-[11px] mb-1">
              <span>Previously Settled:</span>
              <span>{formatGBP(activeStudentLedger.totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-300 pt-1 border-t border-blue-200/50 dark:border-blue-900/50">
              <span>Current Outstanding Balance:</span>
              <span>{formatGBP(activeStudentLedger.balance)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Amount Input & Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Payment Amount (£) <span className="text-rose-500">*</span>
          </label>
          {activeStudentLedger && activeStudentLedger.balance > 0 && (
            <span className="text-[11px] text-zinc-500">
              Outstanding: {formatGBP(activeStudentLedger.balance)}
            </span>
          )}
        </div>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">
            £
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="1000000"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Quick preset chips */}
        {activeStudentLedger && activeStudentLedger.balance > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleApplyPreset(activeStudentLedger.balance)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Full Balance ({formatGBP(activeStudentLedger.balance)})
            </button>
            {activeStudentLedger.balance > 1000 && (
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(Math.round(activeStudentLedger.balance / 2))
                }
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                50% Installment ({formatGBP(Math.round(activeStudentLedger.balance / 2))})
              </button>
            )}
            <button
              type="button"
              onClick={() => handleApplyPreset(1000)}
              className="px-2 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              £1,000
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(500)}
              className="px-2 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              £500
            </button>
          </div>
        )}
      </div>

      {/* Reference Number & Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reference Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Reference Number <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleRegenerateRef}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0269ae] dark:text-[#43b5e9] hover:underline"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Regenerate</span>
            </button>
          </div>
          <div className="relative">
            <Hash className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="PAY-2025-XXXXX"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs font-mono font-semibold uppercase bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Payment Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Transaction Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Modal Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedStudentId}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#0269ae] hover:bg-[#015289] text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Recording Payment...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-3.5 h-3.5" />
              <span>Confirm & Post Payment</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudent?: PreselectedStudentInfo | null;
  onSuccess?: (payment: RecordPaymentResult) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedStudent,
  onSuccess,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment Transaction"
      description="Post an official payment receipt into the institutional ledger and reconcile outstanding balance."
      maxWidth="lg"
    >
      {isOpen && (
        <RecordPaymentForm
          key={preselectedStudent?.id || 'new'}
          preselectedStudent={preselectedStudent}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
};

export default RecordPaymentModal;
