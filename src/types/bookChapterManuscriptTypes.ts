// types/bookChapterManuscriptTypes.ts
// CORRECTED VERSION - Aligned with Backend Model

// ============================================================================
// AUTHOR INTERFACE
// ============================================================================
// ✅ MATCHES BACKEND - No changes needed
export interface Author {
  // Frontend uses 'id' for UI tracking (React keys, temp IDs)
  // Backend doesn't need this field - it's removed before submission
  id?: string; // Made optional since backend doesn't use it

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
// MANUSCRIPT FORM DATA
// ============================================================================
// ❌ NEEDS MAJOR CHANGES - Several mismatches with backend
export interface ManuscriptFormData {
  // ✅ Main Author - CORRECT
  mainAuthor: Author;

  // ✅ Co-Authors - CORRECT
  coAuthors: Author[];

  // ✅ Book Title - CORRECT
  bookTitle: string;

  // ❌ WRONG: Backend expects bookChapterTitles (plural array)
  // Frontend was: bookChapterTitle: string (singular)
  // Should be: bookChapterTitles: string[]
  bookChapterTitles: string[]; // FIXED: Changed from singular to plural array

  // ✅ Manuscript - CORRECT (optional File)
  manuscript?: File;

  // ✅ Abstract - CORRECT
  abstract: string;

  // ✅ Keywords - CORRECT (array of strings)
  keywords: string[];

  // ❌ REMOVE: Backend doesn't expect submittedBy in payload
  // Backend gets user info from JWT token, not from form data
  // The backend controller extracts user from req.authenticatedUser
  // So this field should NOT be in the submission payload
}

// ============================================================================
// SUBMISSION PAYLOAD (What actually gets sent to backend)
// ============================================================================
export interface SubmitBookChapterPayload {
  mainAuthor: Author;
  coAuthors?: Author[]; // Optional
  bookTitle: string;
  bookChapterTitles: string[]; // Array of chapter IDs or titles
  abstract: string;
  keywords: string[]; // Array of keyword strings
  manuscript?: File; // Optional file
  selectedEditorId?: number; // Optional - Editor selected by author
}

// ============================================================================
// DROPDOWN OPTIONS
// ============================================================================
export interface DropdownOption {
  value: string;
  label: string;
}

// ============================================================================
// BOOK TITLE & CHAPTER INTERFACES
// ============================================================================
export interface BookTitle {
  id: string;
  title: string;
}

export interface BookChapter {
  id: string;
  bookTitleId: string;
  chapterTitle: string;
}

// ============================================================================
// DESIGNATIONS
// ============================================================================
// ✅ MATCHES BACKEND ENUM - All correct
export const DESIGNATIONS: DropdownOption[] = [
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'assistant_professor', label: 'Assistant Professor' },
  { value: 'associate_professor', label: 'Associate Professor' },
  { value: 'professor', label: 'Professor' },
  { value: 'dean', label: 'Dean' },
  { value: 'scholar', label: 'Scholar' },
  { value: 'research_scholar', label: 'Research Scholar' },
  { value: 'phd_student', label: 'PhD Student' },
  { value: 'postdoc', label: 'Postdoctoral Researcher' },
  { value: 'hod', label: 'Head of Department' },
  { value: 'director', label: 'Director' },
  { value: 'other', label: 'Other' },
];

// ============================================================================
// COUNTRIES
// ============================================================================
// ⚠️ RECOMMENDATION: Use ISO country codes to match backend
// Backend expects country codes like "US", "UK", "IN"
// Current values like 'india', 'usa' may not match
export const COUNTRIES: DropdownOption[] = [
  { value: 'IN', label: 'India' },           // Changed from 'india' to 'IN'
  { value: 'US', label: 'United States' },   // Changed from 'usa' to 'US'
  { value: 'UK', label: 'United Kingdom' },  // Changed from 'uk' to 'UK'
  { value: 'CA', label: 'Canada' },          // Changed from 'canada' to 'CA'
  { value: 'AU', label: 'Australia' },       // Changed from 'australia' to 'AU'
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'BR', label: 'Brazil' },
  // Add more countries as needed
];

// ============================================================================
// BACKEND SUBMISSION RESPONSE
// ============================================================================
// When you submit, backend returns this structure
export interface BookChapterSubmissionResponse {
  id: number;
  submittedBy: number;
  mainAuthor: Author;
  coAuthors: Author[] | null;
  bookTitle: string;
  bookChapterTitles: string[];
  abstract: string;
  keywords: string[];
  status: BookChapterStatus;
  assignedEditorId: number | null;
  assignedReviewers: number[] | null;
  revisionCount: number;
  currentRevisionNumber: number;
  reviewDeadline: Date | null;
  editorDecisionDate: Date | null;
  finalApprovalDate: Date | null;
  submissionDate: Date;
  lastUpdatedBy: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SUBMISSION STATUS ENUM
// ============================================================================
export const BookChapterStatus = {
  ABSTRACT_SUBMITTED: 'ABSTRACT_SUBMITTED',
  MANUSCRIPTS_PENDING: 'MANUSCRIPTS_PENDING',
  REVIEWER_ASSIGNMENT: 'REVIEWER_ASSIGNMENT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  EDITORIAL_REVIEW: 'EDITORIAL_REVIEW',
  APPROVED: 'APPROVED',
  ISBN_APPLIED: 'ISBN_APPLIED',
  PUBLICATION_IN_PROGRESS: 'PUBLICATION_IN_PROGRESS',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
} as const;

export type BookChapterStatus = typeof BookChapterStatus[keyof typeof BookChapterStatus];


// ============================================================================
// API RESPONSE WRAPPER
// ============================================================================
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}