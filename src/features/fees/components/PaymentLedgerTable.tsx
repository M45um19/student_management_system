'use client';

import React from 'react';
import { 
  CreditCard, 
  Search, 
  Receipt, 
  Loader2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { formatGBP } from '../utils/feeCalculations';
import { PaymentRecord, PaymentPaginationMeta } from '../types';

interface PaymentLedgerTableProps {
  payments: PaymentRecord[];
  isLoading: boolean;
  pagination: PaymentPaginationMeta;
  onPageChange?: (newPage: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onLimitChange: (newLimit: number) => void;
  onViewReceipt: (payment: PaymentRecord) => void;
  onOpenRecordModal?: () => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export const PaymentLedgerTable: React.FC<PaymentLedgerTableProps> = ({
  payments,
  isLoading,
  pagination,
  onPageChange,
  onNextPage,
  onPrevPage,
  onLimitChange,
  onViewReceipt,
  onOpenRecordModal,
  search,
  onSearchChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Search Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions by reference no, student name, or ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <span>Total Records:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
            {pagination.total}
          </span>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Reference No</th>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-5 py-3.5">Programme</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Amount Received</th>
                <th className="px-5 py-3.5">Authorized By</th>
                <th className="px-5 py-3.5 text-center">Receipt</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0269ae]" />
                    <span>Loading payment transactions...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                      No payment transactions found
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {search
                        ? 'Try clearing or modifying your search query.'
                        : 'No payments have been logged into the registry yet.'}
                    </p>
                    {onOpenRecordModal && !search && (
                      <button
                        type="button"
                        onClick={onOpenRecordModal}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0269ae] text-white hover:bg-[#015289] transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record First Payment</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const student = p.student;
                  const formattedDate = new Date(p.paymentDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Reference No */}
                      <td className="px-5 py-3.5 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                          {p.referenceNo}
                        </span>
                      </td>

                      {/* Student Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {student?.fullName || 'Student'}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {student?.studentId} • {student?.email}
                        </div>
                      </td>

                      {/* Programme */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                          {student?.programme?.name || 'N/A'}
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {student?.programme?.code}
                        </span>
                      </td>

                      {/* Payment Date */}
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 text-right font-extrabold text-[#0a9748] dark:text-[#22c55e] whitespace-nowrap text-sm">
                        {formatGBP(p.amount)}
                      </td>

                      {/* Recorded By */}
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                          {p.recordedBy?.fullName || 'Registry Staff'}
                        </div>
                        {p.recordedBy?.staffId && (
                          <div className="font-mono text-[10px] text-zinc-400">
                            {p.recordedBy.staffId}
                          </div>
                        )}
                      </td>

                      {/* Receipt Action */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#0269ae]" />
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

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">
                Showing Page <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.page}</span>
                {pagination.totalPages > 1 ? ` of ${pagination.totalPages}` : ''}
              </span>
              <span className="text-zinc-400">
                ({pagination.total} transaction{pagination.total === 1 ? '' : 's'})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <span>Per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0269ae]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <span className="text-[10px] text-zinc-400 font-mono hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                UUIDv7 Cursor
              </span>

              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => {
                  if (onPrevPage) onPrevPage();
                  else if (onPageChange) onPageChange(pagination.page - 1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => {
                  if (onNextPage) onNextPage();
                  else if (onPageChange) onPageChange(pagination.page + 1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLedgerTable;
