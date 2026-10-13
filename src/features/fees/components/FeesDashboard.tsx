'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Search, 
  User 
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/shared';
import { usePayments, useOverdueFees, useStudentFees } from '../hooks/useFees';
import { useStudents } from '@/features/enrolment/hooks/useEnrolment';
import { formatGBP } from '../utils/feeCalculations';
import { PaymentRecord, OverdueStudent, PaymentFilterParams, OverdueFilterParams, RecordPaymentResult } from '../types';
import { PaymentLedgerTable } from './PaymentLedgerTable';
import { OverdueAccountsTable } from './OverdueAccountsTable';
import { RecordPaymentModal } from './RecordPaymentModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { StudentFeeLedgerView } from './StudentFeeLedgerView';

export const FeesDashboard: React.FC = () => {
  // Active Tab: 'ledger' | 'overdue' | 'lookup'
  const [activeTab, setActiveTab] = useState<'ledger' | 'overdue' | 'lookup'>('ledger');

  // Filters state
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilterParams>({
    search: '',
    page: 1,
    limit: 10,
    cursor: null,
  });

  const [overdueFilters, setOverdueFilters] = useState<OverdueFilterParams>({
    search: '',
    sortBy: 'balance',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
    cursor: null,
  });

  // Cursor history stacks for forward/backward UUIDv7 navigation
  const [paymentCursorHistory, setPaymentCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPaymentCursorIndex, setCurrentPaymentCursorIndex] = useState(0);

  const [overdueCursorHistory, setOverdueCursorHistory] = useState<(string | null)[]>([null]);
  const [currentOverdueCursorIndex, setCurrentOverdueCursorIndex] = useState(0);

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<{
    id: string;
    studentId: string;
    fullName: string;
    balance?: number;
    tuitionFee?: number;
  } | null>(null);

  const [activeReceiptPayment, setActiveReceiptPayment] = useState<PaymentRecord | null>(null);

  // Student statement lookup state
  const [lookupStudentId, setLookupStudentId] = useState<string>('');
  const [lookupSearchTerm, setLookupSearchTerm] = useState<string>('');

  // Queries
  const { 
    data: paymentsData, 
    isLoading: isLoadingPayments 
  } = usePayments(paymentFilters);

  const { 
    data: overdueData, 
    isLoading: isLoadingOverdue 
  } = useOverdueFees(overdueFilters);

  const { 
    data: studentsLookupData 
  } = useStudents({ search: lookupSearchTerm, limit: 8 });

  const { 
    data: singleStudentLedgerData, 
    isLoading: isLoadingSingleStudentLedger 
  } = useStudentFees(lookupStudentId || undefined);

  // Computed data
  const payments = paymentsData?.data ?? [];
  const paymentPagination = paymentsData?.meta?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  const overdueStudents = overdueData?.data ?? [];
  const overduePagination = overdueData?.meta?.pagination ?? {
    total: overdueData?.meta?.totalCount ?? overdueStudents.length,
    page: overdueFilters.page || 1,
    limit: overdueFilters.limit || 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  const stats = overdueData?.meta?.stats ?? {
    totalStudents: 0,
    totalOverdueStudents: 0,
    totalExpectedTuition: 0,
    totalFeesCollected: 0,
    totalOutstanding: 0,
    collectionRate: 100,
  };

  const lookupCandidates = studentsLookupData?.data ?? [];

  // Payment Cursor Handlers
  const handlePaymentFilterChange = (newFilters: Partial<PaymentFilterParams>) => {
    setPaymentCursorHistory([null]);
    setCurrentPaymentCursorIndex(0);
    setPaymentFilters((prev) => ({
      ...prev,
      ...newFilters,
      cursor: null,
      page: 1,
    }));
  };

  const handleNextPaymentPage = () => {
    if (paymentPagination.nextCursor) {
      const nextCur = paymentPagination.nextCursor;
      const nextIdx = currentPaymentCursorIndex + 1;
      setPaymentCursorHistory((prev) => {
        const updated = prev.slice(0, currentPaymentCursorIndex + 1);
        updated.push(nextCur);
        return updated;
      });
      setCurrentPaymentCursorIndex(nextIdx);
      setPaymentFilters((prev) => ({
        ...prev,
        cursor: nextCur,
        page: nextIdx + 1,
      }));
    }
  };

  const handlePrevPaymentPage = () => {
    if (currentPaymentCursorIndex > 0) {
      const prevIdx = currentPaymentCursorIndex - 1;
      const prevCur = paymentCursorHistory[prevIdx] || null;
      setCurrentPaymentCursorIndex(prevIdx);
      setPaymentFilters((prev) => ({
        ...prev,
        cursor: prevCur,
        page: prevIdx + 1,
      }));
    }
  };

  const handlePaymentLimitChange = (newLimit: number) => {
    setPaymentCursorHistory([null]);
    setCurrentPaymentCursorIndex(0);
    setPaymentFilters((prev) => ({
      ...prev,
      limit: newLimit,
      cursor: null,
      page: 1,
    }));
  };

  // Overdue Cursor Handlers
  const handleOverdueFilterChange = (newFilters: Partial<OverdueFilterParams>) => {
    setOverdueCursorHistory([null]);
    setCurrentOverdueCursorIndex(0);
    setOverdueFilters((prev) => ({
      ...prev,
      ...newFilters,
      cursor: null,
      page: 1,
    }));
  };

  const handleNextOverduePage = () => {
    if (overduePagination.nextCursor) {
      const nextCur = overduePagination.nextCursor;
      const nextIdx = currentOverdueCursorIndex + 1;
      setOverdueCursorHistory((prev) => {
        const updated = prev.slice(0, currentOverdueCursorIndex + 1);
        updated.push(nextCur);
        return updated;
      });
      setCurrentOverdueCursorIndex(nextIdx);
      setOverdueFilters((prev) => ({
        ...prev,
        cursor: nextCur,
        page: nextIdx + 1,
      }));
    }
  };

  const handlePrevOverduePage = () => {
    if (currentOverdueCursorIndex > 0) {
      const prevIdx = currentOverdueCursorIndex - 1;
      const prevCur = overdueCursorHistory[prevIdx] || null;
      setCurrentOverdueCursorIndex(prevIdx);
      setOverdueFilters((prev) => ({
        ...prev,
        cursor: prevCur,
        page: prevIdx + 1,
      }));
    }
  };

  const handleOverdueLimitChange = (newLimit: number) => {
    setOverdueCursorHistory([null]);
    setCurrentOverdueCursorIndex(0);
    setOverdueFilters((prev) => ({
      ...prev,
      limit: newLimit,
      cursor: null,
      page: 1,
    }));
  };

  // Handlers
  const handleOpenRecordPaymentForStudent = (student: OverdueStudent) => {
    setSelectedStudentForPayment({
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      balance: student.balance,
      tuitionFee: student.tuitionFee,
    });
    setIsRecordModalOpen(true);
  };

  const handleOpenGeneralRecordModal = () => {
    setSelectedStudentForPayment(null);
    setIsRecordModalOpen(true);
  };

  const handlePaymentSuccess = (result: RecordPaymentResult) => {
    if (result?.payment) {
      setActiveReceiptPayment(result.payment);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        title="Fees & Payments Ledger"
        description="Comprehensive higher education financial ledger: record verified tuition payments, calculate real-time student balances, audit institutional transactions, and resolve overdue accounts."
        badge="Module 2 • Financial Ledger"
        gradient="blue"
      >
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleOpenGeneralRecordModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#013b63] hover:bg-white/90 text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#0269ae]" />
            <span>Record Payment</span>
          </button>
        </div>
      </PageHeader>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tuition Invoiced"
          value={formatGBP(stats.totalExpectedTuition)}
          subtitle="Baseline liability across classes"
          icon={CreditCard}
          badge="Expected"
        />
        <StatCard
          title="Total Collected"
          value={formatGBP(stats.totalFeesCollected)}
          subtitle={`${stats.collectionRate}% Institutional recovery rate`}
          icon={TrendingUp}
          badge="Deposited"
        />
        <StatCard
          title="Outstanding Debt"
          value={formatGBP(stats.totalOutstanding)}
          subtitle="Total unpaid student tuition"
          icon={AlertTriangle}
          badge={stats.totalOutstanding > 0 ? 'Overdue' : 'Cleared'}
        />
        <StatCard
          title="Overdue Accounts"
          value={stats.totalOverdueStudents}
          subtitle={`Out of ${stats.totalStudents} enrolled students`}
          icon={CheckCircle2}
          badge={stats.totalOverdueStudents > 0 ? 'Alert' : 'Clear'}
        />
      </div>

      {/* Collection Rate Progress Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <span>Institutional Tuition Collection Efficiency</span>
            <span className="text-[11px] font-semibold text-zinc-400">
              ({formatGBP(stats.totalFeesCollected)} / {formatGBP(stats.totalExpectedTuition)})
            </span>
          </div>
          <span className="font-extrabold text-[#0269ae] dark:text-[#43b5e9] text-sm">
            {stats.collectionRate}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0269ae] to-[#0a9748] transition-all duration-700"
            style={{ width: `${stats.collectionRate}%` }}
          />
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          {/* Tab 1: Ledger */}
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ledger'
                ? 'bg-[#0269ae] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments Ledger</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                activeTab === 'ledger'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {paymentPagination.total}
            </span>
          </button>

          {/* Tab 2: Overdue Accounts */}
          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overdue'
                ? 'bg-[#0269ae] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue Accounts</span>
            {stats.totalOverdueStudents > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {stats.totalOverdueStudents}
              </span>
            )}
          </button>

          {/* Tab 3: Student Lookup */}
          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'lookup'
                ? 'bg-[#0269ae] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Statement Lookup</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'ledger' && (
        <PaymentLedgerTable
          payments={payments}
          isLoading={isLoadingPayments}
          pagination={paymentPagination}
          onNextPage={handleNextPaymentPage}
          onPrevPage={handlePrevPaymentPage}
          onPageChange={(page) => handlePaymentFilterChange({ page })}
          onLimitChange={handlePaymentLimitChange}
          onViewReceipt={(payment) => setActiveReceiptPayment(payment)}
          onOpenRecordModal={handleOpenGeneralRecordModal}
          search={paymentFilters.search || ''}
          onSearchChange={(search) => handlePaymentFilterChange({ search })}
        />
      )}

      {activeTab === 'overdue' && (
        <OverdueAccountsTable
          overdueStudents={overdueStudents}
          isLoading={isLoadingOverdue}
          filters={overdueFilters}
          pagination={overduePagination}
          onNextPage={handleNextOverduePage}
          onPrevPage={handlePrevOverduePage}
          onPageChange={(page) => handleOverdueFilterChange({ page })}
          onLimitChange={handleOverdueLimitChange}
          onFilterChange={handleOverdueFilterChange}
          onRecordPaymentForStudent={handleOpenRecordPaymentForStudent}
          totalOutstanding={stats.totalOutstanding}
        />
      )}

      {activeTab === 'lookup' && (
        <div className="space-y-6">
          {/* Lookup Search Panel */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Student Statement & Ledger Query
            </h4>
            <div className="relative max-w-lg">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name, SMS ID, or email..."
                value={lookupSearchTerm}
                onChange={(e) => setLookupSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0269ae] text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Quick Candidate Picks */}
            <div className="flex flex-wrap gap-2 pt-1">
              {lookupCandidates.map((cand) => (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => setLookupStudentId(cand.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    lookupStudentId === cand.id
                      ? 'bg-[#0269ae] text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span>{cand.fullName}</span>
                  <span className="font-mono text-[10px] ml-1 opacity-75">
                    ({cand.studentId})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Statement View */}
          {lookupStudentId ? (
            <StudentFeeLedgerView
              ledger={singleStudentLedgerData?.data || null}
              isLoading={isLoadingSingleStudentLedger}
              onOpenRecordPayment={() => {
                if (singleStudentLedgerData?.data) {
                  const s = singleStudentLedgerData.data.student;
                  setSelectedStudentForPayment({
                    id: s.id,
                    studentId: s.studentId,
                    fullName: s.fullName,
                    balance: singleStudentLedgerData.data.balance,
                    tuitionFee: singleStudentLedgerData.data.tuitionFee,
                  });
                  setIsRecordModalOpen(true);
                }
              }}
              isStaff={true}
            />
          ) : (
            <div className="p-12 text-center text-zinc-400 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-xs text-zinc-600 dark:text-zinc-300">
                Select a student from the candidate chips or search bar above
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Inspect their official statement of account, payment receipts, and balance breakdown.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        preselectedStudent={selectedStudentForPayment}
        onSuccess={handlePaymentSuccess}
      />

      {/* Official Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(activeReceiptPayment)}
        onClose={() => setActiveReceiptPayment(null)}
        payment={activeReceiptPayment}
      />
    </div>
  );
};

export default FeesDashboard;
