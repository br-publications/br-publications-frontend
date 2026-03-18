// Bulk Publisher - Handles sequential publishing with timing and spacing

import { submitTextBook, publishTextBook } from '../services/textBookService';
import type { ParsedBookEntry } from './bulkUploadValidator';
import type { SubmitTextBookRequest } from '../pages/textBookSubmission/types/textBookTypes';

export interface PublishingLog {
    rowNumber: number;
    bookTitle: string;
    status: 'success' | 'failed';
    message: string;
    timestamp: number;
    duration: number; // milliseconds
}

export interface PublishingProgress {
    total: number;
    completed: number;
    failed: number;
    current: string; // current book title
    startTime: number;
    elapsed: number; // milliseconds
    remaining: number; // milliseconds
    logs: PublishingLog[];
}

export interface BulkUploadResult {
    results: PublishingLog[];
    totalTime: number; // milliseconds
    successCount: number;
    failureCount: number;
}

const DELAY_BETWEEN_BOOKS = 2000; // 2 seconds

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Publishes books sequentially with proper spacing and time tracking
 */
export async function publishBooksSequentially(
    validEntries: ParsedBookEntry[],
    onProgress: (progress: PublishingProgress) => void
): Promise<BulkUploadResult> {
    const startTime = Date.now();
    const results: PublishingLog[] = [];

    for (let i = 0; i < validEntries.length; i++) {
        const entry = validEntries[i];
        const bookStartTime = Date.now();

        try {
            // Step 1: Submit textbook
            const submissionData: SubmitTextBookRequest = {
                // ... same as before but explicitly add flag
                bookTitle: entry.bookTitle,
                mainAuthor: {
                    title: 'Mr/Ms.',
                    firstName: entry.mainAuthor.firstName,
                    lastName: entry.mainAuthor.lastName,
                    email: entry.mainAuthor.email,
                    phoneNumber: 'N/A',
                    instituteName: entry.mainAuthor.institute,
                    designation: 'Author',
                    departmentName: 'N/A',
                    city: entry.mainAuthor.city || 'N/A',
                    state: entry.mainAuthor.state || 'N/A',
                    country: entry.mainAuthor.country || 'N/A',
                    isCorrespondingAuthor: true
                } as any,
                coAuthors: entry.coAuthors.length > 0 ? entry.coAuthors.map(ca => ({
                    title: 'Mr/Ms.',
                    firstName: ca.firstName,
                    lastName: ca.lastName,
                    email: ca.email,
                    phoneNumber: 'N/A',
                    instituteName: ca.institute,
                    designation: 'Co-Author',
                    departmentName: 'N/A',
                    city: 'N/A',
                    state: 'N/A',
                    country: 'N/A',
                    isCorrespondingAuthor: false
                } as any)) : null,
                contentFile: undefined,
                fullTextFile: undefined,
                isBulkSubmission: true,
                isDirectSubmission: false
            };

            const submissionResponse = await submitTextBook(submissionData);
            // The response structure is { submission: { id: ... } } (unwrapped by service)
            const submissionId = submissionResponse.submission.id;

            // Step 2: Publish textbook
            let coverImageFile = entry.matchedCoverImage;

            // Automatically crop cover image if it exists
            if (coverImageFile) {
                try {
                    const { autoCropCoverImage } = await import('./imageCropperUtils');
                    coverImageFile = await autoCropCoverImage(coverImageFile);

                } catch (cropError) {
                    console.error(`⚠️ Failed to auto-crop image for row ${entry.rowNumber}, using original:`, cropError);
                    // Continue with original image if cropping fails
                }
            }

            const publicationDetails = {
                isbnNumber: entry.isbn,
                doiNumber: entry.doi,
                pages: entry.pages,
                copyright: entry.copyright,
                releaseDate: entry.releaseDate,
                indexedIn: entry.indexedIn,
                keywords: entry.keywords,
                category: entry.category,
                description: entry.description,
                pricing: entry.pricing,
                googleLink: entry.googleLink,
                flipkartLink: entry.flipkartLink,
                amazonLink: entry.amazonLink
            };

            await publishTextBook(submissionId, publicationDetails, coverImageFile);

            const duration = Date.now() - bookStartTime;
            results.push({
                rowNumber: entry.rowNumber,
                bookTitle: entry.bookTitle,
                status: 'success',
                message: 'Published successfully',
                timestamp: Date.now(),
                duration
            });

        } catch (error: any) {
            const duration = Date.now() - bookStartTime;
            results.push({
                rowNumber: entry.rowNumber,
                bookTitle: entry.bookTitle,
                status: 'failed',
                message: error.message || 'Unknown error occurred',
                timestamp: Date.now(),
                duration
            });
        }

        // Calculate progress metrics
        const elapsed = Date.now() - startTime;
        const avgTimePerBook = elapsed / (i + 1);
        const remaining = avgTimePerBook * (validEntries.length - i - 1);

        // Update progress
        onProgress({
            total: validEntries.length,
            completed: i + 1,
            failed: results.filter(r => r.status === 'failed').length,
            current: validEntries[i + 1]?.bookTitle || '',
            startTime,
            elapsed,
            remaining,
            logs: results
        });

        // 2-second spacing between books (skip on last book)
        if (i < validEntries.length - 1) {
            await delay(DELAY_BETWEEN_BOOKS);
        }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    // Send Bulk Upload Report
    // We use a separate try-catch to ensure UI doesn't break if report fails
    try {
        const { sendBulkUploadReport } = await import('../services/textBookService');
        await sendBulkUploadReport({
            successCount,
            failureCount,
            totalTime,
            logs: results
        });
    } catch (reportError) {
        console.error('Failed to send bulk upload report:', reportError);
    }

    return {
        results,
        totalTime,
        successCount,
        failureCount
    };
}

/**
 * Calculates estimated time for bulk upload
 * @param bookCount Number of books to publish
 * @returns Estimated time in milliseconds
 */
export function calculateEstimatedTime(bookCount: number): number {
    const AVG_TIME_PER_BOOK = 6000; // 6 seconds average
    const SPACING_TIME = DELAY_BETWEEN_BOOKS; // 2 seconds

    return (AVG_TIME_PER_BOOK + SPACING_TIME) * bookCount;
}

/**
 * Formats milliseconds to human-readable time string
 * @param ms Milliseconds
 * @returns Formatted string like "2m 34s" or "45s"
 */
export function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
}

/**
 * Calculates ETA timestamp
 * @param remainingMs Remaining milliseconds
 * @returns Formatted time string like "3:45 PM"
 */
export function calculateETA(remainingMs: number): string {
    const etaDate = new Date(Date.now() + remainingMs);
    return etaDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
