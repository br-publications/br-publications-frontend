// Bulk Upload Validator - Reuses validation logic from TextBookPublishingForm

import type { CSVTemplateData } from './csvTemplateGenerator';
import { isValidPhoneNumber } from './phoneValidation';

export interface ParsedBookEntry {
    rowNumber: number;
    bookTitle: string;
    mainAuthor: {
        firstName: string;
        lastName: string;
        email: string;
        institute: string;
        city: string;
        state: string;
        country: string;
        phoneNumber: string;
    };
    coAuthors: Array<{
        firstName: string;
        lastName: string;
        email: string;
        institute: string;
        phoneNumber?: string;
    }>;
    isbn: string;
    doi: string;
    pages: number;
    copyright: string;
    releaseDate: string;
    category: string;
    description: string;
    keywords: string[];
    indexedIn: string[];
    pricing: {
        softCopyPrice: number;
        hardCopyPrice: number;
        bundlePrice: number;
    };
    googleLink?: string;
    flipkartLink?: string;
    amazonLink?: string;
    coverImageFilename: string;
    matchedCoverImage?: File;
}

export interface ValidationResult {
    rowNumber: number;
    isValid: boolean;
    errors: Record<string, string>;
    warnings: string[];
}

/**
 * Normalizes date string to YYYY-MM-DD format
 * Accepts: YYYY-MM-DD, DD-MM-YYYY
 */
function normalizeDate(dateStr: string): string {
    if (!dateStr) return '';

    // Check if already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Check if DD-MM-YYYY
    const ddmmyyyyRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateStr.match(ddmmyyyyRegex);
    if (match) {
        const [_, day, month, year] = match;
        return `${year}-${month}-${day}`;
    }

    return dateStr; // Return original if no match, validation will catch it
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a single parsed book entry
 */
export function validateBookEntry(
    entry: ParsedBookEntry,
    hasMatchedImage: boolean,
    isDuplicateISBN: boolean = false,
    isServerDuplicate: boolean = false
): ValidationResult {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Required fields check
    if (!entry.bookTitle?.trim()) errors.bookTitle = 'Book Title is required';
    if (!entry.mainAuthor.firstName?.trim()) errors.mainAuthorFirstName = 'Main Author First Name is required';
    if (!entry.mainAuthor.lastName?.trim()) errors.mainAuthorLastName = 'Main Author Last Name is required';
    if (!entry.mainAuthor.email?.trim()) errors.mainAuthorEmail = 'Main Author Email is required';

    // ISBN validation
    if (!entry.isbn?.trim()) {
        errors.isbn = 'ISBN is required';
    } else if (isDuplicateISBN) {
        errors.isbn = 'Duplicate ISBN detected in this batch';
    } else if (isServerDuplicate) {
        errors.isbn = 'ISBN already exists in the system';
    }

    // DOI validation - Optional
    if (!entry.doi?.trim()) {
        warnings.push('DOI is not specified');
    }

    // Pages validation
    if (!entry.pages || entry.pages <= 0) {
        errors.pages = 'Pages must be greater than 0';
    }

    // Copyright validation
    if (!entry.copyright?.trim()) {
        errors.copyright = 'Copyright year is required';
    }

    // Release date validation
    if (!entry.releaseDate) {
        errors.releaseDate = 'Release date is required';
    } else {
        // Validate format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(entry.releaseDate)) {
            errors.releaseDate = 'Release date must be in YYYY-MM-DD format';
        } else {
            const date = new Date(entry.releaseDate);
            if (isNaN(date.getTime())) {
                errors.releaseDate = 'Invalid date';
            }
        }
    }

    // Indexed In validation
    if (!entry.indexedIn || entry.indexedIn.length === 0) {
        errors.indexedIn = 'Select at least one database';
    }

    // Pricing validation
    if (!entry.pricing.softCopyPrice || entry.pricing.softCopyPrice <= 0) {
        errors.softCopyPrice = 'Soft copy price must be greater than 0';
    }
    if (!entry.pricing.hardCopyPrice || entry.pricing.hardCopyPrice <= 0) {
        errors.hardCopyPrice = 'Hard copy price must be greater than 0';
    }
    if (!entry.pricing.bundlePrice || entry.pricing.bundlePrice <= 0) {
        errors.bundlePrice = 'Bundle price must be greater than 0';
    }

    // Main Author validation
    if (!entry.mainAuthor.firstName?.trim()) {
        errors.mainAuthorFirstName = 'Main Author First Name is required';
    }
    if (!entry.mainAuthor.lastName?.trim()) {
        errors.mainAuthorLastName = 'Main Author Last Name is required';
    }
    if (!entry.mainAuthor.email?.trim()) {
        errors.mainAuthorEmail = 'Main Author Email is required';
    } else if (!emailRegex.test(entry.mainAuthor.email)) {
        errors.mainAuthorEmail = 'Invalid email format';
    }
    if (!entry.mainAuthor.institute?.trim()) {
        errors.mainAuthorInstitute = 'Main Author Institute is required';
    }
    if (entry.mainAuthor.phoneNumber && !isValidPhoneNumber(entry.mainAuthor.phoneNumber)) {
        errors.mainAuthorPhone = 'Main Author phone number must be at least 10 digits';
    }

    // Co-Authors validation
    entry.coAuthors.forEach((author, index) => {
        // Only validate if at least one field is filled
        const hasAnyField = author.firstName || author.lastName || author.email || author.institute;

        if (hasAnyField) {
            if (!author.firstName?.trim()) {
                errors[`coAuthor${index + 1}FirstName`] = `Co-Author ${index + 1} First Name is required`;
            }
            if (!author.lastName?.trim()) {
                errors[`coAuthor${index + 1}LastName`] = `Co-Author ${index + 1} Last Name is required`;
            }
            if (!author.email?.trim()) {
                errors[`coAuthor${index + 1}Email`] = `Co-Author ${index + 1} Email is required`;
            } else if (!emailRegex.test(author.email)) {
                errors[`coAuthor${index + 1}Email`] = 'Invalid email format';
            }
            if (!author.institute?.trim()) {
                errors[`coAuthor${index + 1}Institute`] = `Co-Author ${index + 1} Institute is required`;
            }
            if (author.phoneNumber && !isValidPhoneNumber(author.phoneNumber)) {
                errors[`coAuthor${index + 1}Phone`] = `Co-Author ${index + 1} phone number must be at least 10 digits`;
            }
        }
    });

    // Cover image validation
    if (!entry.coverImageFilename?.trim()) {
        errors.coverImageFilename = 'Cover image filename is required';
    } else if (!hasMatchedImage) {
        errors.coverImageFilename = `Cover image "${entry.coverImageFilename}" not found in uploaded images`;
    }

    // Optional fields - add warnings if missing
    if (!entry.category?.trim()) {
        warnings.push('Category is not specified');
    }
    if (!entry.description?.trim()) {
        warnings.push('Description is not specified');
    }
    if (!entry.keywords || entry.keywords.length === 0) {
        warnings.push('Keywords are not specified');
    }

    return {
        rowNumber: entry.rowNumber,
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
    };
}

/**
 * Parses CSV row data into ParsedBookEntry
 */
export function parseCSVRow(row: CSVTemplateData, rowNumber: number): ParsedBookEntry {
    // Parse co-authors (up to 6)
    const coAuthors: ParsedBookEntry['coAuthors'] = [];
    for (let i = 1; i <= 6; i++) {
        const firstName = row[`co_author_${i}_first_name` as keyof CSVTemplateData] || '';
        const lastName = row[`co_author_${i}_last_name` as keyof CSVTemplateData] || '';
        const email = row[`co_author_${i}_email` as keyof CSVTemplateData] || '';
        const institute = row[`co_author_${i}_institute` as keyof CSVTemplateData] || '';
        const phoneNumber = row[`co_author_${i}_phone` as keyof CSVTemplateData] || '';

        // Only add if at least one field is filled
        if (firstName || lastName || email || institute || phoneNumber) {
            coAuthors.push({
                firstName,
                lastName,
                email,
                institute,
                phoneNumber
            });
        }
    }

    return {
        rowNumber,
        bookTitle: row.book_title || '',
        mainAuthor: {
            firstName: row.main_author_first_name || '',
            lastName: row.main_author_last_name || '',
            email: row.main_author_email || '',
            institute: row.main_author_institute || '',
            city: row.main_author_city || '',
            state: row.main_author_state || '',
            country: row.main_author_country || '',
            phoneNumber: row.main_author_phone || ''
        },
        coAuthors,
        isbn: row.isbn || '',
        doi: row.doi || '',
        pages: parseInt(row.pages) || 0,
        copyright: row.copyright || '',
        releaseDate: normalizeDate(row.release_date || ''),
        category: row.category || '',
        description: row.description || '',
        keywords: row.keywords ? row.keywords.split(';').map(k => k.trim()).filter(k => k) : [],
        indexedIn: row.indexed_in ? row.indexed_in.split(';').map(i => i.trim()).filter(i => i) : [],
        pricing: {
            softCopyPrice: parseFloat(row.soft_copy_price) || 0,
            hardCopyPrice: parseFloat(row.hard_copy_price) || 0,
            bundlePrice: parseFloat(row.bundle_price) || 0
        },
        googleLink: row.google_link || '',
        flipkartLink: row.flipkart_link || '',
        amazonLink: row.amazon_link || '',
        coverImageFilename: row.cover_image_filename || ''
    };
}

/**
 * Matches cover images with parsed entries by filename
 */
export function matchCoverImages(
    entries: ParsedBookEntry[],
    coverImages: File[]
): ParsedBookEntry[] {
    return entries.map(entry => {
        const matchedImage = coverImages.find(img =>
            img.name.toLowerCase() === entry.coverImageFilename.toLowerCase()
        );

        return {
            ...entry,
            matchedCoverImage: matchedImage
        };
    });
}

/**
 * Checks for duplicate ISBNs within the CSV
 */
/**
 * Checks for duplicate ISBNs within the CSV
 * Returns a Set of duplicate ISBNs
 */
export function findDuplicateISBNs(entries: ParsedBookEntry[]): Set<string> {
    const isbnCounts = new Map<string, number>();

    entries.forEach(entry => {
        if (entry.isbn) {
            const normalizedIsbn = entry.isbn.trim();
            isbnCounts.set(normalizedIsbn, (isbnCounts.get(normalizedIsbn) || 0) + 1);
        }
    });

    const duplicates = new Set<string>();
    isbnCounts.forEach((count, isbn) => {
        if (count > 1) {
            duplicates.add(isbn);
        }
    });

    return duplicates;
}
