import api from '@/lib/axios';
import { AuthResponse, LoginCredentials, SessionResponse } from '../types';

export const authService = {
  /**
   * Authenticates user with credentials via Axios
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  },

  /**
   * Fetches the current authenticated user session
   */
  async getSession(): Promise<SessionResponse> {
    try {
      const response = await api.get<SessionResponse>('/api/auth/me');
      return response.data;
    } catch {
      return {
        success: false,
        message: 'Unauthenticated',
        data: null,
        meta: { authenticated: false },
      };
    }
  },

  /**
   * Revokes database refresh token and clears session cookies
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Manually refreshes session token pair
   */
  async refresh(): Promise<void> {
    await api.post('/api/auth/refresh');
  },
};

export default authService;
