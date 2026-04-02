// Chapter Utilities - Helper functions for chapter operations
import { ChapterStatus, type IndividualChapter } from '../types/chapterTypes';

/**
 * Get color for chapter status badge
 */
export const getChapterStatusColor = (status: ChapterStatus): string => {
    const colors: Record<ChapterStatus, string> = {
        [ChapterStatus.ABSTRACT_SUBMITTED]: '#3b82f6',      // Blue
        [ChapterStatus.MANUSCRIPTS_PENDING]: '#f59e0b',     // Amber
        [ChapterStatus.REVIEWER_ASSIGNMENT]: '#3b82f6',    // Blue
        [ChapterStatus.UNDER_REVIEW]: '#3b82f6',            // Blue
        [ChapterStatus.REVISION_REQUESTED]: '#f97316',      // Orange
        [ChapterStatus.ADDITIONAL_REVISION_REQUESTED]: '#f97316', // Orange
        [ChapterStatus.REVISION_SUBMITTED]: '#3b82f6',      // Blue
        [ChapterStatus.EDITORIAL_REVIEW]: '#8b5cf6',        // Purple
        [ChapterStatus.CHAPTER_APPROVED]: '#10b981',        // Green
        [ChapterStatus.CHAPTER_REJECTED]: '#ef4444',        // Red
    };

    return colors[status] || '#6b7280'; // Gray default
};

/**
 * Get display label for chapter status
 */
export const getChapterStatusLabel = (status: ChapterStatus): string => {
    const labels: Record<ChapterStatus, string> = {
        [ChapterStatus.ABSTRACT_SUBMITTED]: 'Abstract Submitted',
        [ChapterStatus.MANUSCRIPTS_PENDING]: 'Manuscript Pending',
        [ChapterStatus.REVIEWER_ASSIGNMENT]: 'Reviewer Assignment',
        [ChapterStatus.UNDER_REVIEW]: 'Under Review',
        [ChapterStatus.REVISION_REQUESTED]: 'Revision Requested',
        [ChapterStatus.ADDITIONAL_REVISION_REQUESTED]: 'Additional Revision Requested',
        [ChapterStatus.REVISION_SUBMITTED]: 'Revision Submitted',
        [ChapterStatus.EDITORIAL_REVIEW]: 'Editorial Review',
        [ChapterStatus.CHAPTER_APPROVED]: 'Approved',
        [ChapterStatus.CHAPTER_REJECTED]: 'Rejected',
    };

    return labels[status] || status;
};

/**
 * Check if manuscript can be uploaded for a chapter
 */
export const canUploadManuscript = (chapter: IndividualChapter): boolean => {
    return (
        chapter.status === ChapterStatus.MANUSCRIPTS_PENDING ||
        chapter.status === ChapterStatus.REVISION_REQUESTED ||
        chapter.status === ChapterStatus.ADDITIONAL_REVISION_REQUESTED
    );
};

/**
 * Check if reviewers can be assigned to a chapter
 */
export const canAssignReviewers = (chapter: IndividualChapter): boolean => {
    return chapter.status === ChapterStatus.REVIEWER_ASSIGNMENT;
};

/**
 * Check if chapter can be edited by author
 */
export const canEditChapter = (chapter: IndividualChapter): boolean => {
    return chapter.status === ChapterStatus.ABSTRACT_SUBMITTED;
};

/**
 * Check if revision can be requested
 */
export const canRequestRevision = (chapter: IndividualChapter): boolean => {
    return (
        chapter.revisionCount < 3 &&
        (chapter.status === ChapterStatus.REVIEWER_ASSIGNMENT ||
            chapter.status === ChapterStatus.UNDER_REVIEW ||
            chapter.status === ChapterStatus.REVISION_SUBMITTED)
    );
};

/**
 * Check if editor can make final decision
 */
export const canMakeEditorDecision = (chapter: IndividualChapter): boolean => {
    const completedCount = getCompletedReviewerCount(chapter);
    return chapter.status === ChapterStatus.EDITORIAL_REVIEW && completedCount >= 2;
};

/**
 * Get chapter progress percentage
 */
export const getChapterProgressPercentage = (chapter: IndividualChapter): number => {
    const statusWeights: Record<ChapterStatus, number> = {
        [ChapterStatus.ABSTRACT_SUBMITTED]: 10,
        [ChapterStatus.MANUSCRIPTS_PENDING]: 20,
        [ChapterStatus.REVIEWER_ASSIGNMENT]: 35,
        [ChapterStatus.UNDER_REVIEW]: 50,
        [ChapterStatus.REVISION_REQUESTED]: 55,
        [ChapterStatus.ADDITIONAL_REVISION_REQUESTED]: 55,
        [ChapterStatus.REVISION_SUBMITTED]: 65,
        [ChapterStatus.EDITORIAL_REVIEW]: 80,
        [ChapterStatus.CHAPTER_APPROVED]: 100,
        [ChapterStatus.CHAPTER_REJECTED]: 0,
    };

    return statusWeights[chapter.status] || 0;
};

/**
 * Get overall progress for all chapters
 */
export const getOverallProgress = (chapters: IndividualChapter[]): {
    percentage: number;
    approved: number;
    rejected: number;
    inProgress: number;
    total: number;
} => {
    if (!chapters || chapters.length === 0) {
        return { percentage: 0, approved: 0, rejected: 0, inProgress: 0, total: 0 };
    }

    const approved = chapters.filter(c => c.status === ChapterStatus.CHAPTER_APPROVED).length;
    const rejected = chapters.filter(c => c.status === ChapterStatus.CHAPTER_REJECTED).length;
    const inProgress = chapters.length - approved - rejected;

    const totalProgress = chapters.reduce((sum, chapter) => {
        return sum + getChapterProgressPercentage(chapter);
    }, 0);

    const percentage = Math.round(totalProgress / chapters.length);

    return {
        percentage,
        approved,
        rejected,
        inProgress,
        total: chapters.length,
    };
};

/**
 * Check if all chapters are approved (publishing eligible)
 */
export const isPublishingEligible = (chapters: IndividualChapter[]): boolean => {
    if (!chapters || chapters.length === 0) return false;
    return chapters.every(chapter => chapter.status === ChapterStatus.CHAPTER_APPROVED);
};

/**
 * Get next action required for a chapter
 */
/**
 * Get the count of active (non-declined/non-rejected) reviewer assignments for a chapter
 */
export const getActiveReviewerCount = (chapter: IndividualChapter): number => {
    if (!chapter.reviewerAssignments) return 0;
    return chapter.reviewerAssignments.filter(
        a => a.status === 'PENDING' || a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED'
    ).length;
};

/**
 * Get the count of declined reviewer assignments for a chapter
 */
export const getDeclinedReviewerCount = (chapter: IndividualChapter): number => {
    if (!chapter.reviewerAssignments) return 0;
    return chapter.reviewerAssignments.filter(
        a => a.status === 'DECLINED' || a.status === 'REJECTED' || a.status === 'EXPIRED'
    ).length;
};

/**
 * Get the count of finished/completed review results
 */
export const getCompletedReviewerCount = (chapter: IndividualChapter): number => {
    if (!chapter.reviewerAssignments) return 0;
    return chapter.reviewerAssignments.filter(a => a.status === 'COMPLETED').length;
};

export const getNextAction = (chapter: IndividualChapter, userRole: 'author' | 'editor' | 'reviewer' | 'admin'): string | null => {
    if (userRole === 'author') {
        if (chapter.status === ChapterStatus.MANUSCRIPTS_PENDING) {
            return 'Upload manuscript';
        }
        if (chapter.status === ChapterStatus.REVISION_REQUESTED || chapter.status === ChapterStatus.ADDITIONAL_REVISION_REQUESTED) {
            return `Upload revision (${chapter.revisionCount}/3)`;
        }
    }

    if (userRole === 'editor') {
        // Enforce 2 Completed Reviews requirement
        const completedCount = getCompletedReviewerCount(chapter);
        const inProgressCount = (chapter.reviewerAssignments || []).filter(
            a => a.status === 'PENDING' || a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS'
        ).length;

        // If we have less than 2 completed and not enough in progress, assign more
        if ((chapter.status === ChapterStatus.REVIEWER_ASSIGNMENT ||
            chapter.status === ChapterStatus.UNDER_REVIEW ||
            chapter.status === ChapterStatus.EDITORIAL_REVIEW) &&
            (completedCount + inProgressCount < 2)) {

            const needed = 2 - (completedCount + inProgressCount);
            return needed === 1 ? 'Assign 1 Replacement Reviewer' : 'Assign Reviewers';
        }

        // If we have the required results and status is Editorial Review, allow decision
        if (chapter.status === ChapterStatus.EDITORIAL_REVIEW && completedCount >= 2) {
            return 'Make final decision';
        }
    }

    if (userRole === 'reviewer') {
        if (chapter.status === ChapterStatus.UNDER_REVIEW) {
            return 'Submit review';
        }
    }

    return null;
};

/**
 * Get chapters requiring action
 */
export const getChaptersRequiringAction = (
    chapters: IndividualChapter[],
    userRole: 'author' | 'editor' | 'reviewer' | 'admin'
): IndividualChapter[] => {
    return chapters.filter(chapter => getNextAction(chapter, userRole) !== null);
};

/**
 * Sort chapters by number
 */
export const sortChaptersByNumber = (chapters: IndividualChapter[]): IndividualChapter[] => {
    return [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
};

/**
 * Filter chapters by status
 */
export const filterChaptersByStatus = (chapters: IndividualChapter[], status: ChapterStatus): IndividualChapter[] => {
    return chapters.filter(chapter => chapter.status === status);
};

/**
 * Get chapter by number
 */
export const getChapterByNumber = (chapters: IndividualChapter[], chapterNumber: number): IndividualChapter | undefined => {
    return chapters.find(chapter => chapter.chapterNumber === chapterNumber);
};

/**
 * Format chapter title for display
 */
export const formatChapterTitle = (chapter: IndividualChapter): string => {
    return `Chapter ${chapter.chapterNumber}: ${chapter.chapterTitle}`;
};

/**
 * Get status category for grouping
 */
export const getStatusCategory = (status: ChapterStatus): 'pending' | 'in-progress' | 'completed' | 'rejected' => {
    if (status === ChapterStatus.ABSTRACT_SUBMITTED || status === ChapterStatus.MANUSCRIPTS_PENDING) {
        return 'pending';
    }
    if (status === ChapterStatus.CHAPTER_APPROVED) {
        return 'completed';
    }
    if (status === ChapterStatus.CHAPTER_REJECTED) {
        return 'rejected';
    }
    return 'in-progress';
};

/**
 * Format manuscript file name with chapter name
 */
export const formatManuscriptFileName = (chapter: IndividualChapter): string => {
    if (!chapter.manuscriptFile) return '';

    const fileExtension = chapter.manuscriptFile.fileName
        .split('.')
        .pop()
        ?.toUpperCase() || 'FILE';

    return `Chapter ${chapter.chapterNumber} (${chapter.chapterTitle}) - ${fileExtension}`;
};

/**
 * Get file type from manuscript file name
 */
export const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
};

/**
 * Get file icon color based on type
 */
export const getFileIconColor = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':
            return '#ef4444'; // Red
        case 'doc':
        case 'docx':
            return '#3b82f6'; // Blue
        default:
            return '#6b7280'; // Gray
    }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default {
    getChapterStatusColor,
    getChapterStatusLabel,
    canUploadManuscript,
    canAssignReviewers,
    canEditChapter,
    canRequestRevision,
    canMakeEditorDecision,
    getChapterProgressPercentage,
    getOverallProgress,
    isPublishingEligible,
    getActiveReviewerCount,
    getDeclinedReviewerCount,
    getNextAction,
    getChaptersRequiringAction,
    sortChaptersByNumber,
    filterChaptersByStatus,
    getChapterByNumber,
    formatChapterTitle,
    getStatusCategory,
    formatManuscriptFileName,
    getFileType,
    getFileIconColor,
    formatFileSize,
};
