/**
 * confBulkValidator.ts
 *
 * CSV parsing + validation for Conference Bulk Upload.
 *
 * CSV columns (one conference per row):
 *   conferenceTitle, publisher, type, code, issn, doi,
 *   publishedDate, dateRange, location, isActive,
 *   article1Title, article1Authors, article1Year, article1Pages, article1Doi,
 *   article1Keywords, article1Abstract,
 *   ...repeat for article2–articleN (up to 30)
 */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export const VALID_CONF_TYPES = [
    'International Conference',
    'National Conference',
    'Symposium',
    'Workshop',
    'Seminar',
] as const;

export interface ParsedConfArticle {
    title: string;
    authorsRaw: string;   // comma-separated → array when submitted
    year: number | null;
    pages: string;
    doi: string;
    keywords: string;     // comma-separated
    abstract: string;
}

export interface ParsedConfEntry {
    rowNumber: number;
    // Conference fields
    conferenceTitle: string;
    publisher: string;
    type: string;
    code: string;
    issn: string;
    doi: string;
    publishedDate: string;
    dateRange: string;
    location: string;
    isActive: boolean;
    // Articles
    articles: ParsedConfArticle[];
}

export interface ConfValidationResult {
    rowNumber: number;
    conferenceTitle: string;
    isValid: boolean;
    errors: Record<string, string>;
    warnings: string[];
}

export type ConfCSVRow = Record<string, string | undefined>;

// ────────────────────────────────────────────────────────────
// Parse a single CSV row
// ────────────────────────────────────────────────────────────

export function parseConfCSVRow(row: ConfCSVRow, rowNumber: number): ParsedConfEntry {
    const str = (v?: string) => (v ?? '').trim();
    const num = (v?: string) => {
        const n = parseInt(str(v), 10);
        return isNaN(n) ? null : n;
    };
    const bool = (v?: string) => {
        const s = str(v).toLowerCase();
        return s === '' || s === 'true' || s === 'yes' || s === '1' || s === 'y'; // default true
    };

    // Parse articles dynamically (article1…article30)
    const articles: ParsedConfArticle[] = [];
    for (let i = 1; i <= 30; i++) {
        const title = str(row[`article${i}Title`]);
        if (!title) break; // stop at first empty article
        articles.push({
            title,
            authorsRaw: str(row[`article${i}Authors`]),
            year: num(row[`article${i}Year`]),
            pages: str(row[`article${i}Pages`]),
            doi: str(row[`article${i}Doi`]),
            keywords: str(row[`article${i}Keywords`]),
            abstract: str(row[`article${i}Abstract`]),
        });
    }

    return {
        rowNumber,
        conferenceTitle: str(row['conferenceTitle']),
        publisher: str(row['publisher']) || 'BR Publications',
        type: str(row['type']) || 'International Conference',
        code: str(row['code']),
        issn: str(row['issn']),
        doi: str(row['doi']),
        publishedDate: str(row['publishedDate']),
        dateRange: str(row['dateRange']),
        location: str(row['location']),
        isActive: bool(row['isActive']),
        articles,
    };
}

// ────────────────────────────────────────────────────────────
// Find duplicate conference titles within the batch
// ────────────────────────────────────────────────────────────

export function findDuplicateConfTitles(entries: ParsedConfEntry[]): Set<string> {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    entries.forEach(e => {
        const key = e.conferenceTitle.toLowerCase();
        if (!key) return;
        if (seen.has(key)) dupes.add(key);
        else seen.add(key);
    });
    return dupes;
}

// ────────────────────────────────────────────────────────────
// Validate a single entry
// ────────────────────────────────────────────────────────────

export function validateConfEntry(
    entry: ParsedConfEntry,
    isBatchDuplicate: boolean
): ConfValidationResult {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Conference title (required)
    if (!entry.conferenceTitle.trim()) {
        errors['conferenceTitle'] = 'Conference title is required.';
    } else if (isBatchDuplicate) {
        errors['conferenceTitle'] = `Duplicate title in this batch: "${entry.conferenceTitle}"`;
    }

    // Publisher (required)
    if (!entry.publisher.trim()) {
        errors['publisher'] = 'Publisher is required.';
    }

    // Type (required + valid)
    if (!entry.type.trim()) {
        errors['type'] = 'Conference type is required.';
    } else if (!VALID_CONF_TYPES.includes(entry.type as any)) {
        errors['type'] = `Invalid type "${entry.type}". Must be one of: ${VALID_CONF_TYPES.join(' | ')}`;
    }

    // ISSN — optional but warn if looks malformed (not matching ####-####)
    if (entry.issn && !/^\d{4}-\d{3}[\dX]$/i.test(entry.issn)) {
        warnings.push(`ISSN "${entry.issn}" may not be in standard format (####-####).`);
    }

    // DOI — optional but warn if provided without prefix
    if (entry.doi && !entry.doi.startsWith('10.')) {
        warnings.push(`DOI "${entry.doi}" usually starts with "10.".`);
    }

    // At least one article required
    if (entry.articles.length === 0) {
        errors['articles'] = 'At least one article (article1Title…) is required.';
    } else {
        // Validate each article
        entry.articles.forEach((art, idx) => {
            const n = idx + 1;
            if (!art.title.trim()) {
                errors[`article${n}Title`] = `Article ${n}: title is required.`;
            }
            if (!art.authorsRaw.trim()) {
                errors[`article${n}Authors`] = `Article ${n}: at least one author is required.`;
            }
            if (art.year !== null && (art.year < 1900 || art.year > 2100)) {
                errors[`article${n}Year`] = `Article ${n}: year must be between 1900 and 2100.`;
            }
        });
    }

    return {
        rowNumber: entry.rowNumber,
        conferenceTitle: entry.conferenceTitle,
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
    };
}

// ────────────────────────────────────────────────────────────
// Download CSV template
// ────────────────────────────────────────────────────────────

export function downloadConfCSVTemplate(): void {
    // Fixed columns
    const fixedHeaders = [
        'conferenceTitle', 'publisher', 'type', 'code', 'issn', 'doi',
        'publishedDate', 'dateRange', 'location', 'isActive',
    ];

    // Article columns for articles 1–5 (user can add more manually)
    const artHeaders: string[] = [];
    for (let i = 1; i <= 5; i++) {
        artHeaders.push(
            `article${i}Title`,
            `article${i}Authors`,
            `article${i}Year`,
            `article${i}Pages`,
            `article${i}Doi`,
            `article${i}Keywords`,
            `article${i}Abstract`,
        );
    }

    const headers = [...fixedHeaders, ...artHeaders];

    // One example row
    const exampleRow = [
        'International Conference on Emerging Technologies 2024',
        'BR Publications',
        'International Conference',
        'ICET-2024',
        '2456-1234',
        '10.12345/icet2024',
        '2024',
        '15-17 March 2024',
        'New Delhi, India',
        'yes',
        // Article 1
        'Machine Learning in Healthcare: A Survey',
        'John Doe, Jane Smith',
        '2024',
        '1-8',
        '10.12345/icet2024.001',
        'machine learning, healthcare, AI',
        'This paper surveys machine learning techniques applied in healthcare.',
        // Article 2
        'IoT-Based Smart Agriculture Systems',
        'Alice Kumar, Bob Sharma',
        '2024',
        '9-15',
        '10.12345/icet2024.002',
        'IoT, agriculture, sensors',
        'An overview of IoT platforms for agricultural monitoring.',
        // Articles 3-5 empty
        '', '', '', '', '', '', '',
        '', '', '', '', '', '', '',
        '', '', '', '', '', '', '',
    ];

    const csvContent = [
        headers.join(','),
        exampleRow.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'conference_bulk_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
