import { z } from 'zod';

export type SubmissionStatusType = 'SUBMITTED' | 'LATE' | 'PENDING' | 'OVERDUE';

export interface AssessmentProgramme {
  id: string;
  code: string;
  name: string;
  tuitionFee?: number;
}

export interface AssessmentStaff {
  id?: string;
  staffId: string;
  fullName: string;
}

export interface AssessmentStudent {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  academicYear?: string;
  status?: string;
  programme?: AssessmentProgramme;
}

export interface SubmissionGrade {
  id: string;
  numericGrade: number;
  classification: string;
  isPublished: boolean;
  publishedAt?: string | null;
}

export interface SubmissionRecord {
  id: string;
  assessmentId: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  student?: AssessmentStudent;
  grade?: SubmissionGrade | null;
}

export interface AssessmentRecord {
  id: string;
  title: string;
  module: string;
  deadline: string;
  programmeId: string;
  programme?: AssessmentProgramme;
  createdById?: string | null;
  createdBy?: AssessmentStaff | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
    grades?: number;
  };
  metrics?: {
    totalEnrolled: number;
    totalSubmitted: number;
    onTimeCount: number;
    lateCount: number;
    missingCount: number;
    submissionRate: number;
  };
  // Student-specific context when viewed in student portal
  mySubmission?: SubmissionRecord | null;
  studentStatus?: SubmissionStatusType;
}

export interface AssessmentOverviewStats {
  totalAssessments: number;
  activeDeadlines: number;
  archivedAssessments: number;
  totalSubmissions: number;
  lateSubmissions: number;
  onTimeSubmissions: number;
  totalEnrolledStudents: number;
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

export interface AssessmentFilterParams {
  search?: string;
  programmeId?: string;
  module?: string;
  status?: 'all' | 'active' | 'passed' | 'archived';
  page?: number;
  limit?: number;
  cursor?: string | null;
}

export interface AssessmentSubmissionsFilterParams {
  search?: string;
  status?: 'all' | 'submitted' | 'late' | 'missing';
  page?: number;
  limit?: number;
  cursor?: string | null;
}

export interface StudentAssessmentRosterEntry {
  id?: string;
  student: AssessmentStudent;
  hasSubmitted: boolean;
  submission: SubmissionRecord | null;
  isLate: boolean;
  submittedAt: string | null;
  status: 'ON_TIME' | 'LATE' | 'MISSING';
}

export interface AssessmentSubmissionsRosterResponse {
  assessment: AssessmentRecord;
  roster: StudentAssessmentRosterEntry[];
  stats: {
    totalEnrolled: number;
    totalSubmitted: number;
    onTimeCount: number;
    lateCount: number;
    missingCount: number;
    submissionRate: number;
  };
  pagination?: CursorPaginationMeta;
}

// ==========================================
// API Response Contracts
// ==========================================

export interface AssessmentsApiResponse {
  success: boolean;
  message: string;
  data: AssessmentRecord[];
  meta?: {
    pagination?: CursorPaginationMeta;
    stats?: AssessmentOverviewStats;
  };
}

export interface SingleAssessmentApiResponse {
  success: boolean;
  message: string;
  data: AssessmentRecord;
}

export interface AssessmentSubmissionsApiResponse {
  success: boolean;
  message: string;
  data: AssessmentSubmissionsRosterResponse;
  meta?: {
    pagination?: CursorPaginationMeta;
  };
}

export interface SubmitCourseworkApiResponse {
  success: boolean;
  message: string;
  data: SubmissionRecord;
}

export interface CreateAssessmentApiResponse {
  success: boolean;
  message: string;
  data: AssessmentRecord;
}

export interface DeleteAssessmentApiResponse {
  success: boolean;
  message: string;
  data: { id: string; isActive: boolean };
}

export interface ArchiveAssessmentApiResponse {
  success: boolean;
  message: string;
  data: { id: string; isActive: boolean };
}

// ==========================================
// Zod Validation Schemas
// ==========================================

export const createAssessmentSchema = z.object({
  title: z
    .string()
    .min(3, 'Assessment title must be at least 3 characters')
    .max(150, 'Assessment title cannot exceed 150 characters')
    .trim(),
  module: z
    .string()
    .min(2, 'Module name or code must be at least 2 characters')
    .max(100, 'Module name cannot exceed 100 characters')
    .trim(),
  deadline: z
    .string()
    .min(1, 'Submission deadline is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format for deadline'),
  programmeId: z.string().min(1, 'Enrolled degree programme is required'),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const submitCourseworkJsonSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
});

export type SubmitCourseworkJsonInput = z.infer<typeof submitCourseworkJsonSchema>;
