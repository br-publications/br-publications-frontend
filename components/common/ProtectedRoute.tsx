'use client';
// src/components/common/ProtectedRoute.tsx

/**
 * ProtectedRoute - Server-Side Role Validation Guard
 *
 * Unlike a client-side check that reads role from localStorage/sessionStorage
 * (which can be tampered with via DevTools), this component calls the backend
 * /api/auth/me endpoint on every mount to:
 *   1. Confirm the JWT token is valid (not expired / revoked)
 *   2. Confirm the user's actual role from the database
 *   3. Redirect to /login if unauthenticated
 *   4. Show a 403 Forbidden screen if authenticated but wrong role
 */

import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'next/navigation';
import { authService } from '../../services/auth.service';
import { getAuthToken, setStoredUser } from '../../services/api.config';
import Link from 'next/link';

interface ProtectedRouteProps {
  /** Roles that are allowed to access this route. Empty array = any authenticated user. */
  allowedRoles?: string[];
}

type AuthStatus = 'checking' | 'authorized' | 'unauthorized' | 'forbidden';

export default function ProtectedRoute({ allowedRoles = [] }: ProtectedRouteProps) {
  const [status, setStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    const verify = async () => {
      // Quick short-circuit: if no token at all, reject immediately
      if (!getAuthToken()) {
        setStatus('unauthorized');
        return;
      }

      try {
        // Call backend to validate token and get fresh user data
        const response = await authService.getCurrentUser();

        if (!response.success || !response.data) {
          setStatus('unauthorized');
          return;
        }

        const userRole = (response.data.role || 'user').toLowerCase();

        // Refresh sessionStorage with server-confirmed data
        setStoredUser(response.data);

        // Role check: if no roles are specified, any authenticated user is allowed
        if (allowedRoles.length === 0) {
          setStatus('authorized');
          return;
        }

        const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
        if (normalizedAllowed.includes(userRole)) {
          setStatus('authorized');
        } else {
          setStatus('forbidden');
        }
      } catch {
        // Network error or 401 — treat as unauthorized
        setStatus('unauthorized');
      }
    };

    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#1e5292', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Verifying access…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace state={{ message: 'Please login to access this page.' }} />;
  }

  if (status === 'forbidden') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: 380 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: '#1f2937', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Access Denied</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
            You don't have permission to view this page. Please contact an administrator if you believe this is an error.
          </p>
          <Link href="/dashboard"
            style={{ display: 'inline-block', padding: '10px 24px', background: '#1e5292', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Authorized — render the child routes
  return <Outlet />;
}
