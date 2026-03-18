import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import './googleAuthCallback.css';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setError('Google authentication failed. Please try again.');
          setLoading(false);
          setTimeout(() => navigate('/user/register'), 3000);
          return;
        }

        const storedState = sessionStorage.getItem('google_oauth_state');
        if (!state || state !== storedState) {
          setError('Invalid state parameter. Please try again.');
          setLoading(false);
          setTimeout(() => navigate('/user/register'), 3000);
          return;
        }

        sessionStorage.removeItem('google_oauth_state');
        const flow = sessionStorage.getItem('google_oauth_flow') || 'register';

        if (!code) {
          setError('No authorization code received.');
          setLoading(false);
          setTimeout(() => navigate('/user/register'), 3000);
          return;
        }

        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirectUri: `${window.location.origin}/auth/google/callback`,
            flow: flow
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed');
        }

        // Check if OTP verification is required
        if (data.requiresOtp) {
          setNeedsOtp(true);
          setTempToken(data.tempToken);
          setUserEmail(data.email);
          setLoading(false);
          showAlert('info', 'OTP Verification Required', 'Please verify your email with OTP to complete authentication.');
        } else if (data.token) {
          // Direct authentication without OTP
          localStorage.setItem('authToken', data.token);
          
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }

          navigate('/author/submissions');
        } else {
          throw new Error('No token received from server');
        }

      } catch (err) {
        console.error('Google OAuth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
        setLoading(false);
        setTimeout(() => navigate('/user/register'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  const handleSendOtp = async () => {
    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/google/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          email: userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      showAlert('success', 'OTP Sent', 'A 6-digit OTP has been sent to your email.');
    } catch (error) {
      showAlert('error', 'Failed to Send OTP', error instanceof Error ? error.message : 'An error occurred.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      showAlert('error', 'Invalid OTP', 'Please enter a 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/google/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          otp: otp
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        showAlert('success', 'Verification Successful', 'Authentication complete!');
        
        setTimeout(() => {
          navigate('/author/submissions');
        }, 1500);
      }
    } catch (error) {
      showAlert('error', 'Verification Failed', error instanceof Error ? error.message : 'Invalid or expired OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-box">
        {loading ? (
          <>
            <div className="spinner"></div>
            <h2>Authenticating with Google...</h2>
            <p>Please wait while we complete your sign {sessionStorage.getItem('google_oauth_flow') === 'login' ? 'in' : 'up'}.</p>
          </>
        ) : needsOtp ? (
          <>
            <h2>Verify Your Email</h2>
            <p className="otp-description">
              We've sent a 6-digit OTP to <strong>{userEmail}</strong>
            </p>
            
            <form onSubmit={handleVerifyOtp} className="otp-form">
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
                <button type="submit" className="btn-verify" disabled={otpLoading}>
                  {otpLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>
                <button 
                  type="button" 
                  className="btn-resend" 
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </>
        ) : error ? (
          <>
            <div className="error-icon">⚠️</div>
            <h2>Authentication Error</h2>
            <p className="error-text">{error}</p>
            <p className="redirect-text">Redirecting you back to registration...</p>
          </>
        ) : null}
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

export default GoogleAuthCallback;