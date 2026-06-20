// types/submissionTypes.ts
// ALIGNED WITH NEW 10-STATUS BACKEND FLOW

// ============================================================================
// SUBMISSION STATUS - ALIGNED WITH BACKEND BookChapterStatus
// ============================================================================
export type SubmissionStatus =
  | 'ABSTRACT_SUBMITTED'
  | 'MANUSCRIPTS_PENDING'
  | 'REVIEWER_ASSIGNMENT'
  | 'UNDER_REVIEW'
  | 'EDITORIAL_REVIEW'
  | 'APPROVED'
  | 'ISBN_APPLIED'
  | 'PUBLICATION_IN_PROGRESS'
  | 'PUBLISHED'
  | 'REJECTED';

// ============================================================================
// SUBMISSION STAGE (UI Grouping)
// ============================================================================
export type SubmissionStage =
  | 'Submission'
  | 'Manuscripts'
  | 'Peer Review'
  | 'Editorial Review'
  | 'Production'
  | 'Published';

// ============================================================================
// FILE TYPE
// ============================================================================
export const FileType = {
  INITIAL_MANUSCRIPT: 'initial_manuscript',
  FULL_CHAPTER: 'full_chapter',
  REVISION_1: 'revision_1',
  REVISION_2: 'revision_2',
  REVISION_3: 'revision_3',
  FINAL_APPROVED: 'final_approved',
  PROOF_DOCUMENT: 'proof_document',
} as const;

export type FileType = typeof FileType[keyof typeof FileType];

// ============================================================================
// FILE INFO
// ============================================================================
export interface FileInfo {
  id: number;
  submissionId: number;
  fileType: FileType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: number;
  uploadDate: Date;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HISTORY ITEM
// ============================================================================
export interface HistoryItem {
  id: number;
  submissionId: number;
  previousStatus: string | null;
  newStatus: string;
  changedBy: number;
  action: string;
  notes: string | null;
  metadata: Record<string, any> | null;
  changedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DISCUSSION / MESSAGE
// ============================================================================
export interface Discussion {
  id: number;
  submissionId: number;
  userId: number;
  userRole: 'author' | 'editor' | 'reviewer' | 'admin';
  userName: string;
  userAvatar?: string;
  message: string;
  attachments?: FileInfo[];
  createdAt: Date;
  updatedAt: Date;
  replies?: Discussion[];
}

// ============================================================================
// AUTHOR INTERFACE (from backend)
// ============================================================================
export interface Author {
  firstName: string;
  lastName: string;
  designation: string;
  departmentName: string;
  instituteName: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phoneNumber?: string;
  isCorrespondingAuthor: boolean;
  otherDesignation?: string;
}

// ============================================================================
// MAIN SUBMISSION INTERFACE
// ============================================================================
export interface Submission {
  id: number;
  submittedBy: number;
  mainAuthor: Author;
  coAuthors: Author[] | null;
  bookTitle: string;
  bookChapterTitles?: string[];
  chapters?: string[]; // Alias for bookChapterTitles
  abstract: string;
  keywords: string[];
  status: SubmissionStatus;
  assignedEditorId: number | null;
  designatedEditorId?: number | null;
  assignedEditor?: {
    id: number;
    fullName: string;
    email: string;
  };
  assignedReviewers?: number[] | null;
  revisionCount: number;
  currentRevisionNumber: number;
  reviewDeadline: Date | null;
  editorDecisionDate: Date | null;
  finalApprovalDate: Date | null;
  submissionDate: Date;
  lastUpdatedBy: number | null;
  notes: string | null;
  isbn: string | null;
  doi: string | null;
  proofStatus?: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  authorProofNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Optional populated fields from associations
  statusHistory?: HistoryItem[];
  discussions?: Discussion[];
  discussionCount?: number; // For display
  files?: FileInfo[];
  deliveryAddress?: any; // Delivery Address Information

  // Chapter-centric fields (populated when needed)
  individualChapters?: any[]; // Will be typed as IndividualChapter[] when imported
  chapterProgress?: any; // Will be typed as ChapterProgress when imported
  publishingEligibility?: any; // Will be typed as PublishingEligibility when imported
}

// ============================================================================
// BOOK CHAPTER SUBMISSION - ALIAS FOR COMPATIBILITY
// ============================================================================
export type BookChapterSubmission = Submission;

// ============================================================================
// FILTER OPTIONS (for UI filtering)
// ============================================================================
export interface FilterOptions {
  statuses?: SubmissionStatus[];
  sortBy?: 'recent' | 'oldest' | 'title-asc' | 'title-desc';
  dateRange?: 'all' | '7' | '30' | '90';
  search?: string;
  overdue?: boolean;
  incomplete?: boolean;
  stages?: SubmissionStage[];
  activity?: string[];
  sections?: string[];
}

// ============================================================================
// PAGINATION
// ============================================================================
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ListResponse<T> {
  submissions: T[];
  pagination: PaginationData;
}

// ============================================================================
// REVIEW SUBMISSION
// ============================================================================
export interface ReviewSubmission {
  submissionId: number;
  reviewerId: number;
  overallRating: number; // 1-5
  recommendation: 'accept' | 'reject';
  summary: string;
  strengths: string;
  weaknesses: string;
  detailedComments: string;
  submittedAt: Date;
}

// ============================================================================
// REVIEWER ASSIGNMENT (for UI)
// ============================================================================
export interface ReviewerAssignment extends BookChapterSubmission {
  assignmentId: number; // Added for reviewer actions
  reviewerId: number; // Added to identify the reviewer
  assignmentStatus: 'pending' | 'accepted' | 'completed' | 'rejected' | 'declined';
  assignmentDate: Date;
  dueDate: Date | null;
  reviewStatus: 'not_started' | 'in_progress' | 'completed';
  recommendation: string | null;
  comments: string | null;
  confidentialComments: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map Status to Stage (for UI grouping)
 */
export const mapStatusToStage = (status: SubmissionStatus): SubmissionStage => {
  switch (status) {
    case 'ABSTRACT_SUBMITTED':
      return 'Submission';

    case 'MANUSCRIPTS_PENDING':
      return 'Manuscripts';

    case 'REVIEWER_ASSIGNMENT':
    case 'UNDER_REVIEW':
      return 'Peer Review';

    case 'EDITORIAL_REVIEW':
    case 'APPROVED':
      return 'Editorial Review';

    case 'ISBN_APPLIED':
    case 'PUBLICATION_IN_PROGRESS':
      return 'Production';

    case 'PUBLISHED':
      return 'Published';

    case 'REJECTED':
      return 'Editorial Review';

    default:
      return 'Submission';
  }
};

/**
 * Get Status Display Name
 */
export const getStatusDisplayName = (status: SubmissionStatus): string => {
  const displayNames: Record<SubmissionStatus, string> = {
    'ABSTRACT_SUBMITTED': 'Abstract Submitted',
    'MANUSCRIPTS_PENDING': 'Manuscripts Pending',
    'REVIEWER_ASSIGNMENT': 'Assigning Reviewers',
    'UNDER_REVIEW': 'Under Peer Review',
    'EDITORIAL_REVIEW': 'Editorial Review',
    'APPROVED': 'Approved',
    'ISBN_APPLIED': 'Proof Editing',
    'PUBLICATION_IN_PROGRESS': 'Publication in Progress',
    'PUBLISHED': 'Published',
    'REJECTED': 'Rejected',
  };

  return displayNames[status] || status;
};

/**
 * Get Status Color (for UI badges)
 */
export const getStatusColor = (status: SubmissionStatus): string => {
  const colors: Record<SubmissionStatus, string> = {
    'ABSTRACT_SUBMITTED': '#3b82f6',      // Blue
    'MANUSCRIPTS_PENDING': '#f59e0b',     // Amber
    'REVIEWER_ASSIGNMENT': '#8b5cf6',     // Purple
    'UNDER_REVIEW': '#3b82f6',           // Blue
    'EDITORIAL_REVIEW': '#8b5cf6',       // Purple
    'APPROVED': '#10b981',               // Green
    'ISBN_APPLIED': '#06b6d4',           // Cyan
    'PUBLICATION_IN_PROGRESS': '#f97316', // Orange
    'PUBLISHED': '#2ecc71',              // Bright Green
    'REJECTED': '#ef4444',               // Red
  };

  return colors[status] || '#6b7280';    // Gray default
};

/**
 * Check if submission can be edited
 */
export const canEditSubmission = (status: SubmissionStatus): boolean => {
  return status === 'ABSTRACT_SUBMITTED';
};

/**
 * Check if manuscript upload is required
 */
export const isManuscriptRequired = (status: SubmissionStatus): boolean => {
  return status === 'MANUSCRIPTS_PENDING';
};

/**
 * Check if discussions are allowed
 */
export const canDiscuss = (status: SubmissionStatus): boolean => {
  return status !== 'PUBLISHED' && status !== 'REJECTED';
};

/**
 * Get all possible statuses
 */
export const getAllStatuses = (): SubmissionStatus[] => {
  return [
    'ABSTRACT_SUBMITTED',
    'MANUSCRIPTS_PENDING',
    'REVIEWER_ASSIGNMENT',
    'UNDER_REVIEW',
    'EDITORIAL_REVIEW',
    'APPROVED',
    'ISBN_APPLIED',
    'PUBLICATION_IN_PROGRESS',
    'PUBLISHED',
    'REJECTED',
  ];
};

export default {
  mapStatusToStage,
  getStatusDisplayName,
  getStatusColor,
  canEditSubmission,
  isManuscriptRequired,
  canDiscuss,
  getAllStatuses,
};