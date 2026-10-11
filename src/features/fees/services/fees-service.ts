import api from '@/lib/axios';
import {
  StudentFeeLedgerApiResponse,
  RecordPaymentInput,
  RecordPaymentApiResponse,
  OverdueFeesApiResponse,
  OverdueFilterParams,
  PaymentsApiResponse,
  PaymentFilterParams,
} from '../types';

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as ApiErrorResponse;
  return err.response?.data?.message || err.message || fallback;
}

export const feesService = {
  /**
   * Retrieves a student's assigned tuition fee, payments history, and current balance.
   */
  async getStudentFees(studentId: string): Promise<StudentFeeLedgerApiResponse> {
    try {
      const response = await api.get<StudentFeeLedgerApiResponse>(
        `/api/students/${encodeURIComponent(studentId)}/fees`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve student fee ledger.'));
    }
  },

  /**
   * Records a payment transaction against a student's tuition balance.
   * Staff only.
   */
  async recordPayment(data: RecordPaymentInput): Promise<RecordPaymentApiResponse> {
    try {
      const response = await api.post<RecordPaymentApiResponse>('/api/payments', data);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to record payment transaction.'));
    }
  },

  /**
   * Retrieves all students with outstanding balances, including institutional financial KPIs.
   * Staff only.
   */
  async getOverdueFees(params: OverdueFilterParams = {}): Promise<OverdueFeesApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.programmeId) queryParams.set('programmeId', params.programmeId);
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.cursor) queryParams.set('cursor', params.cursor);

      const url = `/api/fees/overdue${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<OverdueFeesApiResponse>(url);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve overdue fees report.'));
    }
  },

  /**
   * Retrieves institutional payment transactions with search and pagination.
   */
  async getPayments(params: PaymentFilterParams = {}): Promise<PaymentsApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.studentId) queryParams.set('studentId', params.studentId);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.cursor) queryParams.set('cursor', params.cursor);

      const url = `/api/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<PaymentsApiResponse>(url);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve payment records.'));
    }
  },
};

export default feesService;
