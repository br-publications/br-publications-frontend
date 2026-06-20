// TypeScript types for Text Book Submission System

// Status enum matching backend
export const TextBookStatus = {
    INITIAL_SUBMITTED: 'INITIAL_SUBMITTED',
    PROPOSAL_UNDER_REVIEW: 'PROPOSAL_UNDER_REVIEW',
    PROPOSAL_REJECTED: 'PROPOSAL_REJECTED',
    PROPOSAL_ACCEPTED: 'PROPOSAL_ACCEPTED',
    REVISION_REQUESTED: 'REVISION_REQUESTED',
    REVISION_SUBMITTED: 'REVISION_SUBMITTED',
    SUBMISSION_ACCEPTED: 'SUBMISSION_ACCEPTED',
    SUBMISSION_REJECTED: 'SUBMISSION_REJECTED',
    ISBN_APPLIED: 'ISBN_APPLIED',
    ISBN_RECEIVED: 'ISBN_RECEIVED',
    AWAITING_DELIVERY_DETAILS: 'AWAITING_DELIVERY_DETAILS',
    DELIVERY_ADDRESS_RECEIVED: 'DELIVERY_ADDRESS_RECEIVED',
    PUBLICATION_IN_PROGRESS: 'PUBLICATION_IN_PROGRESS',
    PUBLISHED: 'PUBLISHED',
    WITHDRAWN: 'WITHDRAWN'
} as const;

export type TextBookStatus = typeof TextBookStatus[keyof typeof TextBookStatus];

// Stats interface for dashboard
export interface TextBookStats {
    byStatus: Record<TextBookStatus, number>;
    aggregated: {
        all: number;
        pending?: number;
        underReview?: number;
        approved: number;
        rejected: number;
        published: number;
        // Admin dashboard keys
        new?: number;
        review?: number;
        processing?: number;
        completed?: number;
        // Special counts
        bulk?: number;
        direct?: number;
    };
}

// File type enum
export const TextBookFileType = {
    CONTENT_FILE: 'CONTENT_FILE',
    FULL_TEXT: 'FULL_TEXT',
    REVISION: 'REVISION'
} as const;

export type TextBookFileType = typeof TextBookFileType[keyof typeof TextBookFileType];

// Author interface (same as book chapter)
export interface Author {
    title?: string;
    firstName: string;
    lastName?: string;
    designation: string;
    departmentName: string;
    institute?: string;
    instituteName?: string; // Kept for backward compatibility if any
    city?: string;
    state?: string;
    country?: string;
    email?: string;
    phoneNumber?: string;
    biography?: string;
    isCorrespondingAuthor: boolean;
}

// Main submission interface
export interface TextBookSubmission {
    id: number;
    submittedBy: number;
    mainAuthor: Author;
    coAuthors: Author[] | null;
    bookTitle: string;
    status: TextBookStatus;
    currentRevisionNumber: number;
    adminNotes: string | null;
    isbnNumber: string | null;
    doiNumber: string | null;
    submissionDate: string;
    proposalAcceptedDate: string | null;
    approvalDate: string | null;
    isbnAppliedDate: string | null;
    isbnReceivedDate: string | null;
    publicationStartDate: string | null;
    publishDate: string | null;
    isDirectSubmission?: boolean;
    isBulkSubmission?: boolean;
    lastUpdatedBy: number | null;
    createdAt: string;
    updatedAt: string;

    // Associations
    author?: {
        id: number;
        fullName: string;
        email: string;
    };
    files?: TextBookFile[];
    revisions?: TextBookRevision[];
    discussions?: TextBookDiscussion[];
    statusHistory?: TextBookStatusHistory[];
    deliveryAddress?: DeliveryAddress;
}

export interface DeliveryAddress {
    id: number;
    textBookSubmissionId: number | null;
    bookChapterSubmissionId: number | null;
    fullName: string;
    companyName: string | null;
    contactPersonName: string | null;
    countryCode: string;
    mobileNumber: string;
    altCountryCode: string | null;
    altMobileNumber: string | null;
    email: string;
    addressLine1: string;
    buildingName: string | null;
    streetName: string | null;
    area: string | null;
    landmark: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isResidential: boolean;
    deliveryInstructions: string | null;
    createdAt: string;
    updatedAt: string;
}

// File interface
export interface TextBookFile {
    id: number;
    submissionId: number;
    fileType: TextBookFileType;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    revisionNumber: number | null;
    uploadedBy: number;
    uploadedAt: string;
    createdAt: string;
    updatedAt: string;
}

// Revision interface
export interface TextBookRevision {
    id: number;
    submissionId: number;
    revisionNumber: number;
    submittedBy: number;
    notes: string | null;
    adminFeedback: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;

    // Associations
    author?: {
        id: number;
        fullName: string;
    };
    files?: TextBookFile[];
}

// Status history interface
export interface TextBookStatusHistory {
    id: number;
    submissionId: number;
    previousStatus: TextBookStatus | null;
    newStatus: TextBookStatus;
    changedBy: number;
    notes: string | null;
    changedAt: string;
    createdAt: string;
    updatedAt: string;

    // Associations
    changedByUser?: {
        id: number;
        fullName: string;
        role: string;
    };
}

// Discussion interface
export interface TextBookDiscussion {
    id: number;
    submissionId: number;
    senderId: number;
    message: string;
    createdAt: string;
    updatedAt: string;

    // Associations
    sender?: {
        id: number;
        fullName: string;
    };
}

// API request/response types
export interface SubmitTextBookRequest {
    mainAuthor: Author;
    coAuthors: Author[] | null;
    bookTitle: string;
    contentFile?: File;
    fullTextFile?: File;
    isDirectSubmission?: boolean;
    isBulkSubmission?: boolean;
}

export interface BulkUploadReportRequest {
    successCount: number;
    failureCount: number;
    totalTime: number;
    logs: any[];
}



export interface AdminDecisionRequest {
    decision: 'accept' | 'reject' | 'revision';
    notes?: string;
}

export interface SubmitRevisionRequest {
    notes?: string;
    revisionFile?: File;
}

export interface FinalDecisionRequest {
    decision: 'approve' | 'reject' | 'request_revision';
    notes?: string;
}

export interface UpdateIsbnDoiRequest {
    isbnNumber?: string;
    doiNumber?: string;
}

export interface SendDiscussionMessageRequest {
    message: string;
}

// Dashboard filter types
export interface TextBookFilters {
    status?: TextBookStatus | string;
    search?: string;
    isDirectSubmission?: boolean;
    isBulkSubmission?: boolean;
    showAll?: boolean;
    page?: number;
    limit?: number;
}

// Pagination response
export interface PaginatedResponse<T> {
    submissions: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Status badge colors
export const STATUS_COLORS: Record<TextBookStatus, string> = {
    [TextBookStatus.INITIAL_SUBMITTED]: '#3b82f6', // blue
    [TextBookStatus.PROPOSAL_UNDER_REVIEW]: '#8b5cf6', // purple
    [TextBookStatus.PROPOSAL_REJECTED]: '#ef4444', // red
    [TextBookStatus.PROPOSAL_ACCEPTED]: '#8b5cf6', // purple (Under Review)
    [TextBookStatus.REVISION_REQUESTED]: '#f59e0b', // amber
    [TextBookStatus.REVISION_SUBMITTED]: '#06b6d4', // cyan
    [TextBookStatus.SUBMISSION_ACCEPTED]: '#22c55e', // green
    [TextBookStatus.SUBMISSION_REJECTED]: '#ef4444', // red
    [TextBookStatus.ISBN_APPLIED]: '#f59e0b', // amber
    [TextBookStatus.ISBN_RECEIVED]: '#06b6d4', // cyan
    [TextBookStatus.AWAITING_DELIVERY_DETAILS]: '#f59e0b', // amber
    [TextBookStatus.DELIVERY_ADDRESS_RECEIVED]: '#06b6d4', // cyan
    [TextBookStatus.PUBLICATION_IN_PROGRESS]: '#8b5cf6', // purple
    [TextBookStatus.PUBLISHED]: '#10b981', // emerald
    [TextBookStatus.WITHDRAWN]: '#6b7280' // gray
};

// Status display labels
export const STATUS_LABELS: Record<TextBookStatus, string> = {
    [TextBookStatus.INITIAL_SUBMITTED]: 'Initial Submitted',
    [TextBookStatus.PROPOSAL_UNDER_REVIEW]: 'Proposal Under Review',
    [TextBookStatus.PROPOSAL_REJECTED]: 'Proposal Rejected',
    [TextBookStatus.PROPOSAL_ACCEPTED]: 'Under Review',
    [TextBookStatus.REVISION_REQUESTED]: 'Revision Requested',
    [TextBookStatus.REVISION_SUBMITTED]: 'Revision Submitted',
    [TextBookStatus.SUBMISSION_ACCEPTED]: 'Submission Accepted',
    [TextBookStatus.SUBMISSION_REJECTED]: 'Submission Rejected',
    [TextBookStatus.ISBN_APPLIED]: 'ISBN Applied',
    [TextBookStatus.ISBN_RECEIVED]: 'ISBN Received',
    [TextBookStatus.AWAITING_DELIVERY_DETAILS]: 'Awaiting Delivery Address',
    [TextBookStatus.DELIVERY_ADDRESS_RECEIVED]: 'Delivery Address Received',
    [TextBookStatus.PUBLICATION_IN_PROGRESS]: 'Publication In Progress',
    [TextBookStatus.PUBLISHED]: 'Published',
    [TextBookStatus.WITHDRAWN]: 'Withdrawn'
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper function to get revision status
export const getRevisionStatus = (currentRevision: number): string => {
    return `${currentRevision}/5 revisions used`;
};

// Helper function to check if can request revision
export const canRequestRevision = (currentRevision: number): boolean => {
    return currentRevision < 5;
};

// Helper function to check if can publish
export const canPublish = (submission: TextBookSubmission): boolean => {
    return (
        (submission.status === TextBookStatus.ISBN_RECEIVED ||
            submission.status === TextBookStatus.AWAITING_DELIVERY_DETAILS ||
            submission.status === TextBookStatus.DELIVERY_ADDRESS_RECEIVED ||
            submission.status === TextBookStatus.PUBLICATION_IN_PROGRESS) &&
        submission.isbnNumber !== null
    );
};

// Helper function to get days since submission
export const getDaysSinceSubmission = (submissionDate: string): number => {
    const now = new Date();
    const submitted = new Date(submissionDate);
    const diff = now.getTime() - submitted.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Helper function to format date and time
export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper function to get time since
export const getTimeSince = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};
