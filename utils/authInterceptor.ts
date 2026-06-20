// src/utils/authInterceptor.ts

/**
 * Global Authentication Interceptor
 * Handles token expiration and automatic logout
 */

import { removeAuthToken } from '../services/api.config';

/**
 * Handle logout and redirect to home
 */
export const handleTokenExpiration = () => {
    // Clear authentication data
    removeAuthToken();

    // Show user-friendly message using the custom event mechanism
    window.dispatchEvent(new CustomEvent('app-alert', {
        detail: {
            type: 'error',
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again to continue.'
        }
    }));

    // Redirect to home page only if we are currently on a dashboard route
    // Public pages should just show the error alert but stay on the page
    if (window.location.pathname.startsWith('/dashboard')) {
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }
};

/**
 * Wrap fetch to intercept 401 responses
 * This function wraps the native fetch to automatically handle token expiration
 */
let originalFetch: typeof fetch;
if (typeof window !== 'undefined') {
    originalFetch = window.fetch;
}
// Endpoints where a 401 is an expected failure mode (e.g. invalid credentials)
// and should NOT trigger a global logout
const PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send-otp',
    '/api/auth/google'
];

if (typeof window !== 'undefined') {
    window.fetch = async (...args) => {
        try {
            const response = await originalFetch(...args);

            // Check if response is 401 Unauthorized
            if (response.status === 401) {
                // Check if this request was to a public endpoint
                const urlOptions = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
                const isPublicEndpoint = PUBLIC_ENDPOINTS.some(ep => urlOptions.includes(ep));

                if (isPublicEndpoint) {
                    // Ignore 401 for login/register as it just means invalid credentials
                    return response;
                }

                // Phase 3 Hardening: Don't trigger global logout if NO token was even sent.
                // This happens on public pages that call auth-optional endpoints.
                const headers = args[1]?.headers as any;
                const hasToken = headers?.['Authorization'] || headers?.['authorization'];

                if (!hasToken) {
                    return response;
                }

                // Clone the response to read the body
                const clonedResponse = response.clone();

                try {
                    const data = await clonedResponse.json();

                    // Check if it's a token expiration or invalidity error
                    const message = data.message?.toLowerCase() || '';
                    const isTokenError =
                        message.includes('expired') ||
                        message.includes('invalid') ||
                        message.includes('role changed') ||
                        message.includes('deactivated');

                    if (isTokenError) {
                        console.warn('🔒 Token expired or invalid. Logging out...', message);
                        handleTokenExpiration();
                    } else if (!message.includes('no token') && !message.includes('missing auth token')) {
                        // Safe default: if there was a token but it was rejected, we log out.
                        console.warn('⚠️ Received 401 Unauthorized with token. Logging out...', message);
                        handleTokenExpiration();
                    }
                } catch (error) {
                    console.warn('🔒 Received 401 Unauthorized and couldn\'t parse body. Logging out...');
                    handleTokenExpiration();
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    };
}

/**
 * Initialize the auth interceptor
 * Call this once when the app starts
 */
export const initAuthInterceptor = () => {

};

export default {
    handleTokenExpiration,
    initAuthInterceptor,
};
