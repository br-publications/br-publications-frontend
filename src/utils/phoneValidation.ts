import { COUNTRIES } from './countries';

/**
 * Validates a phone number string that includes a country code prefix.
 * A phone number is valid if:
 * 1. It is empty or undefined (optional field).
 * 2. It only contains the country code prefix (accepted as "empty").
 * 3. It has at least 10 digits beyond the country code prefix.
 * 
 * @param phone The full phone number string (e.g., "+919876543210")
 * @returns boolean True if valid, false otherwise
 */
export const isValidPhoneNumber = (phone: string | undefined): boolean => {
    if (!phone || phone.trim() === '' || phone.trim() === '+') return true;

    // Sort countries by code length descending to match the most specific prefix first
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);

    // Find the matching country prefix
    const match = sortedCountries.find(c => phone.startsWith(c.code));

    if (!match) {
        // No valid country code prefix found
        return false;
    }

    // Extract the local part after the prefix
    const localPart = phone.slice(match.code.length).replace(/\D/g, '');

    // If only the country code is present, it's considered "empty" (allowed for optional fields)
    if (localPart.length === 0) return true;

    // Minimum 10 digits required for the local part
    return localPart.length >= 10;
};
