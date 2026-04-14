/**
 * Simple email validation regex
 */
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address
 */
export const isValidEmail = (email: string | undefined): boolean => {
    if (!email) return false;
    return emailRegex.test(email);
};
