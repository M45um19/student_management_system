'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import enrolmentService from '../services/enrolment-service';
import {
  StudentFilterParams,
  CreateStudentInput,
  CreateProgrammeInput,
  EnrolmentStatusType,
  StudentsApiResponse,
  ProgrammesApiResponse,
  StudentDetailApiResponse,
  ProgrammeDetailApiResponse,
} from '../types';

export const ENROLMENT_KEYS = {
  allProgrammes: ['programmes'] as const,
  programme: (id: string) => ['programme', id] as const,
  allStudents: ['students'] as const,
  studentsList: (filters: StudentFilterParams) => ['students', 'list', filters] as const,
  student: (id: string) => ['student', id] as const,
};

/**
 * Hook to retrieve all degree programmes with tuition fees
 */
export function useProgrammes() {
  return useQuery<ProgrammesApiResponse, Error>({
    queryKey: ENROLMENT_KEYS.allProgrammes,
    queryFn: () => enrolmentService.getProgrammes(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to retrieve filtered, paginated student registry records
 */
export function useStudents(filters: StudentFilterParams = {}) {
  return useQuery<StudentsApiResponse, Error>({
    queryKey: ENROLMENT_KEYS.studentsList(filters),
    queryFn: () => enrolmentService.getStudents(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to retrieve a single student's comprehensive profile
 */
export function useStudent(id?: string) {
  return useQuery<StudentDetailApiResponse, Error>({
    queryKey: ENROLMENT_KEYS.student(id || ''),
    queryFn: () => enrolmentService.getStudentById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to enrol a new student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation<StudentDetailApiResponse, Error, CreateStudentInput>({
    mutationFn: (data) => enrolmentService.createStudent(data),
    onSuccess: () => {
      // Invalidate student queries to refresh registry tables and counts
      queryClient.invalidateQueries({ queryKey: ENROLMENT_KEYS.allStudents });
      queryClient.invalidateQueries({ queryKey: ENROLMENT_KEYS.allProgrammes });
    },
  });
}

/**
 * Hook to update student enrolment lifecycle status
 */
export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    StudentDetailApiResponse,
    Error,
    { id: string; status: EnrolmentStatusType }
  >({
    mutationFn: ({ id, status }) => enrolmentService.updateStudentStatus(id, status),
    onSuccess: (data, variables) => {
      // Invalidate all student lists and detail cache
      queryClient.invalidateQueries({ queryKey: ENROLMENT_KEYS.allStudents });
      queryClient.invalidateQueries({ queryKey: ENROLMENT_KEYS.student(variables.id) });
    },
  });
}

/**
 * Hook to create a new degree programme
 */
export function useCreateProgramme() {
  const queryClient = useQueryClient();

  return useMutation<ProgrammeDetailApiResponse, Error, CreateProgrammeInput>({
    mutationFn: (data) => enrolmentService.createProgramme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENROLMENT_KEYS.allProgrammes });
    },
  });
}
