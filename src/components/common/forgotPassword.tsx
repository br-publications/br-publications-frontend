import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import AlertPopup, { type AlertType } from '../../components/common/alertPopup';
import { authService } from '../../services/auth.service';
import './forgotPassword.css';

type StepType = 'email' | 'otp' | 'reset';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const [currentStep, setCurrentStep] = useState<StepType>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  // Track which fields have been touched
  const [touched, setTouched] = useState({
    email: false,
    newPassword: false,
    confirmPassword: false
  });
  
  const [errors, setErrors] = useState({
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

  // Validate email field
  const validateEmail = () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  // Validate password field
  const validatePassword = () => {
    if (!newPassword) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (!passwordRegex.test(newPassword)) {
      setErrors(prev => ({ 
        ...prev, 
        password: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)' 
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  // Validate confirm password field
  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  // Handle field blur events
  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    if (touched.email || email) {
      validateEmail();
    }
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, newPassword: true }));
    if (touched.newPassword || newPassword) {
      validatePassword();
    }
  };

  const handleConfirmPasswordBlur = () => {
    setTouched(prev => ({ ...prev, confirmPassword: true }));
    if (touched.confirmPassword || confirmPassword) {
      validateConfirmPassword();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark as touched
    setTouched(prev => ({ ...prev, email: true }));
    
    // Validate email
    if (!validateEmail()) {
      showAlert('error', 'Validation Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.forgotPassword({ email });
      
      setCurrentStep('otp');
      showAlert('success', 'OTP Sent', result.message || 'A 6-digit OTP has been sent to your email.');
    } catch (error) {
      showAlert('error', 'Failed to Send OTP', error instanceof Error ? error.message : 'An error occurred.');
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
      const result = await authService.verifyResetOTP({
        email,
        otp
      });

      if (result.data?.resetToken) {
        setResetToken(result.data.resetToken);
      }
      
      setCurrentStep('reset');
      showAlert('success', 'Verification Successful', result.message || 'You can now reset your password.');
    } catch (error) {
      showAlert('error', 'Verification Failed', error instanceof Error ? error.message : 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark fields as touched
    setTouched(prev => ({ 
      ...prev, 
      newPassword: true, 
      confirmPassword: true 
    }));
    
    // Validate all fields
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    if (!isPasswordValid || !isConfirmPasswordValid) {
      showAlert('error', 'Validation Error', 'Please fix the errors in the form.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(
        {
          email,
          newPassword,
          confirmPassword
        },
        resetToken
      );

      showAlert('success', 'Password Reset Successful', result.message || 'Your password has been reset successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred.';
      showAlert('error', 'Reset Failed', errorMessage);
      
      // Auto-redirect to login if session expired
      if (errorMessage.toLowerCase().includes('expired')) {
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const result = await authService.forgotPassword({ email });
      showAlert('success', 'OTP Sent', result.message || 'A new OTP has been sent to your email.');
    } catch (error) {
      showAlert('error', 'Failed to Send OTP', error instanceof Error ? error.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setOtp('');
    setResetToken('');
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        {currentStep === 'email' && (
          <>
            <h2>Forgot Password</h2>
            <p className="forgot-description">
              Enter your email address and we'll send you an OTP to reset your password.
            </p>
            
            <form onSubmit={handleSendOtp}>
              <div className="input-group">
                <label htmlFor="email">Email Address *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      // Clear error as user types
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                    }
                  }}
                  onBlur={handleEmailBlur}
                  className={touched.email && errors.email ? 'input-error' : ''}
                  required 
                />
                {touched.email && errors.email && (
                  <span className="forgot-error-message">{errors.email}</span>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>

            <div className="back-to-login">
              <Link to="/login">← Back to Login</Link>
            </div>
          </>
        )}

        {currentStep === 'otp' && (
          <>
            <button 
              type="button" 
              className="btn-back" 
              onClick={handleBackToEmail}
            >
              ← Back
            </button>
            
            <h2>Verify OTP</h2>
            <p className="forgot-description">
              Enter the 6-digit OTP sent to <strong>{email}</strong>
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
                  {loading ? 'Verifying...' : 'Verify OTP'}
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

        {currentStep === 'reset' && (
          <>
            <h2>Reset Password</h2>
            <p className="forgot-description">
              Create a new password for your account.
            </p>
            
            <form onSubmit={handleResetPassword}>
              <div className="input-group">
                <label htmlFor="newPassword">New Password *</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword" 
                    name="newPassword" 
                    placeholder="Enter new password" 
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (touched.newPassword) {
                        // Clear error as user types
                        if (errors.password) {
                          setErrors(prev => ({ ...prev, password: '' }));
                        }
                      }
                    }}
                    onBlur={handlePasswordBlur}
                    className={`password-input-with-toggle ${touched.newPassword && errors.password ? 'input-error' : ''}`}
                    required 
                  />
                  {newPassword && (
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  )}
                </div>
                {touched.newPassword && errors.password && (
                  <span className="forgot-error-message">{errors.password}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="Confirm new password" 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (touched.confirmPassword) {
                        // Clear error as user types
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }
                      }
                    }}
                    onBlur={handleConfirmPasswordBlur}
                    className={`password-input-with-toggle ${touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}`}
                    required 
                  />
                  {confirmPassword && (
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
                {touched.confirmPassword && errors.confirmPassword && (
                  <span className="forgot-error-message">{errors.confirmPassword}</span>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
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

export default ForgotPassword;