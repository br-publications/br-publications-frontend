'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../../services/auth.service';
import { setAuthToken, setStoredUser } from '../../services/api.config';

/**
 * GoogleCallbackHandler
 *
 * Rendered at /auth/google/callback.
 * Google redirects here with ?code=...&state=...
 * after the user grants consent on the Google sign-in screen.
 *
 * Flow:
 *  1. Extract `code` from URL params
 *  2. POST to /api/auth/google/callback to exchange code for tokens
 *  3. If backend says requiresOtp → redirect to /login with OTP state
 *  4. On direct success (no OTP) → save JWT + user → redirect home
 */
const GoogleCallbackHandler: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const savedState = sessionStorage.getItem('google_oauth_state');
            const savedFlow = sessionStorage.getItem('google_oauth_flow') as 'login' | 'register' || 'login';

            // Clean up session storage
            sessionStorage.removeItem('google_oauth_state');
            sessionStorage.removeItem('google_oauth_flow');

            // Validate state to prevent CSRF
            if (!code) {
                setErrorMessage('No authorization code received from Google. Please try again.');
                setStatus('error');
                return;
            }

            if (state && savedState && state !== savedState) {
                setErrorMessage('Invalid OAuth state. Please try signing in again.');
                setStatus('error');
                return;
            }

            try {
                const redirectUri = `${window.location.origin}/auth/google/callback`;

                const result = await authService.googleAuthCallback({
                    code,
                    redirectUri,
                    flow: savedFlow,
                });

                if (result.data?.requiresOtp) {
                    // Backend sent OTP to user's email — store data in sessionStorage
                    // then navigate to login OTP step
                    sessionStorage.setItem('google_otp_pending', JSON.stringify({
                        googleOtp: true,
                        email: result.data.email,
                        tempToken: result.data.tempToken,
                        isNewUser: result.data.isNewUser ?? false,
                    }));
                    router.replace('/login');
                } else if (result.data?.token && result.data?.user) {
                    // Immediate login (no OTP required) — store via centralized functions (sessionStorage)
                    setAuthToken(result.data.token);
                    setStoredUser(result.data.user);
                    window.dispatchEvent(new Event('auth-changed'));
                    router.push('/', { replace: true });
                } else {
                    throw new Error('Unexpected response from server.');
                }
            } catch (err: any) {
                setErrorMessage(err?.message || 'Google authentication failed. Please try again.');
                setStatus('error');
            }
        };

        handleCallback();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
            background: '#f5f5f5',
        }}>
            {status === 'loading' ? (
                <>
                    <div style={{
                        width: 48,
                        height: 48,
                        border: '4px solid #e0e0e0',
                        borderTopColor: '#1e5292',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: 20,
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#555', fontSize: 16 }}>Signing you in with Google…</p>
                </>
            ) : (
                <>
                    <div style={{
                        background: '#fff',
                        padding: '32px 40px',
                        borderRadius: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        textAlign: 'center',
                        maxWidth: 420,
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
                        <h2 style={{ color: '#d32f2f', margin: '0 0 12px' }}>Sign-in Failed</h2>
                        <p style={{ color: '#555', marginBottom: 24 }}>{errorMessage}</p>
                        <button
                            onClick={() => router.push('/login')}
                            style={{
                                background: '#1e5292',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '12px 28px',
                                fontSize: 15,
                                cursor: 'pointer',
                            }}
                        >
                            Back to Login
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default GoogleCallbackHandler;
