import api from '@/lib/axios';
import {
  CreateStudentInput,
  UpdateStudentInput,
  CreateProgrammeInput,
  EnrolmentStatusType,
  StudentFilterParams,
  StudentsApiResponse,
  StudentDetailApiResponse,
  ProgrammesApiResponse,
  ProgrammeDetailApiResponse,
} from '../types';

export const enrolmentService = {
  /**
   * Fetches degree programmes with tuition fees and enrolment counts.
   */
  async getProgrammes(): Promise<ProgrammesApiResponse> {
    try {
      const response = await api.get<ProgrammesApiResponse>('/api/programmes');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to load programmes.';
      throw new Error(message);
    }
  },

  /**
   * Fetches a single degree programme by ID.
   */
  async getProgrammeById(id: string): Promise<ProgrammeDetailApiResponse> {
    try {
      const response = await api.get<ProgrammeDetailApiResponse>(`/api/programmes/${id}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to retrieve programme.';
      throw new Error(message);
    }
  },

  /**
   * Creates a new degree programme with baseline tuition fee (Staff only).
   */
  async createProgramme(data: CreateProgrammeInput): Promise<ProgrammeDetailApiResponse> {
    try {
      const response = await api.post<ProgrammeDetailApiResponse>('/api/programmes', data);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to create programme.';
      throw new Error(message);
    }
  },

  /**
   * Queries the students directory with search, filtering, and pagination.
   */
  async getStudents(params: StudentFilterParams = {}): Promise<StudentsApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.programmeId) queryParams.set('programmeId', params.programmeId);
      if (params.status) queryParams.set('status', params.status);
      if (params.academicYear) queryParams.set('academicYear', params.academicYear);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.cursor) queryParams.set('cursor', params.cursor);
      if (params.direction) queryParams.set('direction', params.direction);
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

      const url = `/api/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<StudentsApiResponse>(url);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to retrieve student directory.';
      throw new Error(message);
    }
  },

  /**
   * Retrieves full student profile, academic programme, fee ledger, and coursework.
   */
  async getStudentById(id: string): Promise<StudentDetailApiResponse> {
    try {
      const response = await api.get<StudentDetailApiResponse>(`/api/students/${id}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to retrieve student profile.';
      throw new Error(message);
    }
  },

  /**
   * Enrols a new student, generates atomic SMS ID, and creates linked account.
   */
  async createStudent(data: CreateStudentInput): Promise<StudentDetailApiResponse> {
    try {
      const response = await api.post<StudentDetailApiResponse>('/api/students', data);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to enrol student.';
      throw new Error(message);
    }
  },

  /**
   * Updates student lifecycle status (ENROLLED, DEFERRED, WITHDRAWN, COMPLETED).
   */
  async updateStudentStatus(
    id: string,
    status: EnrolmentStatusType
  ): Promise<StudentDetailApiResponse> {
    try {
      const response = await api.patch<StudentDetailApiResponse>(
        `/api/students/${id}/status`,
        { status }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update student enrolment status.';
      throw new Error(message);
    }
  },

  /**
   * Updates general student information.
   */
  async updateStudent(id: string, data: UpdateStudentInput): Promise<StudentDetailApiResponse> {
    try {
      const response = await api.patch<StudentDetailApiResponse>(`/api/students/${id}`, data);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to update student record.';
      throw new Error(message);
    }
  },
};

export default enrolmentService;
