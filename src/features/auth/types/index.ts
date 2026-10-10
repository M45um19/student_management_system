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
  message?: string;
  user?: AuthUser;
}

export interface SessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}
