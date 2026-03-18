// Chapter Types - TypeScript interfaces for chapter-centric workflow

/**
 * Chapter Status Enum - matches backend ChapterStatus
 */
// Chapter Status - const object instead of enum for erasableSyntaxOnly compatibility
// Chapter Status - const object instead of enum for erasableSyntaxOnly compatibility
export const ChapterStatus = {
    ABSTRACT_SUBMITTED: 'ABSTRACT_SUBMITTED',
    MANUSCRIPTS_PENDING: 'MANUSCRIPTS_PENDING',
    REVIEWER_ASSIGNMENT: 'REVIEWER_ASSIGNMENT',
    UNDER_REVIEW: 'UNDER_REVIEW',
    REVISION_REQUESTED: 'REVISION_REQUESTED',
    ADDITIONAL_REVISION_REQUESTED: 'ADDITIONAL_REVISION_REQUESTED',
    REVISION_SUBMITTED: 'REVISION_SUBMITTED',
    EDITORIAL_REVIEW: 'EDITORIAL_REVIEW',
    CHAPTER_APPROVED: 'CHAPTER_APPROVED',
    CHAPTER_REJECTED: 'CHAPTER_REJECTED',
} as const;

export type ChapterStatus = (typeof ChapterStatus)[keyof typeof ChapterStatus];

/**
 * Reviewer Assignment Status
 */
export const ReviewerAssignmentStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    DECLINED: 'DECLINED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
} as const;

export type ReviewerAssignmentStatus = (typeof ReviewerAssignmentStatus)[keyof typeof ReviewerAssignmentStatus];

export const ReviewerRecommendation = {
    ACCEPT: 'ACCEPT',
    MINOR_REVISION: 'MINOR_REVISION',
    MAJOR_REVISION: 'MAJOR_REVISION',
    REJECT: 'REJECT',
} as const;

export type ReviewerRecommendation = (typeof ReviewerRecommendation)[keyof typeof ReviewerRecommendation];

/**
 * Individual Chapter Interface
 */
export interface IndividualChapter {
    id: number;
    submissionId: number;
    chapterTitle: string;
    chapterNumber: number;
    status: ChapterStatus;
    manuscriptFileId: number | null;
    assignedReviewers: number[] | null;
    revisionCount: number;
    currentRevisionNumber: number;
    reviewDeadline: Date | null;
    editorDecision: 'APPROVED' | 'REJECTED' | null;
    editorDecisionDate: Date | null;
    editorDecisionNotes: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Populated associations
    manuscriptFile?: {
        id: number;
        fileName: string;
        fileSize: number;
        uploadDate: Date;
    };
    reviewerAssignments?: ChapterReviewerAssignment[];
    revisions?: ChapterRevision[];
    statusHistory?: ChapterStatusHistory[];
}

/**
 * Chapter Reviewer Assignment
 */
export interface ChapterReviewerAssignment {
    id: number;
    chapterId: number;
    reviewerId: number;
    assignedBy: number;
    status: ReviewerAssignmentStatus;
    assignedDate: Date;
    responseDate: Date | null;
    rejectionDate: Date | null;
    rejectionReason: string | null;
    deadline: Date;
    reviewSubmittedDate: Date | null;
    overallRating: number | null;
    recommendation: ReviewerRecommendation | null;
    comments: string | null;
    strengths: string | null;
    weaknesses: string | null;
    detailedFeedback: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Populated associations
    reviewer?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    assigner?: {
        id: number;
        firstName: string;
        lastName: string;
    };
}

/**
 * Chapter Revision
 */
export interface ChapterRevision {
    id: number;
    chapterId: number;
    revisionNumber: number;
    requestedBy: number;
    requestedDate: Date;
    submittedDate: Date | null;
    fileId: number | null;
    reviewerComments: string;
    authorResponse: string | null;
    status: 'PENDING' | 'SUBMITTED' | 'APPROVED';
    createdAt: Date;
    updatedAt: Date;

    // Populated associations
    requester?: {
        id: number;
        firstName: string;
        lastName: string;
    };
    file?: {
        id: number;
        fileName: string;
        fileSize: number;
    };
}

/**
 * Chapter Status History
 */
export interface ChapterStatusHistory {
    id: number;
    chapterId: number;
    previousStatus: ChapterStatus | null;
    newStatus: ChapterStatus;
    changedBy: number;
    action: string;
    notes: string | null;
    metadata: Record<string, any> | null;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;

    // Populated associations
    user?: {
        id: number;
        firstName: string;
        lastName: string;
    };
}

/**
 * Chapter Progress Summary
 */
export interface ChapterProgress {
    total: number;
    chapters: Array<{
        id: number;
        number: number;
        title: string;
        status: ChapterStatus;
    }>;
    statusCounts: Record<string, number>;
}

/**
 * Publishing Eligibility
 */
export interface PublishingEligibility {
    eligible: boolean;
    total: number;
    approved: number;
    rejected: number;
    inProgress: number;
}

/**
 * Chapter Upload Request
 */
export interface ChapterUploadRequest {
    chapterId: number;
    file: File;
    description?: string;
}

/**
 * Reviewer Assignment Request
 */
export interface ReviewerAssignmentRequest {
    chapterId: number;
    reviewerIds: number[];
    deadline?: Date;
}

/**
 * Review Submission
 */
export interface ReviewSubmission {
    assignmentId: number;

    recommendation: ReviewerRecommendation;
    comments: string;
    confidentialComments?: string;
    strengths?: string;
    weaknesses?: string;
    detailedFeedback?: string;
}

/**
 * Editor Decision Request
 */
export interface EditorDecisionRequest {
    chapterId: number;
    decision: 'APPROVED' | 'REJECTED';
    notes?: string;
}

/**
 * Revision Request
 */
export interface RevisionRequest {
    chapterId: number;
    reviewerComments: string;
}

/**
 * Revision Submission
 */
export interface RevisionSubmission {
    revisionId: number;
    file: File;
    authorResponse?: string;
}

export default {
    ChapterStatus,
    ReviewerAssignmentStatus,
    ReviewerRecommendation,
};
