'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import assessmentsService from '../services/assessments-service';
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

export const ASSESSMENTS_KEYS = {
  all: ['assessments'] as const,
  list: (params: AssessmentFilterParams) => ['assessments', 'list', params] as const,
  detail: (id: string) => ['assessments', 'detail', id] as const,
  submissions: (id: string, params: AssessmentSubmissionsFilterParams) =>
    ['assessments', 'submissions', id, params] as const,
};

/**
 * Hook to retrieve assessments list with filtering and pagination.
 */
export function useAssessments(params: AssessmentFilterParams = {}) {
  return useQuery<AssessmentsApiResponse, Error>({
    queryKey: ASSESSMENTS_KEYS.list(params),
    queryFn: () => assessmentsService.getAssessments(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to retrieve details of a single assessment.
 */
export function useAssessment(id?: string) {
  return useQuery<SingleAssessmentApiResponse, Error>({
    queryKey: ASSESSMENTS_KEYS.detail(id || ''),
    queryFn: () => assessmentsService.getAssessmentById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to retrieve assessment submissions roster for staff review.
 */
export function useAssessmentSubmissions(
  assessmentId?: string,
  params: AssessmentSubmissionsFilterParams = {}
) {
  return useQuery<AssessmentSubmissionsApiResponse, Error>({
    queryKey: ASSESSMENTS_KEYS.submissions(assessmentId || '', params),
    queryFn: () => assessmentsService.getAssessmentSubmissions(assessmentId!, params),
    enabled: Boolean(assessmentId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 15, // 15 seconds
  });
}

/**
 * Hook for staff to create a new assessment.
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation<CreateAssessmentApiResponse, Error, CreateAssessmentInput>({
    mutationFn: (data) => assessmentsService.createAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEYS.all });
    },
  });
}

/**
 * Hook for students to submit coursework deliverables.
 */
export function useSubmitCoursework() {
  const queryClient = useQueryClient();

  return useMutation<
    SubmitCourseworkApiResponse,
    Error,
    { assessmentId: string; payload: FormData | { fileName: string; fileUrl: string } }
  >({
    mutationFn: ({ assessmentId, payload }) =>
      assessmentsService.submitCoursework(assessmentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ASSESSMENTS_KEYS.detail(variables.assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: ['assessments', 'submissions', variables.assessmentId],
      });
    },
  });
}

/**
 * Hook for staff to delete an assessment.
 */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation<DeleteAssessmentApiResponse, Error, string>({
    mutationFn: (id) => assessmentsService.deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEYS.all });
    },
  });
}

/**
 * Hook for staff to archive or restore an assessment (soft delete).
 */
export function useArchiveAssessment() {
  const queryClient = useQueryClient();

  return useMutation<ArchiveAssessmentApiResponse, Error, { id: string; isActive?: boolean }>({
    mutationFn: ({ id, isActive = false }) => assessmentsService.archiveAssessment(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEYS.all });
    },
  });
}

