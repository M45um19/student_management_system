'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import feesService from '../services/fees-service';
import {
  StudentFeeLedgerApiResponse,
  OverdueFeesApiResponse,
  PaymentsApiResponse,
  RecordPaymentApiResponse,
  RecordPaymentInput,
  OverdueFilterParams,
  PaymentFilterParams,
} from '../types';

export const FEES_KEYS = {
  all: ['fees'] as const,
  studentFees: (id: string) => ['fees', 'student', id] as const,
  overdue: (params: OverdueFilterParams) => ['fees', 'overdue', params] as const,
  payments: (params: PaymentFilterParams) => ['fees', 'payments', params] as const,
};

/**
 * Hook to retrieve a student's assigned tuition fee, payments ledger, and outstanding balance.
 */
export function useStudentFees(studentId?: string) {
  return useQuery<StudentFeeLedgerApiResponse, Error>({
    queryKey: FEES_KEYS.studentFees(studentId || ''),
    queryFn: () => feesService.getStudentFees(studentId!),
    enabled: Boolean(studentId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to retrieve students with overdue balances and institutional financial KPIs.
 */
export function useOverdueFees(params: OverdueFilterParams = {}) {
  return useQuery<OverdueFeesApiResponse, Error>({
    queryKey: FEES_KEYS.overdue(params),
    queryFn: () => feesService.getOverdueFees(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to retrieve institutional payment transactions with search and pagination.
 */
export function usePayments(params: PaymentFilterParams = {}) {
  return useQuery<PaymentsApiResponse, Error>({
    queryKey: FEES_KEYS.payments(params),
    queryFn: () => feesService.getPayments(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to record a new payment transaction against a student's tuition balance.
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation<RecordPaymentApiResponse, Error, RecordPaymentInput>({
    mutationFn: (data) => feesService.recordPayment(data),
    onSuccess: (data, variables) => {
      // Invalidate all fee queries and relevant student queries to keep cache in sync
      queryClient.invalidateQueries({ queryKey: FEES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: FEES_KEYS.studentFees(variables.studentId),
        });
        queryClient.invalidateQueries({
          queryKey: ['student', variables.studentId],
        });
      }
    },
  });
}
