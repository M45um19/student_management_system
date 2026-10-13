import { z } from 'zod';

export type UKClassification = 'Distinction' | 'Merit' | 'Pass' | 'Fail';

export const AwardGradeSchema = z.object({
  assessmentId: z.string().min(1, 'Valid Assessment ID is required'),
  studentId: z.string().min(1, 'Valid Student ID is required'),
  numericGrade: z
    .number()
    .min(0, 'Grade must be at least 0')
    .max(100, 'Grade cannot exceed 100'),
  isPublished: z.boolean().optional().default(false),
});

export type AwardGradeInput = z.infer<typeof AwardGradeSchema>;

export const PublishGradeSchema = z.object({
  isPublished: z.boolean().optional(),
});

export type PublishGradeInput = z.infer<typeof PublishGradeSchema>;

export const BulkPublishGradesSchema = z.object({
  assessmentId: z.string().min(1, 'Valid Assessment ID is required'),
  isPublished: z.boolean(),
});

export type BulkPublishGradesInput = z.infer<typeof BulkPublishGradesSchema>;

export interface GradeProgramme {
  id: string;
  code: string;
  name: string;
  tuitionFee?: number;
}

export interface GradeStudent {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  academicYear?: string;
  status?: string;
  programme?: GradeProgramme;
}

export interface GradeStaff {
  id: string;
  staffId: string;
  fullName: string;
}

export interface GradeAssessment {
  id: string;
  title: string;
  module: string;
  deadline: string;
  programmeId: string;
  programme?: GradeProgramme;
  isActive: boolean;
}

export interface GradeSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
}

export interface GradeRecord {
  id: string;
  assessmentId: string;
  studentId: string;
  submissionId?: string | null;
  gradedById?: string | null;
  numericGrade: number;
  classification: UKClassification | string;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assessment?: GradeAssessment;
  student?: GradeStudent;
  submission?: GradeSubmission | null;
  gradedBy?: GradeStaff | null;
}

export interface StudentAssessmentGradeEntry {
  student: GradeStudent;
  hasSubmitted: boolean;
  submission: GradeSubmission | null;
  grade: GradeRecord | null;
  status: 'GRADED' | 'UNGRADED';
}

export interface AssessmentGradesMetrics {
  totalEnrolled: number;
  totalSubmitted: number;
  totalGraded: number;
  pendingGrading: number;
  publishedCount: number;
  draftCount: number;
  averageScore: number;
  passRate: number;
  classificationDistribution: {
    distinction: number;
    merit: number;
    pass: number;
    fail: number;
  };
}

export interface MarksheetStatsOverviewData {
  totalGradesAwarded: number;
  overallAverage: number;
  distinctionMeritRate: number;
  publishedRate: number;
  publishedCount: number;
  draftCount: number;
  totalStudents: number;
  totalAssessments: number;
}

export interface StudentMarksheetItem {
  gradeId: string;
  assessmentId: string;
  module: string;
  title: string;
  deadline: string;
  numericGrade: number;
  classification: UKClassification | string;
  isPublished: boolean;
  publishedAt?: string | null;
  submittedAt?: string | null;
  isLate?: boolean;
  gradedBy?: string | null;
}

export interface StudentMarksheetData {
  student: GradeStudent;
  programme: GradeProgramme;
  gpa: number;
  overallClassification: UKClassification | string;
  totalAssessed: number;
  modulesPassed: number;
  distinctionCount: number;
  meritCount: number;
  passCount: number;
  failCount: number;
  results: StudentMarksheetItem[];
  hasUnpublishedGrades?: boolean;
  totalGradesRecorded?: number;
  generatedAt: string;
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

export interface GradesFilterParams {
  search?: string;
  programmeId?: string;
  assessmentId?: string;
  classification?: string;
  status?: 'all' | 'published' | 'draft' | 'ungraded';
  page?: number;
  limit?: number;
  cursor?: string | null;
}

export interface AssessmentGradesFilterParams {
  search?: string;
  status?: 'all' | 'graded' | 'ungraded' | 'published' | 'draft';
  classification?: string;
  page?: number;
  limit?: number;
  cursor?: string | null;
}

export interface StandardApiResponse<T = unknown, M = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}

export type GradeApiResponse = StandardApiResponse<GradeRecord>;
export type GradesListApiResponse = StandardApiResponse<
  GradeRecord[],
  {
    pagination: CursorPaginationMeta;
    stats: MarksheetStatsOverviewData;
  }
>;
export type AssessmentGradesApiResponse = StandardApiResponse<
  StudentAssessmentGradeEntry[],
  {
    assessment: GradeAssessment;
    metrics: AssessmentGradesMetrics;
    pagination: CursorPaginationMeta;
  }
>;
export type StudentMarksheetApiResponse = StandardApiResponse<StudentMarksheetData>;
export type BulkPublishApiResponse = StandardApiResponse<{
  updatedCount: number;
  isPublished: boolean;
}>;
