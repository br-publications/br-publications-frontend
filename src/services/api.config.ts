// src/services/api.config.ts

/**
 * API Configuration
 * Central configuration for all API calls
 */

// Base URL for API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_BASE_URL ||
  'http://127.0.0.1:5001';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    SEND_OTP: '/api/auth/send-otp',
    VERIFY_EMAIL: '/api/auth/verify-email',
    LOGIN: '/api/auth/login',
    VERIFY_LOGIN_OTP: '/api/auth/verify-login-otp',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    VERIFY_RESET_OTP: '/api/auth/verify-reset-otp',
    RESET_PASSWORD: '/api/auth/reset-password',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
    GOOGLE_SEND_OTP: '/api/auth/google/send-otp',
    GOOGLE_VERIFY_OTP: '/api/auth/google/verify-otp',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/auth/update-profile',
    LOGOUT: '/api/auth/logout',
    LOGOUT_ALL: '/api/auth/logout-all',
  },
  // Add more endpoints as needed,
  // Recruitment Submissions
  RECRUITMENT: {
    SUBMIT: '/api/recruitment',
    MY_SUBMISSIONS: '/api/recruitment/my',
    ADMIN_ALL: '/api/recruitment/admin/all',
    BY_ID: (id: string | number) => `/api/recruitment/id/${id}`,
    UPDATE_STATUS: (id: string | number) => `/api/recruitment/status/${id}`,
  },
};

// Request configuration
export const REQUEST_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Get auth token from storage (Session first, then Local)
 */
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

/**
 * Remove auth token from both storages
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('isImpersonating');
};

/**
 * Get stored user data (Session first, then Local)
 */
export const getStoredUser = (): any | null => {
  const sessionUser = sessionStorage.getItem('user');
  if (sessionUser) {
    try {
      return JSON.parse(sessionUser);
    } catch {
      // invalid json in session
    }
  }

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Store user data
 */
export const setStoredUser = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Create headers for authenticated requests
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Create headers with custom token (for temporary tokens)
 */
export const getCustomAuthHeaders = (token: string): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  REQUEST_CONFIG,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getStoredUser,
  setStoredUser,
  isAuthenticated,
  getAuthHeaders,
  getCustomAuthHeaders,
};