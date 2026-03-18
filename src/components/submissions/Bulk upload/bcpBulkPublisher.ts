/**
 * bcpBulkPublisher.ts
 *
 * Sequential publishing engine for Book Chapter Bulk Upload.
 * Reuses the existing `publishBookChapter` service call —
 * the same one used by IndividualPublishChapterWizard.
 *
 * Each entry is published one at a time so the server isn't
 * overwhelmed and so the user can see granular progress.
 */

import { publishDirectBookChapter, uploadDirectTempPdf } from '../../../services/bookChapterPublishing.service';
import { autoCropCoverImage } from '../../../utils/imageCropperUtils';
import type { ParsedChapterEntry } from './bcpBulkValidator';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface BcpPublishingLogEntry {
    rowNumber: number;
    bookTitle: string;
    status: 'success' | 'error';
    message: string;
    duration: number; // ms
}

export interface BcpPublishingProgress {
    total: number;
    completed: number;
    failed: number;
    current: string | null;
    elapsed: number;   // ms
    remaining: number; // ms estimated
    logs: BcpPublishingLogEntry[];
}

export interface BcpPublishingResult {
    successCount: number;
    failureCount: number;
    totalTime: number; // ms
    logs: BcpPublishingLogEntry[];
}

// ────────────────────────────────────────────────────────────
// Helper: build the publishBookChapter payload from a CSV entry
// Note: synopsis, scope, archives, TOC, biographies cannot be
// specified in a CSV row — they are left as sensible defaults
// so that the book chapter is at least published with the
// core metadata. Editors can edit these fields afterwards.
// ────────────────────────────────────────────────────────────

async function buildPayload(entry: ParsedChapterEntry) {
    // Convert cover image File → base64 data URL if present
    // Automatically crop to the correct book-cover aspect ratio first (same as textbook bulk upload)
    let coverImageBase64: string | undefined;
    if (entry.matchedCoverImage) {
        let coverImageFile = entry.matchedCoverImage;
        try {
            coverImageFile = await autoCropCoverImage(coverImageFile);
        } catch (cropError) {
            console.warn(`⚠️ Auto-crop failed for row ${entry.rowNumber}, using original image:`, cropError);
        }
        coverImageBase64 = await fileToBase64(coverImageFile);
    }

    // Upload matched PDFs to temp storage
    // Upload matched PDFs to temp storage
    const frontmatterPdfs: Record<string, { pdfKey?: string; mimeType?: string; name?: string; }> = {};
    if (entry.matchedPdfs && entry.matchedPdfs.length > 0) {
        // We iterate over the expected PDF mapping, allowing multiple types to point to the same filename
        await Promise.all(
            Object.entries(entry.pdfMaps).map(async ([docType, filename]) => {
                if (!filename) return;
                const pdfFile = entry.matchedPdfs.find(f => f.name.toLowerCase() === filename.toLowerCase());
                if (!pdfFile) return;

                try {
                    const tempRes = await uploadDirectTempPdf(pdfFile);
                    if (tempRes.fileKey) {
                        frontmatterPdfs[docType] = {
                            pdfKey: tempRes.fileKey,
                            mimeType: tempRes.mimeType,
                            name: tempRes.originalName
                        };
                    }
                } catch (err) {
                    console.error(`Failed to upload PDF ${pdfFile.name} for ${docType} on row ${entry.rowNumber}:`, err);
                }
            })
        );
    }

    // Upload TOC Chapter PDFs and build the tableContents array
    const tableContents = await Promise.all(
        entry.tocChapters.map(async (chapter) => {
            let pdfData = {};
            if (chapter.matchedPdf) {
                try {
                    const tempRes = await uploadDirectTempPdf(chapter.matchedPdf);
                    if (tempRes.fileKey) {
                        pdfData = {
                            pdfKey: tempRes.fileKey,
                            pdfMimeType: tempRes.mimeType,
                            pdfName: tempRes.originalName
                        };
                    }
                } catch (err) {
                    console.error(`Failed to upload TOC Chapter PDF ${chapter.matchedPdf.name} for row ${entry.rowNumber}:`, err);
                }
            }

            return {
                title: chapter.title,
                authors: chapter.authors,
                pagesFrom: chapter.pagesFrom,
                pagesTo: chapter.pagesTo,
                abstract: chapter.abstract,
                pricing: {
                    softCopyPrice: chapter.priceSoftCopy,
                    hardCopyPrice: chapter.priceHardCopy,
                    combinedPrice: chapter.priceCombined
                },
                ...pdfData
            };
        })
    );

    const authorName =
        `${entry.mainAuthor.firstName} ${entry.mainAuthor.lastName}`.trim();

    const synopsis: Record<string, string> = {};
    if (entry.synopsisParagraph1) synopsis['paragraph_1'] = entry.synopsisParagraph1;
    if (entry.synopsisParagraph2) synopsis['paragraph_2'] = entry.synopsisParagraph2;
    if (entry.synopsisParagraph3) synopsis['paragraph_3'] = entry.synopsisParagraph3;
    if (entry.synopsisParagraph4) synopsis['paragraph_4'] = entry.synopsisParagraph4;

    const payload = {
        title: entry.bookTitle,
        editors: entry.editors,
        keywords: entry.keywords,
        author: authorName,
        mainAuthor: entry.mainAuthor,
        coAuthors: entry.coAuthors || undefined,
        coAuthorsData: entry.coAuthorsData,
        coverImage: coverImageBase64,
        category: entry.category,
        description: entry.description,
        isbn: entry.isbn,
        doi: entry.doi || undefined,
        publishedDate: entry.publishedDate,
        pages: entry.pages,
        indexedIn: entry.indexedIn || undefined,
        releaseDate: entry.releaseDate || undefined,
        copyright: entry.copyright || undefined,
        pricing: {
            softCopyPrice: entry.priceSoftCopy,
            hardCopyPrice: entry.priceHardCopy,
            combinedPrice: entry.priceCombined,
        },
        googleLink: entry.googleLink || undefined,
        flipkartLink: entry.flipkartLink || undefined,
        amazonLink: entry.amazonLink || undefined,
        synopsis,
        scope: (entry.scopeIntro ? { paragraph_1: entry.scopeIntro } : {}) as Record<string, string>,
        tableContents,
        authorBiographies: entry.authorBiographies ?? [],
        archives: {},
        frontmatterPdfs,
    };

    return payload;
}

/** Convert a File to a base64 data URL */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read cover image file.'));
        reader.readAsDataURL(file);
    });
}

// ────────────────────────────────────────────────────────────
// Main sequential publisher
// ────────────────────────────────────────────────────────────

export async function publishChaptersSequentially(
    entries: ParsedChapterEntry[],
    onProgress: (progress: BcpPublishingProgress) => void
): Promise<BcpPublishingResult> {
    const startTime = Date.now();
    const logs: BcpPublishingLogEntry[] = [];
    let failed = 0;

    // Emit initial progress
    const emit = (completed: number, current: string | null) => {
        const elapsed = Date.now() - startTime;
        const avgMs = completed > 0 ? elapsed / completed : 3000;
        const remaining = Math.max(0, (entries.length - completed) * avgMs);

        onProgress({
            total: entries.length,
            completed,
            failed,
            current,
            elapsed,
            remaining,
            logs: [...logs],
        });
    };

    emit(0, null);

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const title = entry.bookTitle || `Row ${entry.rowNumber}`;
        const entryStart = Date.now();

        emit(i, title);

        try {
            const payload = await buildPayload(entry);
            await publishDirectBookChapter(payload);

            logs.push({
                rowNumber: entry.rowNumber,
                bookTitle: title,
                status: 'success',
                message: 'Published successfully.',
                duration: Date.now() - entryStart,
            });
        } catch (err: any) {
            failed++;
            logs.push({
                rowNumber: entry.rowNumber,
                bookTitle: title,
                status: 'error',
                message: err?.message ?? 'Unknown error.',
                duration: Date.now() - entryStart,
            });
        }

        emit(i + 1, null);
    }

    const totalTime = Date.now() - startTime;

    return {
        successCount: entries.length - failed,
        failureCount: failed,
        totalTime,
        logs,
    };
}

// ────────────────────────────────────────────────────────────
// Time helpers (same API as bulkPublisher.ts)
// ────────────────────────────────────────────────────────────

/** Estimate total time in ms based on entry count (3 s per book) */
export function bcpCalculateEstimatedTime(count: number): number {
    return count * 3000;
}

/** Format milliseconds to "Xm Ys" string */
export function bcpFormatTime(ms: number): string {
    if (ms <= 0) return '0s';
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

/** Format estimated ETA as a clock time string */
export function bcpCalculateETA(remainingMs: number): string {
    if (remainingMs <= 0) return 'Done';
    const eta = new Date(Date.now() + remainingMs);
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
