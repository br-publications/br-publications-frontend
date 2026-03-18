/**
 * Validates if a string is a valid URL with http or https protocol.
 * Returns true if empty (since it's typically an optional field).
 */
export const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url || url.trim() === '') return true;
    
    try {
        const parsedUrl = new URL(url);
        // Ensure it has a protocol and it's either http or https
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch (_) {
        return false;
    }
};
