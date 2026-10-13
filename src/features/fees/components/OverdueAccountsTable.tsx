'use client';

import React from 'react';
import { 
  AlertTriangle, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatGBP, getUrgencyBadge } from '../utils/feeCalculations';
import { OverdueStudent, OverdueFilterParams, CursorPaginationMeta } from '../types';

interface OverdueAccountsTableProps {
  overdueStudents: OverdueStudent[];
  isLoading: boolean;
  filters: OverdueFilterParams;
  onFilterChange: (filters: Partial<OverdueFilterParams>) => void;
  onRecordPaymentForStudent: (student: OverdueStudent) => void;
  totalOutstanding: number;
  pagination?: CursorPaginationMeta;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onPageChange?: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
}

export const OverdueAccountsTable: React.FC<OverdueAccountsTableProps> = ({
  overdueStudents,
  isLoading,
  filters,
  onFilterChange,
  onRecordPaymentForStudent,
  totalOutstanding,
  pagination,
  onNextPage,
  onPrevPage,
  onPageChange,
  onLimitChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Alert Header Bar */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Active Registry Debt Tracking
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {overdueStudents.length} student accounts have outstanding tuition balances requiring settlement.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
            Aggregated Outstanding Debt
          </span>
          <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatGBP(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search overdue students by name or SMS ID..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Sort by:</span>
          <select
            value={filters.sortBy || 'balance'}
            onChange={(e) =>
              onFilterChange({ sortBy: e.target.value as 'balance' | 'name' | 'studentId' })
            }
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#0269ae]"
          >
            <option value="balance">Highest Balance First</option>
            <option value="name">Student Name</option>
            <option value="studentId">Student ID</option>
          </select>
        </div>
      </div>

      {/* Overdue Accounts Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Urgency Level</th>
                <th className="px-5 py-3.5">Student Profile</th>
                <th className="px-5 py-3.5">Degree Programme</th>
                <th className="px-5 py-3.5 text-right">Tuition Fee</th>
                <th className="px-5 py-3.5 text-right">Settled Amount</th>
                <th className="px-5 py-3.5 text-right">Outstanding Debt</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0269ae]" />
                    <span>Analyzing ledger balance discrepancies...</span>
                  </td>
                </tr>
              ) : overdueStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      All Student Accounts Settled
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      {filters.search
                        ? 'No overdue accounts match your active search filter.'
                        : 'There are currently zero outstanding fee balances across all student classes.'}
                    </p>
                  </td>
                </tr>
              ) : (
                overdueStudents.map((std) => {
                  const urgencyBadge = getUrgencyBadge(std.urgency);
                  const percentPaid =
                    std.tuitionFee > 0
                      ? Math.round((std.totalPaid / std.tuitionFee) * 100)
                      : 0;

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Urgency Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${urgencyBadge.bg} ${urgencyBadge.text} ${urgencyBadge.border}`}
                        >
                          {urgencyBadge.label}
                        </span>
                      </td>

                      {/* Student Profile */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {std.fullName}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {std.studentId} • {std.email}
                        </div>
                      </td>

                      {/* Programme */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[170px]">
                          {std.programme?.name || 'Programme'}
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {std.programme?.code}
                        </span>
                      </td>

                      {/* Tuition Fee */}
                      <td className="px-5 py-3.5 text-right font-medium text-zinc-800 dark:text-zinc-200">
                        {formatGBP(std.tuitionFee)}
                      </td>

                      {/* Settled Amount with Progress Bar */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatGBP(std.totalPaid)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {percentPaid}% cleared
                        </div>
                      </td>

                      {/* Outstanding Debt */}
                      <td className="px-5 py-3.5 text-right font-extrabold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                        {formatGBP(std.balance)}
                      </td>

                      {/* Quick Record Action */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onRecordPaymentForStudent(std)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0269ae] hover:bg-[#015289] text-white shadow-xs transition-all active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
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
        {pagination && pagination.total > 0 && (
          <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">
                Showing Page <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.page}</span>
                {pagination.totalPages > 1 ? ` of ${pagination.totalPages}` : ''}
              </span>
              <span className="text-zinc-400">
                ({pagination.total} account{pagination.total === 1 ? '' : 's'})
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onLimitChange && (
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
              )}

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

export default OverdueAccountsTable;
