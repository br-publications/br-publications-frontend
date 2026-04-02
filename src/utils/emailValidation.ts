/**
 * Simple email validation regex
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address
 */
export const isValidEmail = (email: string | undefined): boolean => {
    if (!email) return false;
    return emailRegex.test(email);
};
