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



/**
 * Shortens text for meta descriptions without cutting a word in half.
 * Cuts at the last space before `max` and appends an ellipsis when truncated.
 */
export const truncateAtWord = (text: string, max = 160): string => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, '');
  return `${base}…`;
};

/**
 * Cleans a keyword list for citation_keywords: trims whitespace, removes trailing
 * periods/commas/semicolons, and drops empty or duplicate entries.
 */
export const cleanKeywordList = (keywords: unknown[] | undefined | null): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keywords || []) {
    const v = String(k ?? '').trim().replace(/[\s.,;:]+$/, '');
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out;
};

/**
 * Chapters have no keywords of their own, so keep only the book-level keywords the chapter
 * actually discusses (phrase or "(ACRONYM)" found in its title/abstract). Returns [] when
 * nothing matches, so callers omit the tag rather than emit unrelated topics.
 */
export const filterKeywordsForChapter = (
  keywords: string[],
  title: string | undefined | null,
  abstract: string | undefined | null,
): string[] => {
  const norm = (s: string) => ` ${s.toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[-–—_/]/g, ' ').replace(/[^a-z0-9()\s]/g, ' ').replace(/\s+/g, ' ')} `;
  const rawText = `${title || ''} ${abstract || ''}`.replace(/<[^>]+>/g, ' ');
  const text = norm(rawText);
  return keywords.filter(k => {
    const acronym = k.match(/\(([A-Za-z0-9]{2,10})\)/)?.[1];
    const phrase = norm(k.replace(/\([^)]*\)/g, ' ')).trim();
    if (phrase && text.includes(` ${phrase} `)) return true;
    if (phrase && phrase.length > 3 && text.includes(` ${phrase}s `)) return true;
    return !!acronym && new RegExp(`(^|[^A-Za-z0-9])${acronym}([^A-Za-z0-9]|$)`).test(rawText);
  });
};

/**
 * Builds a meta/OG/JSON-LD description: strips HTML, prefers whole sentences up to `max`
 * characters, and otherwise cuts at a word boundary (no ellipsis, never mid-word).
 */
export const toMetaDescription = (text: string, max = 155): string => {
  const clean = (text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const window = clean.slice(0, max + 1);
  // Longest run of whole sentences that fits (sentence end followed by space)
  const sentenceEnds = [...window.matchAll(/[.!?](?=\s)/g)].map(m => (m.index ?? 0) + 1);
  const lastEnd = sentenceEnds.filter(i => i <= max).pop();
  if (lastEnd && lastEnd >= max * 0.5) return window.slice(0, lastEnd).trim();
  const lastSpace = window.lastIndexOf(' ');
  const base = lastSpace > max * 0.5 ? window.slice(0, lastSpace) : clean.slice(0, max);
  return base.replace(/[\s,;:\-–—]+$/, '') + '.';
};

/** Strips wrapping parentheses and a trailing period from an affiliation string. */
export const cleanAffiliation = (aff?: string | null): string =>
  (aff || '').trim().replace(/^\((.*)\)$/, '$1').trim().replace(/\.+$/, '').trim();
