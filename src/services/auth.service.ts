// src/services/auth.service.ts

import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  getCustomAuthHeaders,
  setAuthToken,
  setStoredUser,
  removeAuthToken,
  isAuthenticated,
  getStoredUser,
} from './api.config';

/**
 * API Response Interface
 */
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * User Interface
 */
export interface User {
  id: number;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
  profilePicture?: string;
}

/**
 * Registration Data Interface
 */
export interface RegisterData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Login Data Interface
 */
export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

/**
 * Forgot Password Data Interface
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Reset Password Data Interface
 */
export interface ResetPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * OTP Verification Data Interface
 */
export interface OTPVerificationData {
  email: string;
  otp: string;
}

/**
 * Google OAuth Data Interface
 */
export interface GoogleAuthData {
  code: string;
  redirectUri: string;
  flow: 'register' | 'login';
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        const error: any = new Error(result.message || 'Registration failed');
        error.data = result.data;
        error.errors = result.errors; // Some endpoints use 'errors' instead of 'data' for field-level errors
        throw error;
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send or resend OTP for email verification
   */
  async sendOTP(email: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.SEND_OTP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(data: OTPVerificationData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Email verification failed');
      }

      // Store token and user data
      if (result.data?.token) {
        setAuthToken(result.data.token);
      }
      if (result.data?.user) {
        setStoredUser(result.data.user);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login - Step 1: Validate credentials
   */
  async login(data: LoginData): Promise<ApiResponse<{ email: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login - Step 2: Verify OTP
   */
  async verifyLoginOTP(data: OTPVerificationData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_LOGIN_OTP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed');
      }

      // Store token and user data
      if (result.data?.token) {
        setAuthToken(result.data.token);
      }
      if (result.data?.user) {
        setStoredUser(result.data.user);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forgot Password - Step 1: Send OTP
   */
  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse<{ email: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send reset OTP');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forgot Password - Step 2: Verify Reset OTP
   */
  async verifyResetOTP(data: OTPVerificationData): Promise<ApiResponse<{ email: string; verified: boolean; resetToken: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_RESET_OTP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forgot Password - Step 3: Reset Password
   */
  async resetPassword(data: ResetPasswordData, resetToken: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
        method: 'POST',
        headers: getCustomAuthHeaders(resetToken),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Password reset failed');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Google OAuth - Step 1: Exchange code for tokens
   */
  async googleAuthCallback(data: GoogleAuthData): Promise<ApiResponse<{ requiresOtp?: boolean; email?: string; tempToken?: string; token?: string; user?: User; isNewUser?: boolean }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_CALLBACK}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Google authentication failed');
      }

      // If direct login (no OTP required)
      if (result.data?.token && !result.data?.requiresOtp) {
        setAuthToken(result.data.token);
        if (result.data?.user) {
          setStoredUser(result.data.user);
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Google OAuth - Step 2: Send OTP (if required)
   */
  async googleSendOTP(email: string, tempToken: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_SEND_OTP}`, {
        method: 'POST',
        headers: getCustomAuthHeaders(tempToken),
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Google OAuth - Step 3: Verify OTP
   */
  async googleVerifyOTP(otp: string, tempToken: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_VERIFY_OTP}`, {
        method: 'POST',
        headers: getCustomAuthHeaders(tempToken),
        body: JSON.stringify({ otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed');
      }

      // Store token and user data
      if (result.data?.token) {
        setAuthToken(result.data.token);
      }
      if (result.data?.user) {
        setStoredUser(result.data.user);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get user info');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(fullName: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.UPDATE_PROFILE}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fullName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update stored user data
      if (result.data) {
        setStoredUser(result.data);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout from current device
   */
  async logout(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Logout failed');
      }

      // Clear local storage
      removeAuthToken();

      return result;
    } catch (error) {
      // Clear local storage even if API call fails
      removeAuthToken();
      throw error;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT_ALL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Logout failed');
      }

      // Clear local storage
      removeAuthToken();

      return result;
    } catch (error) {
      // Clear local storage even if API call fails
      removeAuthToken();
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    return getStoredUser();
  }
}

// Export singleton instance
export const authService = new AuthService();

export default authService;