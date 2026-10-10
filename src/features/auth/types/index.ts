export type UserRole = 'STAFF' | 'STUDENT';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  staffId?: string;
  studentId?: string;
  department?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthUser | null;
  meta?: Record<string, unknown>;
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data: AuthUser | null;
  meta?: {
    authenticated: boolean;
  };
}
