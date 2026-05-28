/**
 * Converts a string into a URL-friendly slug.
 * Example: "Hello World! @2024" -> "hello-world-2024"
 */
export const toSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars (except -)
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Generates a unique 6-digit slug in the format uid=XXXXXX
 * based on the book's ISBN and Release Date.
 */
export const generateUniqueSlug = (isbn: string, releaseDate?: string): string => {
  const combined = `${isbn}${releaseDate || ''}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);
  const sixDigit = (positiveHash % 1000000).toString().padStart(6, '0');
  return `uid=${sixDigit}`;
};

/**
 * Converts a book title into a clean SEO-friendly slug.
 * Truncates at max 60 characters and aligns to natural word boundaries.
 */
export const toBookNameSlug = (text: string): string => {
  if (!text) return '';
  const slug = toSlug(text);
  if (slug.length <= 60) return slug;
  
  // Truncate to 60 characters
  let truncated = slug.slice(0, 60);
  
  // Back up to the last complete word/hyphen boundary to avoid cutting a word in half
  const lastHyphenIndex = truncated.lastIndexOf('-');
  if (lastHyphenIndex > 0) {
    truncated = truncated.slice(0, lastHyphenIndex);
  }
  
  return truncated.replace(/-+$/, '');
};

