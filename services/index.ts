// src/services/index.ts
// Central export file for all services

export { authService, default as AuthService } from './auth.service';
export type {
  User,
  RegisterData,
  LoginData,
  ForgotPasswordData,
  ResetPasswordData,
  OTPVerificationData,
  GoogleAuthData
} from './auth.service';

export {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getStoredUser,
  setStoredUser,
  isAuthenticated,
  getAuthHeaders,
  getCustomAuthHeaders,
} from './api.config';

export { userService, default as UserService } from './user.service';
export type { User as UserServiceUser, UserRole } from './user.service';

// Usage:
// import { authService, API_ENDPOINTS, getAuthToken } from './services';