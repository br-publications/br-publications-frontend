import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import { authService } from '../../services/auth.service';
import './login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentSection, setCurrentSection] = useState<'login' | 'otp'>('login');
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [userEmail, setUserEmail] = useState('');
  // Google OAuth OTP state
  const [isGoogleOtp, setIsGoogleOtp] = useState(false);
  const [googleTempToken, setGoogleTempToken] = useState('');
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);

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

  // Check if user was redirected from register after verification
  // OR from Google OAuth callback
  useEffect(() => {
    const state = location.state as any;
    if (state?.message) {
      const isVerified = !!state.emailVerified;
      showAlert(isVerified ? 'success' : 'info', isVerified ? 'Email Verified' : 'Authentication Required', state.message);
    }
    // Redirected from GoogleCallbackHandler — jump straight to OTP
    if (state?.googleOtp && state?.email && state?.tempToken) {
      setIsGoogleOtp(true);
      setUserEmail(state.email);
      setGoogleTempToken(state.tempToken);
      setIsNewGoogleUser(state.isNewUser ?? false);
      setCurrentSection('otp');
      showAlert(
        'success',
        state.isNewUser ? 'Account Created!' : 'Welcome Back!',
        `An OTP has been sent to ${state.email}. Please verify to complete sign-in.`
      );
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usernameOrEmail || !formData.password) {
      showAlert('error', 'Validation Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({
        usernameOrEmail: formData.usernameOrEmail,
        password: formData.password
      });

      // Store email for OTP verification
      if (result.data?.email) {
        setUserEmail(result.data.email);
      }

      // Move to OTP verification
      setCurrentSection('otp');
      showAlert('success', 'OTP Sent', result.message || 'An OTP has been sent to your email for verification.');

    } catch (error: any) {
      // Check if error is due to unverified email
      if (error.message && error.message.includes('Email not verified')) {
        // Extract email from error if available
        const emailMatch = error.message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        const email = emailMatch ? emailMatch[0] : formData.usernameOrEmail;

        showAlert('warning', 'Email Not Verified', 'Your email is not verified. Redirecting to verification page...');

        // Redirect to register page with email for verification
        setTimeout(() => {
          navigate('/user/register', {
            state: {
              fromLogin: true,
              email: email,
              requiresVerification: true
            }
          });
        }, 2000);
        return;
      }

      // Handle other errors
      showAlert('error', 'Login Failed', error instanceof Error ? error.message : 'Invalid credentials.');
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
      let result;

      if (isGoogleOtp) {
        // Google OAuth OTP verification
        result = await authService.googleVerifyOTP(otp, googleTempToken);
      } else {
        result = await authService.verifyLoginOTP({
          email: userEmail,
          otp: otp
        });
      }

      // Store user data and token
      if (result.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      if (result.data?.token) {
        localStorage.setItem('authToken', result.data.token);
      }

      // Dispatch custom event to notify Dashboard of auth change
      window.dispatchEvent(new Event('auth-changed'));

      showAlert('success', 'Login Successful', isNewGoogleUser ? 'Welcome to BR Publications!' : 'Welcome back!');

      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error: any) {
      if (error.message && error.message.includes('Email not verified')) {
        showAlert('warning', 'Email Not Verified', 'Your email is not verified. Redirecting to verification page...');

        setTimeout(() => {
          navigate('/user/register', {
            state: {
              fromLogin: true,
              email: userEmail,
              requiresVerification: true
            }
          });
        }, 2000);
        return;
      }

      showAlert('error', 'Verification Failed', error instanceof Error ? error.message : 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      if (isGoogleOtp) {
        // Resend OTP for Google OAuth users
        await authService.googleSendOTP(userEmail, googleTempToken);
      } else {
        // Re-attempt normal login to get new OTP
        await authService.login({
          usernameOrEmail: formData.usernameOrEmail,
          password: formData.password
        });
      }
      showAlert('success', 'OTP Sent', 'A new OTP has been sent to your email.');
    } catch (error) {
      showAlert('error', 'Failed to Send OTP', error instanceof Error ? error.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';
    const state = Math.random().toString(36).substring(7);

    sessionStorage.setItem('google_oauth_state', state);
    sessionStorage.setItem('google_oauth_flow', 'login');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope: scope,
      state: state,
      access_type: 'offline',
      prompt: 'select_account'
    });

    window.location.href = `${googleAuthUrl}?${params.toString()}`;
  };

  const handleBackToLogin = () => {
    setCurrentSection('login');
    setOtp('');
  };

  return (
    <div className="login-page-container">
      <div className="login-form-box">
        {currentSection === 'login' ? (
          <>
            <h2>Login</h2>
            <form onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label htmlFor="usernameOrEmail">Username / Email ID *</label>
                <input
                  type="text"
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  placeholder="Enter your username or email"
                  value={formData.usernameOrEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
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
              </div>

              <div className="forgot-password-link">
                <Link to="/forgot-password">Forgot username / password?</Link>
              </div>

              <div className="login-actions">
                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <Link to="/user/register" className="btn-register">Register</Link>
              </div>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <button type="button" className="btn-google" onClick={handleGoogleLogin}>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-back"
              onClick={handleBackToLogin}
            >
              ← Back
            </button>

            <h2>Verify Identity</h2>
            <p className="otp-description">
              Please verify your identity with the OTP sent to your email.
            </p>

            <form onSubmit={handleVerifyOtp}>
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
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  className="btn-resend"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
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

export default Login;