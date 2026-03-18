// utils/submissionUtils.ts

// utils/submissionUtils.ts
import type { SubmissionStatus } from '../types/submissionTypes';

export const getStatusDisplay = (status: SubmissionStatus): string => {
  const statusMap: Partial<Record<SubmissionStatus, string>> = {
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
  return statusMap[status] || status;
};

export const getStatusColor = (status: SubmissionStatus): string => {
  const colorMap: Partial<Record<SubmissionStatus, string>> = {
    'ABSTRACT_SUBMITTED': 'bg-blue-100 text-blue-800 border-blue-300',
    'MANUSCRIPTS_PENDING': 'bg-amber-100 text-amber-800 border-amber-300',
    'REVIEWER_ASSIGNMENT': 'bg-purple-100 text-purple-800 border-purple-300',
    'UNDER_REVIEW': 'bg-violet-100 text-violet-800 border-violet-300',
    'EDITORIAL_REVIEW': 'bg-pink-100 text-pink-800 border-pink-300',
    'APPROVED': 'bg-green-100 text-green-800 border-green-300',
    'ISBN_APPLIED': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'PUBLICATION_IN_PROGRESS': 'bg-orange-100 text-orange-800 border-orange-300',
    'PUBLISHED': 'bg-green-100 text-green-800 border-green-300',
    'REJECTED': 'bg-red-100 text-red-800 border-red-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

export const formatDate = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatDateTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
};

export const getRelativeTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateInput);
  }
};

// Book Title Resolution Functions

import { bookTitleService } from '../services/bookManagement.service';
import type { BookChapterSubmission } from '../types/submissionTypes';

/**
 * Resolve book ID to book title
 * @param bookIdOrTitle - Either a book ID (number as string) or actual book title
 * @returns The actual book title, or the original value if not found
 */
export async function resolveBookTitle(bookIdOrTitle: string): Promise<string> {
  // Check if it's a numeric ID
  const parsedId = parseInt(bookIdOrTitle);
  if (isNaN(parsedId) || bookIdOrTitle.trim() !== parsedId.toString()) {
    // It's already a title, return as-is
    return bookIdOrTitle;
  }

  try {
    // Fetch all book titles
    const response = await bookTitleService.getAllBookTitles({ activeOnly: true });
    if (response.success && response.data?.bookTitles) {
      const book = response.data.bookTitles.find(b => b.id === parsedId);
      if (book) {
        return book.title;
      }
    }
  } catch (error) {
    console.error('Error resolving book title:', error);
  }

  // Fallback to original value
  return bookIdOrTitle;
}

/**
 * Resolve book IDs to titles for an array of submissions
 * @param submissions - Array of submissions with potentially numeric bookTitle
 * @returns Array of submissions with resolved book titles
 */
export async function resolveSubmissionBookTitles(
  submissions: BookChapterSubmission[]
): Promise<BookChapterSubmission[]> {
  // Check if any submission has a numeric book title
  const hasNumericTitles = submissions.some(s => !isNaN(Number(s.bookTitle)));

  if (!hasNumericTitles) {
    // All titles are already strings, return as-is
    return submissions;
  }

  try {
    // Fetch all book titles once
    const response = await bookTitleService.getAllBookTitles({ activeOnly: true });
    if (!response.success || !response.data?.bookTitles) {
      return submissions;
    }

    const bookTitlesMap = new Map<number, string>();
    response.data.bookTitles.forEach(book => {
      bookTitlesMap.set(book.id, book.title);
    });

    // Resolve each submission's book title
    return submissions.map(submission => {
      const parsedId = parseInt(submission.bookTitle);
      if (!isNaN(parsedId) && submission.bookTitle.trim() === parsedId.toString()) {
        const resolvedTitle = bookTitlesMap.get(parsedId);
        if (resolvedTitle) {
          return {
            ...submission,
            bookTitle: resolvedTitle
          };
        }
      }
      return submission;
    });
  } catch (error) {
    console.error('Error resolving submission book titles:', error);
    return submissions;
  }
}
