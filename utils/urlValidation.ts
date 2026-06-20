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
    } catch {
        return false;
    }
};

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Sanitizes an external URL. 
 * If the URL attempts to use a dangerous protocol (like javascript:), it strips it and returns '#'.
 * 
 * @param url The URL string to validate
 * @returns A strictly safe URL string
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
    if (!url) return '#';
    
    try {
        if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
            return url;
        }

        const urlToParse = url.includes('://') || url.startsWith('mailto:') || url.startsWith('tel:') 
            ? url 
            : `https://${url}`;

        const parsedUrl = new URL(urlToParse);
        
        if (ALLOWED_PROTOCOLS.includes(parsedUrl.protocol.toLowerCase())) {
            return parsedUrl.toString();
        }

        console.warn(`Blocked potentially dangerous URL protocol: ${parsedUrl.protocol}`);
        return '#';
    } catch {
        return '#';
    }
};
