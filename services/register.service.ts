import { API_BASE_URL as BASE_URL } from './api.config';
const API_BASE_URL = `${BASE_URL}/api/auth`;

// Types for API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export const registerService = {
  /**
   * STEP 1: Register a new user
   * Maps to: POST /api/auth/register
   */
  register: async (payload: RegisterPayload): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  /**
   * STEP 2: Send/Resend OTP to email
   * Maps to: POST /api/auth/send-otp
   */
  sendOtp: async (email: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });
    return response.json();
  },

  /**
   * STEP 3: Verify Email with OTP
   * Maps to: POST /api/auth/verify-email
   */
  verifyEmail: async (email: string, otp: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return response.json();
  },

  /**
   * GOOGLE OAUTH: Handle Google Callback
   * Maps to: POST /api/auth/google/callback
   */
  googleAuthCallback: async (code: string, redirectUri: string, flow: 'register' | 'login'): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri, flow }),
    });
    return response.json();
  },
};

export default registerService;