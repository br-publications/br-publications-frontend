import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import { authService } from '../../services/auth.service';
import './register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [currentSection, setCurrentSection] = useState<'register' | 'otp'>('register');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user was redirected from login for email verification
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromLogin && state?.email && state?.requiresVerification) {
      // User needs to verify email
      setFormData(prev => ({
        ...prev,
        email: state.email
      }));
      setCurrentSection('otp');
      showAlert('info', 'Email Verification Required', 'Please verify your email to complete login.');
    }
  }, [location]);

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Auto-trim email fields to prevent accidental spaces
    const processedValue = name === 'email' ? value.trim() : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error for this field
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    let hasErrors = false;
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    // Validate email
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    // Validate password
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)';
      hasErrors = true;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      showAlert('error', 'Validation Error', 'Please fix the errors in the form.');
      return;
    }

    // Call API using auth service
    setLoading(true);
    try {
      const result = await authService.register({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      showAlert('success', 'Registration Successful', result.message || 'Please verify your email with OTP.');
      setCurrentSection('otp');
    } catch (error: any) {
      // Check for structured field errors from backend
      if (error.data || error.errors) {
        const fieldErrors = error.data || error.errors;
        setErrors(prev => ({
          ...prev,
          ...fieldErrors
        }));
        showAlert('error', 'Registration Conflict', error.message || 'Please correct the highlighted fields.');
      } else {
        showAlert('error', 'Registration Failed', error instanceof Error ? error.message : 'An error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const result = await authService.sendOTP(formData.email);
      setOtpSent(true);
      showAlert('success', 'OTP Sent', result.message || 'A 6-digit OTP has been sent to your email.');
    } catch (error) {
      showAlert('error', 'Failed to Send OTP', error instanceof Error ? error.message : 'An error occurred while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      showAlert('error', 'Invalid OTP', 'Please enter a 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyEmail({
        email: formData.email,
        otp: otp
      });

      showAlert('success', 'Verification Successful', result.message || 'Your account has been verified successfully!');

      // Check if user came from login page
      const state = location.state as any;
      if (state?.fromLogin) {
        // Redirect back to login after successful verification
        setTimeout(() => {
          navigate('/login', {
            state: {
              emailVerified: true,
              message: 'Email verified! Please login to continue.'
            }
          });
        }, 2000);
      } else {
        // New registration - redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      showAlert('error', 'Verification Failed', error instanceof Error ? error.message : 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRegister = () => {
    // Check if user came from login
    const state = location.state as any;
    if (state?.fromLogin) {
      // Redirect back to login instead of showing register form
      navigate('/login');
    } else {
      // Normal flow - go back to register form
      setCurrentSection('register');
      setOtpSent(false);
      setOtp('');
    }
  };

  const handleGoogleSignUp = () => {
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';
    const state = Math.random().toString(36).substring(7);

    sessionStorage.setItem('google_oauth_state', state);
    sessionStorage.setItem('google_oauth_flow', 'register');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope: scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    window.location.href = `${googleAuthUrl}?${params.toString()}`;
  };

  // Check if user came from login for verification
  const isFromLogin = (location.state as any)?.fromLogin;

  return (
    <div className="register-page-container">
      <div className="register-form-box">
        {currentSection === 'register' ? (
          <>
            <h2>Create Account</h2>
            <form onSubmit={handleRegisterSubmit}>
              <div className="input-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
                {errors.username && <span className="register-error-message">{errors.username}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="email">Email ID *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                {errors.email && <span className="register-error-message">{errors.email}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="password">Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="password-input-with-toggle"
                    required
                  />
                  {formData.password && (
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  )}
                </div>
                {errors.password && <span className="register-error-message">{errors.password}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleConfirmPasswordBlur}
                    className="password-input-with-toggle"
                    required
                  />
                  {formData.confirmPassword && (
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  )}
                </div>
                {errors.confirmPassword && <span className="register-error-message">{errors.confirmPassword}</span>}
              </div>

              <div className="register-actions">
                <button type="submit" className="btn-next" disabled={loading}>
                  {loading ? 'Processing...' : 'Next'}
                </button>
              </div>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <button type="button" className="btn-google" onClick={handleGoogleSignUp}>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>

            <div className="login-link">
              Already have an account? <Link to="/login">Login here</Link>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-back"
              onClick={handleBackToRegister}
            >
              ← Back {isFromLogin ? 'to Login' : ''}
            </button>

            <h2>{isFromLogin ? 'Email Verification Required' : 'Verify Email'}</h2>
            <p className="otp-description">
              {isFromLogin
                ? 'Your email is not verified. Please verify to continue login.'
                : 'We need to verify your email address to complete registration.'}
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="input-group">
                <label htmlFor="emailDisplay">Email ID</label>
                <input
                  type="email"
                  id="emailDisplay"
                  value={formData.email}
                  disabled
                  className="disabled-input"
                />
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  className="btn-send-otp"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="otp">Enter OTP *</label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setOtp(value);
                      }}
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="otp-actions">
                    <button type="submit" className="btn-verify" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                    <button
                      type="button"
                      className="btn-resend"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>
                </>
              )}
            </form>
          </>
        )}
      </div>

      <AlertPopup
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />
    </div>
  );
};

export default Register;