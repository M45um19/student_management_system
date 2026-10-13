'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import marksheetService from '../services/marksheet-service';
import {
  GradesListApiResponse,
  AssessmentGradesApiResponse,
  StudentMarksheetApiResponse,
  GradeApiResponse,
  BulkPublishApiResponse,
  AwardGradeInput,
  GradesFilterParams,
  AssessmentGradesFilterParams,
} from '../types';

export const MARKSHEET_KEYS = {
  all: ['marksheet'] as const,
  list: (params: GradesFilterParams) => ['marksheet', 'list', params] as const,
  assessmentGrades: (assessmentId: string, params: AssessmentGradesFilterParams) =>
    ['marksheet', 'assessment', assessmentId, params] as const,
  studentMarksheet: (studentId: string) => ['marksheet', 'student', studentId] as const,
};

/**
 * Hook to retrieve institutional grades list with search, filters, and KPIs.
 */
export function useGrades(params: GradesFilterParams = {}) {
  return useQuery<GradesListApiResponse, Error>({
    queryKey: MARKSHEET_KEYS.list(params),
    queryFn: () => marksheetService.getGrades(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to retrieve full cohort grading roster and metrics for a specific assessment.
 */
export function useAssessmentGrades(
  assessmentId?: string,
  params: AssessmentGradesFilterParams = {}
) {
  return useQuery<AssessmentGradesApiResponse, Error>({
    queryKey: MARKSHEET_KEYS.assessmentGrades(assessmentId || '', params),
    queryFn: () => marksheetService.getAssessmentGrades(assessmentId!, params),
    enabled: Boolean(assessmentId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20, // 20 seconds
  });
}

/**
 * Hook to retrieve official student marksheet and transcript.
 */
export function useStudentMarksheet(studentId?: string) {
  return useQuery<StudentMarksheetApiResponse, Error>({
    queryKey: MARKSHEET_KEYS.studentMarksheet(studentId || 'me'),
    queryFn: () => marksheetService.getStudentMarksheet(studentId || 'me'),
    enabled: Boolean(studentId),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook for staff to record or update a numeric grade (0-100).
 */
export function useAwardGrade() {
  const queryClient = useQueryClient();

  return useMutation<GradeApiResponse, Error, AwardGradeInput>({
    mutationFn: (data) => marksheetService.awardGrade(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MARKSHEET_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ['assessments', 'submissions', variables.assessmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['assessments', 'detail', variables.assessmentId],
      });
      queryClient.invalidateQueries({
        queryKey: MARKSHEET_KEYS.studentMarksheet(variables.studentId),
      });
    },
  });
}

/**
 * Hook for staff to toggle or set publish status of an individual grade.
 */
export function useTogglePublishGrade() {
  const queryClient = useQueryClient();

  return useMutation<
    GradeApiResponse,
    Error,
    { gradeId: string; isPublished?: boolean; studentId?: string; assessmentId?: string }
  >({
    mutationFn: ({ gradeId, isPublished }) =>
      marksheetService.togglePublishGrade(gradeId, isPublished),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MARKSHEET_KEYS.all });
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: MARKSHEET_KEYS.studentMarksheet(variables.studentId),
        });
      }
      if (variables.assessmentId) {
        queryClient.invalidateQueries({
          queryKey: ['assessments', 'submissions', variables.assessmentId],
        });
      }
    },
  });
}

/**
 * Hook for staff to bulk publish or withhold all awarded grades for an assessment.
 */
export function useBulkPublishGrades() {
  const queryClient = useQueryClient();

  return useMutation<
    BulkPublishApiResponse,
    Error,
    { assessmentId: string; isPublished: boolean }
  >({
    mutationFn: ({ assessmentId, isPublished }) =>
      marksheetService.bulkPublishGrades(assessmentId, isPublished),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MARKSHEET_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ['assessments', 'submissions', variables.assessmentId],
      });
    },
  });
}
