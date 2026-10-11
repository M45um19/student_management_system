import api from '@/lib/axios';
import {
  AssessmentsApiResponse,
  SingleAssessmentApiResponse,
  AssessmentSubmissionsApiResponse,
  SubmitCourseworkApiResponse,
  CreateAssessmentApiResponse,
  DeleteAssessmentApiResponse,
  ArchiveAssessmentApiResponse,
  AssessmentFilterParams,
  AssessmentSubmissionsFilterParams,
  CreateAssessmentInput,
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

export const assessmentsService = {
  /**
   * Retrieves assessments list with optional filtering and pagination.
   */
  async getAssessments(params: AssessmentFilterParams = {}): Promise<AssessmentsApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.programmeId) queryParams.set('programmeId', params.programmeId);
      if (params.module) queryParams.set('module', params.module);
      if (params.status && params.status !== 'all') queryParams.set('status', params.status);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.cursor) queryParams.set('cursor', params.cursor);

      const url = `/api/assessments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<AssessmentsApiResponse>(url);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve assessments.'));
    }
  },

  /**
   * Retrieves details of a single assessment.
   */
  async getAssessmentById(id: string): Promise<SingleAssessmentApiResponse> {
    try {
      const response = await api.get<SingleAssessmentApiResponse>(
        `/api/assessments/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve assessment details.'));
    }
  },

  /**
   * Staff creates a new assessment deliverable.
   */
  async createAssessment(data: CreateAssessmentInput): Promise<CreateAssessmentApiResponse> {
    try {
      const response = await api.post<CreateAssessmentApiResponse>('/api/assessments', data);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to create assessment.'));
    }
  },

  /**
   * Staff deletes an assessment.
   */
  async deleteAssessment(id: string): Promise<DeleteAssessmentApiResponse> {
    try {
      const response = await api.delete<DeleteAssessmentApiResponse>(
        `/api/assessments/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to archive assessment.'));
    }
  },

  /**
   * Staff archives or restores an assessment (isActive: false | true).
   */
  async archiveAssessment(
    id: string,
    isActive = false
  ): Promise<ArchiveAssessmentApiResponse> {
    try {
      const response = await api.patch<ArchiveAssessmentApiResponse>(
        `/api/assessments/${encodeURIComponent(id)}`,
        { isActive }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        extractErrorMessage(
          error,
          isActive ? 'Failed to restore assessment.' : 'Failed to archive assessment.'
        )
      );
    }
  },

  /**
   * Student submits coursework deliverables (supports FormData or JSON).
   */
  async submitCoursework(
    assessmentId: string,
    payload: FormData | { fileName: string; fileUrl: string }
  ): Promise<SubmitCourseworkApiResponse> {
    try {
      const config =
        payload instanceof FormData
          ? {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          : undefined;

      const response = await api.post<SubmitCourseworkApiResponse>(
        `/api/assessments/${encodeURIComponent(assessmentId)}/submit`,
        payload,
        config
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to submit coursework.'));
    }
  },

  /**
   * Staff reviews cohort submission status, timestamps, and late tags.
   */
  async getAssessmentSubmissions(
    assessmentId: string,
    params: AssessmentSubmissionsFilterParams = {}
  ): Promise<AssessmentSubmissionsApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.status && params.status !== 'all') queryParams.set('status', params.status);
      if (params.cursor) queryParams.set('cursor', params.cursor);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());

      const url = `/api/assessments/${encodeURIComponent(assessmentId)}/submissions${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      const response = await api.get<AssessmentSubmissionsApiResponse>(url);
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to retrieve assessment submissions.'));
    }
  },
};

export default assessmentsService;
