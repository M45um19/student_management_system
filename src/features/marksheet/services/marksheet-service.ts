import api from '@/lib/axios';
import {
  GradesListApiResponse,
  GradeApiResponse,
  AssessmentGradesApiResponse,
  StudentMarksheetApiResponse,
  BulkPublishApiResponse,
  AwardGradeInput,
  GradesFilterParams,
  AssessmentGradesFilterParams,
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

export const marksheetService = {
  /**
   * Retrieves paginated institutional grades list with stats and filters.
   */
  async getGrades(params: GradesFilterParams = {}): Promise<GradesListApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.programmeId) queryParams.set('programmeId', params.programmeId);
      if (params.assessmentId) queryParams.set('assessmentId', params.assessmentId);
      if (params.classification && params.classification !== 'all') {
        queryParams.set('classification', params.classification);
      }
      if (params.status && params.status !== 'all') {
        queryParams.set('status', params.status);
      }
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.cursor) queryParams.set('cursor', params.cursor);

      const url = `/api/grades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<GradesListApiResponse>(url);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve institutional grades.'));
    }
  },

  /**
   * Retrieves cohort grading roster and analytics for a specific assessment.
   */
  async getAssessmentGrades(
    assessmentId: string,
    params: AssessmentGradesFilterParams = {}
  ): Promise<AssessmentGradesApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.status && params.status !== 'all') {
        queryParams.set('status', params.status);
      }
      if (params.classification && params.classification !== 'all') {
        queryParams.set('classification', params.classification);
      }
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.cursor) queryParams.set('cursor', params.cursor);

      const url = `/api/assessments/${encodeURIComponent(assessmentId)}/grades${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      const response = await api.get<AssessmentGradesApiResponse>(url);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve assessment grades roster.'));
    }
  },

  /**
   * Staff records or updates a numeric grade (0-100) for a student and assessment.
   */
  async awardGrade(data: AwardGradeInput): Promise<GradeApiResponse> {
    try {
      const response = await api.post<GradeApiResponse>('/api/grades', data);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to award student grade.'));
    }
  },

  /**
   * Staff toggles or sets publish status for an individual grade.
   */
  async togglePublishGrade(
    gradeId: string,
    isPublished?: boolean
  ): Promise<GradeApiResponse> {
    try {
      const payload = typeof isPublished === 'boolean' ? { isPublished } : undefined;
      const response = await api.patch<GradeApiResponse>(
        `/api/grades/${encodeURIComponent(gradeId)}/publish`,
        payload
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to update grade publication status.'));
    }
  },

  /**
   * Staff bulk publishes or withholds all awarded grades for an assessment deliverable.
   */
  async bulkPublishGrades(
    assessmentId: string,
    isPublished: boolean
  ): Promise<BulkPublishApiResponse> {
    try {
      const response = await api.post<BulkPublishApiResponse>('/api/grades/bulk-publish', {
        assessmentId,
        isPublished,
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to bulk publish assessment grades.'));
    }
  },

  /**
   * Retrieves official marksheet / academic transcript for a student.
   * Can pass 'me' or student UUID.
   */
  async getStudentMarksheet(
    studentId: string
  ): Promise<StudentMarksheetApiResponse> {
    try {
      const response = await api.get<StudentMarksheetApiResponse>(
        `/api/students/${encodeURIComponent(studentId)}/marksheet`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve official student marksheet.'));
    }
  },
};

export default marksheetService;
