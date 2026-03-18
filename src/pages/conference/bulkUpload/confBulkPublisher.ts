/**
 * confBulkPublisher.ts
 *
 * Sequential publishing engine for Conference Bulk Upload.
 * Creates one conference + its articles via the conference service.
 */

import * as conferenceService from '../../../services/conference.service';
import type { ParsedConfEntry } from './confBulkValidator';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface ConfPublishingLogEntry {
    rowNumber: number;
    conferenceTitle: string;
    status: 'success' | 'error';
    message: string;
    articlesCreated: number;
    duration: number; // ms
}

export interface ConfPublishingProgress {
    total: number;
    completed: number;
    failed: number;
    current: string | null;
    elapsed: number;   // ms
    remaining: number; // ms estimated
    logs: ConfPublishingLogEntry[];
}

export interface ConfPublishingResult {
    successCount: number;
    failureCount: number;
    totalTime: number; // ms
    logs: ConfPublishingLogEntry[];
}

// ────────────────────────────────────────────────────────────
// Main sequential publisher
// ────────────────────────────────────────────────────────────

export async function publishConferencesSequentially(
    entries: ParsedConfEntry[],
    onProgress: (progress: ConfPublishingProgress) => void
): Promise<ConfPublishingResult> {
    const startTime = Date.now();
    const logs: ConfPublishingLogEntry[] = [];
    let failed = 0;

    const emit = (completed: number, current: string | null) => {
        const elapsed = Date.now() - startTime;
        const avgMs = completed > 0 ? elapsed / completed : 4000;
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
        const title = entry.conferenceTitle || `Row ${entry.rowNumber}`;
        const entryStart = Date.now();

        emit(i, title);

        try {
            // 1. Create conference
            const created = await conferenceService.createConference({
                title: entry.conferenceTitle,
                publisher: entry.publisher,
                type: entry.type,
                code: entry.code || null,
                issn: entry.issn || null,
                doi: entry.doi || null,
                publishedDate: entry.publishedDate || null,
                dateRange: entry.dateRange || null,
                location: entry.location || null,
                isActive: entry.isActive,
            });

            // 2. Create each article
            let articlesCreated = 0;
            for (const art of entry.articles) {
                const authors = art.authorsRaw
                    ? art.authorsRaw.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
                const keywords = art.keywords
                    ? art.keywords.split(',').map(s => s.trim()).filter(Boolean)
                    : null;

                await conferenceService.createArticle(created.id, {
                    title: art.title,
                    authors,
                    year: art.year,
                    pages: art.pages || null,
                    doi: art.doi || null,
                    abstract: art.abstract || null,
                    keywords,
                    isActive: true,
                });
                articlesCreated++;
            }

            logs.push({
                rowNumber: entry.rowNumber,
                conferenceTitle: title,
                status: 'success',
                message: `Created successfully with ${articlesCreated} article(s).`,
                articlesCreated,
                duration: Date.now() - entryStart,
            });
        } catch (err: any) {
            failed++;
            logs.push({
                rowNumber: entry.rowNumber,
                conferenceTitle: title,
                status: 'error',
                message: err?.message ?? 'Unknown error.',
                articlesCreated: 0,
                duration: Date.now() - entryStart,
            });
        }

        emit(i + 1, null);
    }

    return {
        successCount: entries.length - failed,
        failureCount: failed,
        totalTime: Date.now() - startTime,
        logs,
    };
}

// ────────────────────────────────────────────────────────────
// Time utilities
// ────────────────────────────────────────────────────────────

/** Estimated ms — ~4s per conference (conf + articles) */
export function confCalculateEstimatedTime(count: number): number {
    return count * 4000;
}

export function confFormatTime(ms: number): string {
    if (ms <= 0) return '0s';
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
}
