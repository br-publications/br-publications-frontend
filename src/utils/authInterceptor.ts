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

    // Redirect to home page after a small delay to allow the alert to be shown
    setTimeout(() => {
        window.location.href = '/';
    }, 2000);
};

/**
 * Wrap fetch to intercept 401 responses
 * This function wraps the native fetch to automatically handle token expiration
 */
const originalFetch = window.fetch;

// Endpoints where a 401 is an expected failure mode (e.g. invalid credentials)
// and should NOT trigger a global logout
const PUBLIC_ENDPOINTS = [
    '/api/auth/login', 
    '/api/auth/register', 
    '/api/auth/send-otp', 
    '/api/auth/google'
];

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

            // Clone the response to read the body
            const clonedResponse = response.clone();

            try {
                const data = await clonedResponse.json();

                // Check if it's a token expiration or invalidity error
                // We should NOT logout on "No token provided" as it might just be a misconfigured local service call
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
                    // Safe default: if it's not a public endpoint, and there is a token but it was rejected,
                    // we log out by default to be safe, rather than silently ignoring it.
                    console.warn('⚠️ Received 401 Unauthorized outside public endpoints. Logging out...', message);
                    handleTokenExpiration();
                }
            } catch (error) {
                // If we can't parse the response, it's safer to logout on 401 to be secure
                // but usually backend sends JSON for errors.
                console.warn('🔒 Received 401 Unauthorized and couldn\'t parse body. Logging out...');
                handleTokenExpiration();
            }
        }

        return response;
    } catch (error) {
        throw error;
    }
};

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
