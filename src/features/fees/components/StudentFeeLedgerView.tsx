'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  Printer, 
  Loader2, 
  Plus 
} from 'lucide-react';
import { formatGBP, getPaymentStatusBadge } from '../utils/feeCalculations';
import { StudentFeeLedger, PaymentRecord } from '../types';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface StudentFeeLedgerViewProps {
  ledger: StudentFeeLedger | null;
  isLoading: boolean;
  onOpenRecordPayment?: () => void;
  isStaff?: boolean;
}

export const StudentFeeLedgerView: React.FC<StudentFeeLedgerViewProps> = ({
  ledger,
  isLoading,
  onOpenRecordPayment,
  isStaff = false,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  if (isLoading || !ledger) {
    return (
      <div className="py-16 text-center text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0269ae]" />
        <p className="text-xs font-semibold">Loading official fee ledger statement...</p>
      </div>
    );
  }

  const { student, programme, tuitionFee, totalPaid, balance, paymentStatus, payments } = ledger;
  const statusBadge = getPaymentStatusBadge(paymentStatus);
  const percentPaid = tuitionFee > 0 ? Math.min(100, Math.round((totalPaid / tuitionFee) * 100)) : 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Payer Summary & Financial Status Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
        {/* Top Identification Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0269ae] to-[#0a9748] text-white font-bold text-base flex items-center justify-center shadow-xs">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {student.fullName}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold">
                  {student.studentId}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {programme?.name} ({programme?.code}) • Cohort: {student.academicYear || 'Current'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              <span>{statusBadge.label}</span>
            </span>

            {isStaff && onOpenRecordPayment && (
              <button
                type="button"
                onClick={onOpenRecordPayment}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0269ae] hover:bg-[#015289] text-white shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Total Programme Tuition Fee
            </span>
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 block">
              {formatGBP(tuitionFee)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Total Amount Settled
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 block">
              {formatGBP(totalPaid)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
              Current Outstanding Balance
            </span>
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-1 block">
              {formatGBP(balance)}
            </span>
          </div>
        </div>

        {/* Progress Bar of Tuition Paid */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-zinc-600 dark:text-zinc-400">Tuition Settlement Progress</span>
            <span className="text-zinc-900 dark:text-zinc-100">{percentPaid}% Cleared</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentPaid === 100
                  ? 'bg-emerald-500'
                  : percentPaid >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${percentPaid}%` }}
            />
          </div>
        </div>
      </div>

      {/* Transaction History Sub-Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Payment Transactions Audit Trail
            </h4>
            <p className="text-xs text-zinc-500">
              All validated payments credited to this student&apos;s account.
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {payments.length} Payments Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Reference No</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Recorded By</th>
                <th className="px-4 py-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                    No payment transactions recorded for this student yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const dateStr = new Date(p.paymentDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {p.referenceNo}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{dateStr}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatGBP(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {p.recordedBy?.fullName || 'Registry Staff'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReceipt({
                              ...p,
                              student,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <Receipt className="w-3 h-3 text-[#0269ae]" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal Drawer */}
      <PaymentReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};

export default StudentFeeLedgerView;
