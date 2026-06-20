/**
 * Utility Functions for Book Chapter Submission System
 * Includes formatting, validation, and common helpers
 */

import type { SubmissionStatus, BookChapterSubmission } from '../types/submissionTypes';

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to human-readable format
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

/**
 * Format date and time
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);
  const diffMonths = Math.floor(diffMs / 2592000000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  return formatDate(d);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate file type
 */
export const isValidFileType = (
  file: File,
  allowedMimeTypes: string[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
): boolean => {
  return allowedMimeTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (
  file: File,
  maxSizeInMB: number = 50
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Get status badge color based on status
 */
export const getStatusColor = (status: SubmissionStatus): string => {
  const statusColors: Record<SubmissionStatus, string> = {
    ABSTRACT_SUBMITTED: '#3b82f6',        // Blue
    MANUSCRIPTS_PENDING: '#f59e0b',       // Amber
    REVIEWER_ASSIGNMENT: '#8b5cf6',       // Purple
    UNDER_REVIEW: '#3b82f6',             // Blue
    EDITORIAL_REVIEW: '#8b5cf6',         // Purple
    APPROVED: '#10b981',                 // Green
    ISBN_APPLIED: '#06b6d4',             // Cyan
    PUBLICATION_IN_PROGRESS: '#f97316',  // Orange
    PUBLISHED: '#2ecc71',                // Bright Green
    REJECTED: '#ef4444',                 // Red
  };
  return statusColors[status] || '#6b7280';
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: SubmissionStatus): string => {
  const statusLabels: Record<SubmissionStatus, string> = {
    ABSTRACT_SUBMITTED: 'Abstract Submitted',
    MANUSCRIPTS_PENDING: 'Manuscripts Pending',
    REVIEWER_ASSIGNMENT: 'Assigning Reviewers',
    UNDER_REVIEW: 'Under Peer Review',
    EDITORIAL_REVIEW: 'Editorial Review',
    APPROVED: 'Approved',
    ISBN_APPLIED: 'Proof Editing',
    PUBLICATION_IN_PROGRESS: 'Publication in Progress',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
  };
  return statusLabels[status] || status;
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
 * Get author full name
 */
export const getAuthorName = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Format chapters list
 */
export const formatChapters = (chapters: string[]): string => {
  if (!chapters || chapters.length === 0) return 'No chapters specified';
  if (chapters.length === 1) return chapters[0];
  if (chapters.length === 2) return chapters.join(' and ');

  const lastChapter = chapters[chapters.length - 1];
  const otherChapters = chapters.slice(0, -1).join(', ');
  return `${otherChapters}, and ${lastChapter}`;
};

/**
 * Format keywords for display
 */
export const formatKeywords = (keywords: string[]): string => {
  return keywords.join(' • ');
};

/**
 * Truncate text to specified length
 */
export const truncateText = (
  text: string,
  maxLength: number = 100,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Calculate days until deadline
 */
export const daysUntilDeadline = (deadlineDate: Date | string): number => {
  const deadline = typeof deadlineDate === 'string' ? new Date(deadlineDate) : deadlineDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Check if deadline is approaching (within 7 days)
 */
export const isDeadlineApproaching = (deadlineDate: Date | string): boolean => {
  const daysLeft = daysUntilDeadline(deadlineDate);
  return daysLeft >= 0 && daysLeft <= 7;
};

/**
 * Check if deadline has passed
 */
export const isDeadlinePassed = (deadlineDate: Date | string): boolean => {
  return daysUntilDeadline(deadlineDate) < 0;
};

/**
 * Generate initials from name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

/**
 * Parse error message from API response
 */
export const parseErrorMessage = (
  error: any
): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.data?.message) return error.data.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

/**
 * Sort submissions by specified field
 */
export const sortSubmissions = (
  submissions: BookChapterSubmission[],
  sortBy: 'recent' | 'oldest' | 'title-asc' | 'title-desc' = 'recent'
): BookChapterSubmission[] => {
  const sorted = [...submissions];

  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) =>
        new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
      );
    case 'title-asc':
      return sorted.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));
    case 'title-desc':
      return sorted.sort((a, b) => b.bookTitle.localeCompare(a.bookTitle));
    case 'recent':
    default:
      return sorted.sort((a, b) =>
        new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
      );
  }
};

/**
 * Filter submissions by status
 */
export const filterByStatus = (
  submissions: BookChapterSubmission[],
  statuses: SubmissionStatus[]
): BookChapterSubmission[] => {
  if (statuses.length === 0) return submissions;
  return submissions.filter(s => statuses.includes(s.status));
};

/**
 * Filter submissions by date range
 */
export const filterByDateRange = (
  submissions: BookChapterSubmission[],
  daysAgo: number | 'all' = 'all'
): BookChapterSubmission[] => {
  if (daysAgo === 'all') return submissions;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Number(daysAgo));

  return submissions.filter(
    s => new Date(s.submissionDate) >= cutoffDate
  );
};

/**
 * Search submissions by keyword
 */
export const searchSubmissions = (
  submissions: BookChapterSubmission[],
  query: string
): BookChapterSubmission[] => {
  if (!query.trim()) return submissions;

  const lowerQuery = query.toLowerCase();
  return submissions.filter(s =>
    s.bookTitle.toLowerCase().includes(lowerQuery) ||
    s.mainAuthor.firstName.toLowerCase().includes(lowerQuery) ||
    s.mainAuthor.lastName.toLowerCase().includes(lowerQuery) ||
    s.chapters?.some(c => c.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Calculate reading time in minutes
 */
export const calculateReadingTime = (wordCount: number): number => {
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Generate unique ID
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if user has permission for action
 */
export const hasPermission = (
  userRole: string,
  requiredPermission: string
): boolean => {
  const permissionMap: Record<string, string[]> = {
    author: ['read:own', 'edit:own', 'delete:own', 'discuss:any'],
    editor: ['read:any', 'edit:any', 'assign:reviewer', 'make:decision'],
    reviewer: ['read:assigned', 'comment:assigned', 'complete:review'],
    admin: [
      'read:any',
      'edit:any',
      'delete:any',
      'assign:editor',
      'manage:users',
      'manage:roles',
    ],
  };

  const userPermissions = permissionMap[userRole] || [];
  return userPermissions.includes(requiredPermission);
};

/**
 * Convert FormData to JSON object
 */
export const formDataToJSON = (formData: FormData): Record<string, any> => {
  const json: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      json[key] = {
        name: value.name,
        size: value.size,
        type: value.type,
      };
    } else {
      // Try to parse JSON strings
      try {
        json[key] = JSON.parse(value as string);
      } catch {
        json[key] = value;
      }
    }
  }

  return json;
};

export default {
  formatFileSize,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  isValidEmail,
  isValidFileType,
  isValidFileSize,
  getStatusColor,
  getStatusLabel,
  canEditSubmission,
  isManuscriptRequired,
  canDiscuss,
  getAuthorName,
  formatChapters,
  formatKeywords,
  truncateText,
  daysUntilDeadline,
  isDeadlineApproaching,
  isDeadlinePassed,
  getInitials,
  parseErrorMessage,
  sortSubmissions,
  filterByStatus,
  filterByDateRange,
  searchSubmissions,
  calculateReadingTime,
  generateUniqueId,
  hasPermission,
  formDataToJSON,
};