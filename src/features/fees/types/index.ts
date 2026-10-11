import { z } from 'zod';

export type PaymentStatusType = 'SETTLED' | 'PARTIAL' | 'UNPAID';
export type PaymentUrgencyType = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PaymentStaff {
  id?: string;
  staffId: string;
  fullName: string;
}

export interface PaymentStudent {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  academicYear?: string;
  status?: string;
  programme?: {
    id: string;
    code: string;
    name: string;
    tuitionFee: number;
  };
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  referenceNo: string;
  createdAt: string;
  student?: PaymentStudent;
  recordedBy?: PaymentStaff | null;
}

export interface StudentFeeLedger {
  student: PaymentStudent;
  programme?: {
    id: string;
    code: string;
    name: string;
    tuitionFee: number;
  };
  tuitionFee: number;
  totalPaid: number;
  balance: number;
  isOverdue: boolean;
  paymentStatus: PaymentStatusType;
  paymentsCount: number;
  payments: PaymentRecord[];
}

export interface OverdueStudent {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  academicYear: string;
  status: string;
  programme?: {
    id: string;
    code: string;
    name: string;
    tuitionFee: number;
  };
  tuitionFee: number;
  totalPaid: number;
  balance: number;
  paymentsCount: number;
  lastPaymentDate: string | null;
  lastPaymentRef: string | null;
  urgency: PaymentUrgencyType;
}

export interface FeesOverviewStats {
  totalStudents: number;
  totalOverdueStudents: number;
  totalExpectedTuition: number;
  totalFeesCollected: number;
  totalOutstanding: number;
  collectionRate: number;
}

export interface CursorPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cursor?: string | null;
  nextCursor?: string | null;
  prevCursor?: string | null;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export type PaymentPaginationMeta = CursorPaginationMeta;

export interface PaymentsApiResponse {
  success: boolean;
  message: string;
  data: PaymentRecord[];
  meta?: {
    pagination: CursorPaginationMeta;
    totalAmount: number;
  };
}

export interface StudentFeeLedgerApiResponse {
  success: boolean;
  message: string;
  data: StudentFeeLedger;
}

export interface OverdueFeesApiResponse {
  success: boolean;
  message: string;
  data: OverdueStudent[];
  meta?: {
    stats: FeesOverviewStats;
    pagination?: CursorPaginationMeta;
    totalCount: number;
  };
}

export interface RecordPaymentResult {
  payment: PaymentRecord;
  ledgerSummary: {
    tuitionFee: number;
    previousPaid: number;
    amountPaid: number;
    newTotalPaid: number;
    previousBalance: number;
    newBalance: number;
    isOverdue: boolean;
    status: PaymentStatusType;
  };
}

export interface RecordPaymentApiResponse {
  success: boolean;
  message: string;
  data: RecordPaymentResult;
}

// Zod Validation Schemas
export const recordPaymentFormSchema = z.object({
  studentId: z.string().min(1, 'Please select or enter a student'),
  amount: z
    .coerce
    .number({ message: 'Amount must be a valid number' })
    .positive('Payment amount must be greater than £0')
    .max(1000000, 'Payment amount cannot exceed £1,000,000'),
  paymentDate: z.string().optional(),
  referenceNo: z
    .string()
    .min(3, 'Reference number must be at least 3 characters')
    .max(50, 'Reference number must not exceed 50 characters')
    .trim(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentFormSchema>;

export interface PaymentFilterParams {
  search?: string;
  studentId?: string;
  page?: number;
  limit?: number;
  cursor?: string | null;
  direction?: 'forward' | 'backward';
}

export interface OverdueFilterParams {
  search?: string;
  programmeId?: string;
  sortBy?: 'balance' | 'name' | 'studentId';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  cursor?: string | null;
  direction?: 'forward' | 'backward';
}
