'use client';

import React from 'react';
import Image from 'next/image';
import { 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  User 
} from 'lucide-react';
import { Modal } from '@/components/shared';
import { formatGBP } from '../utils/feeCalculations';
import { PaymentRecord } from '../types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  if (!payment) return null;

  const student = payment.student;
  const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt"
      description="Registry & Finance Bursar confirmation document"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Electronic Voucher Shell */}
        <div 
          id="payment-receipt-content"
          className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6"
        >
          {/* Header with Logo & Institution Stamp */}
          <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="SMS Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                  SMS Academic Registry
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Finance & Student Fees Ledger Office
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>OFFICIAL RECEIPT</span>
              </span>
              <div className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                {payment.referenceNo}
              </div>
            </div>
          </div>

          {/* Amount Hero Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-50 via-blue-50/40 to-zinc-50 dark:from-zinc-800/60 dark:via-blue-950/20 dark:to-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Total Payment Received
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {formatGBP(payment.amount)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Student Info */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700/60 pb-1.5">
                <User className="w-3.5 h-3.5 text-[#0269ae]" />
                <span>Payer Information</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Student Name:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {student?.fullName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Student ID:</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                  {student?.studentId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email:</span>
                <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                  {student?.email || 'N/A'}
                </span>
              </div>
            </div>

            {/* Academic & Transaction Info */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700/60 pb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0a9748]" />
                <span>Transaction Particulars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Date:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formattedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Degree Programme:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right truncate max-w-[150px]">
                  {student?.programme?.name || 'Academic Degree'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Authorized By:</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {payment.recordedBy?.fullName || 'Registry Administrator'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Footer Note */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 leading-relaxed text-center">
            This electronic voucher serves as verified institutional proof of payment for the Student Management System. 
            All transactions are digitally logged into PostgreSQL ledger audit tables.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentReceiptModal;
