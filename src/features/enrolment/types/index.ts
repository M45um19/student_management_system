import { z } from 'zod';

export type EnrolmentStatusType = 'ENROLLED' | 'DEFERRED' | 'WITHDRAWN' | 'COMPLETED';

export interface Programme {
  id: string;
  code: string;
  name: string;
  tuitionFee: number;
  createdById?: string | null;
  createdBy?: {
    id?: string;
    fullName: string;
    staffId: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
    assessments?: number;
  };
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  academicYear: string;
  status: EnrolmentStatusType;
  programmeId: string;
  programme?: Programme;
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    payments: number;
    submissions: number;
    grades: number;
  };
  financialSummary?: {
    tuitionFee: number;
    totalPaid: number;
    balance: number;
    isOverdue: boolean;
  };
}

export interface EnrolmentStats {
  total: number;
  enrolled: number;
  deferred: number;
  withdrawn: number;
  completed: number;
  programmesCount: number;
}

export interface PaginationMeta {
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

export interface EnrolmentMeta {
  pagination: PaginationMeta;
  stats: EnrolmentStats;
}

export interface StudentsApiResponse {
  success: boolean;
  message: string;
  data: Student[];
  meta: EnrolmentMeta;
}

export interface StudentDetailApiResponse {
  success: boolean;
  message: string;
  data: Student;
  meta?: {
    accountCreated?: boolean;
    defaultPasswordNote?: string | null;
  };
}

export interface ProgrammesApiResponse {
  success: boolean;
  message: string;
  data: Programme[];
  meta?: {
    total: number;
  };
}

export interface ProgrammeDetailApiResponse {
  success: boolean;
  message: string;
  data: Programme;
  meta?: Record<string, unknown>;
}

// Zod Validation Schemas
export const createStudentSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please provide a valid institutional email address')
    .trim()
    .toLowerCase(),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  academicYear: z
    .string()
    .min(1, 'Academic intake year is required')
    .max(50, 'Academic year must not exceed 50 characters')
    .trim(),
  programmeId: z
    .string()
    .min(1, 'Programme selection is required'),
  status: z
    .enum(['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED'])
    .default('ENROLLED'),
  createAccount: z.boolean().default(true),
  password: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentStatusSchema = z.object({
  status: z.enum(['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED'], {
    message: 'Valid status is ENROLLED, DEFERRED, WITHDRAWN, or COMPLETED',
  }),
});

export type UpdateStudentStatusInput = z.infer<typeof updateStudentStatusSchema>;

export const updateStudentSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  academicYear: z.string().min(1).max(50).optional(),
  programmeId: z.string().min(1).optional(),
  status: z.enum(['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED']).optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const createProgrammeSchema = z.object({
  code: z
    .string()
    .min(2, 'Programme code must be at least 2 characters')
    .max(20, 'Programme code cannot exceed 20 characters')
    .trim()
    .toUpperCase(),
  name: z
    .string()
    .min(3, 'Programme name must be at least 3 characters')
    .max(120, 'Programme name cannot exceed 120 characters')
    .trim(),
  tuitionFee: z
    .number({ message: 'Tuition fee must be a valid number' })
    .min(0, 'Tuition fee must be non-negative'),
});

export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;

export interface StudentFilterParams {
  search?: string;
  programmeId?: string;
  status?: string;
  academicYear?: string;
  page?: number;
  limit?: number;
  cursor?: string | null;
  direction?: 'forward' | 'backward';
  sortBy?: 'studentId' | 'fullName' | 'createdAt' | 'status' | 'id';
  sortOrder?: 'asc' | 'desc';
}

export const studentQuerySchema = z.object({
  search: z.string().max(100).optional().default(''),
  q: z.string().max(100).optional(),
  programmeId: z.string().optional().default(''),
  status: z.enum(['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED']).optional(),
  academicYear: z.string().max(50).optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.string().optional().nullable(),
  sortBy: z.enum(['createdAt', 'studentId', 'fullName', 'academicYear', 'status', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type StudentQueryParams = z.infer<typeof studentQuerySchema>;
