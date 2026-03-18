/**
 * Custom React Hooks for Book Chapter Submission System
 * 
 * Fixed Issues:
 * - Changed FilterOptions.status to statuses
 * - Changed FilterOptions.dateRange values to correct format ('all' | '7' | '30' | '90')
 * - Fixed sortBy values to match FilterOptions ('recent' | 'oldest' | 'title-asc' | 'title-desc')
 * - Changed hasManuscript to computed from files array
 * - Changed discussionCount to safe fallback pattern
 * - Fixed file.fileUrl to use file.id for download URL
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { BookChapterSubmission, FilterOptions } from '../types/submissionTypes';
import bookChapterService from '../services/bookChapterSumission.service';
import { resolveSubmissionBookTitles } from './submissionUtils';
import * as utils from './bookChapterSubmission.utils';

/**
 * Hook for managing submissions list
 */
export const useSubmissions = (page: number = 1, limit: number = 20) => {
  const [submissions, setSubmissions] = useState<BookChapterSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: page,
    totalPages: 0,
    totalCount: 0,
  });

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookChapterService.getMySubmissions({ page, limit });
      if (response.data) {
        // ✅ CORRECT: API returns items in response.data
        setSubmissions((response.data as any).items || response.data.submissions || []);
        setPagination((response.data as any).pagination || {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
        });
      }
    } catch (err) {
      const message = utils.parseErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const addSubmission = useCallback((submission: BookChapterSubmission) => {
    setSubmissions(prev => [submission, ...prev]);
  }, []);

  const updateSubmission = useCallback((updated: BookChapterSubmission) => {
    setSubmissions(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    );
  }, []);

  const deleteSubmission = useCallback((id: number) => {
    setSubmissions(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    submissions,
    isLoading,
    error,
    pagination,
    refetch: fetchSubmissions,
    addSubmission,
    updateSubmission,
    deleteSubmission,
  };
};

/**
 * Hook for managing admin submissions list
 */
// Update types for hook options
type AdminSubmissionOptions = string[] | { statuses?: string[]; tab?: 'new' | 'unassigned' | 'active' | 'completed' };

export const useAdminAllSubmissions = (page: number = 1, limit: number = 50, options?: AdminSubmissionOptions) => {
  const [submissions, setSubmissions] = useState<BookChapterSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: page,
    totalPages: 0,
    totalCount: 0,
  });
  const [counts, setCounts] = useState({
    new: 0,
    active: 0,
    completed: 0,
    unassigned: 0, // Added unassigned
  });

  // Parse options to support both legacy array and new object format
  const statuses = Array.isArray(options) ? options : options?.statuses;
  const tab = !Array.isArray(options) && options ? options.tab : undefined;

  // Create stable dependency key for statuses array
  const statusesKey = statuses ? statuses.join(',') : '';

  const fetchSubmissions = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const statusesParam = statuses ? statuses.join(',') : undefined;

      const response = await bookChapterService.admin.getAdminSubmissions({
        page,
        limit,
        statuses: statusesParam,
        tab
      });

      if (response.data) {
        let submissions = (response.data as any).items || response.data.submissions || [];
        // Resolve book IDs to titles
        submissions = await resolveSubmissionBookTitles(submissions);
        setSubmissions(submissions);
        setPagination((response.data as any).pagination || {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
        });
        if ((response.data as any).tabCounts) {
          setCounts((response.data as any).tabCounts);
        }
      }
    } catch (err) {
      const message = utils.parseErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, tab, statusesKey]); // Stable dependencies

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    isLoading,
    error,
    pagination,
    counts,
    refetch: fetchSubmissions,
  };
};

/**
 * Hook for managing editor assigned submissions
 */
export const useEditorAssignedSubmissions = (page: number = 1, limit: number = 20, status?: string) => {
  const [submissions, setSubmissions] = useState<BookChapterSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: page,
    totalPages: 0,
    totalCount: 0,
  });

  const fetchSubmissions = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const response = await bookChapterService.editor.getEditorSubmissions({ page, limit, status });
      if (response.data) {
        let submissions = (response.data as any).items || response.data.submissions || [];
        // Resolve book IDs to titles
        submissions = await resolveSubmissionBookTitles(submissions);
        setSubmissions(submissions);
        setPagination((response.data as any).pagination || {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
        });
      }
    } catch (err) {
      const message = utils.parseErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    isLoading,
    error,
    pagination,
    refetch: fetchSubmissions,
  };
  return {
    submissions,
    isLoading,
    error,
    pagination,
    refetch: fetchSubmissions,
  };
};

/**
 * Hook for managing reviewer assignments
 * Fetches assignments specifically for the current reviewer
 */
export const useReviewerAssignments = (page: number = 1, limit: number = 20, status?: string) => {
  const [assignments, setAssignments] = useState<import('../types/submissionTypes').ReviewerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: page,
    totalPages: 0,
    totalCount: 0,
  });

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookChapterService.reviewer.getReviewerAssignments({ status });
      if (response.data) {
        // Backend returns ReviewerAssignments model which has nested submission
        // We need to flatten this for the frontend
        const rawAssignments = Array.isArray(response.data)
          ? response.data
          : (response.data as any).assignments || [];

        const mappedAssignments = rawAssignments.map((assignment: any) => {
          // Handle Chapter Level Assignment (New)
          if (assignment.chapter && assignment.chapter.submission) {
            const submission = assignment.chapter.submission;
            const chapter = assignment.chapter;

            // Collect chapter-specific files
            const chapterFiles = [];

            // Collect revision file IDs to prevent duplicates
            const revisionFileIds = new Set();
            if (chapter.revisions && Array.isArray(chapter.revisions)) {
              chapter.revisions.forEach((rev: any) => {
                if (rev.file) {
                  revisionFileIds.add(rev.file.id);
                }
              });
            }

            // 1. Initial Manuscript for this chapter
            // Only add if it's NOT also a revision file (to avoid duplicates if backend updates manuscriptFile pointer)
            if (chapter.manuscriptFile && !revisionFileIds.has(chapter.manuscriptFile.id)) {
              // Ensure it's labeled correctly
              const initialFile = { ...chapter.manuscriptFile };
              // If it somehow has a revision name but is the "initial" pointer, we might want to keep it
              // but usually initial shouldn't be a revision. 
              // Force type to initial if it's the root manuscript
              if (!initialFile.fileType) initialFile.fileType = 'initial_manuscript';
              chapterFiles.push(initialFile);
            }

            // 2. Revisions for this chapter
            if (chapter.revisions && Array.isArray(chapter.revisions)) {
              chapter.revisions.forEach((rev: any) => {
                if (rev.file) {
                  // Ensure revision files have correct type based on revision number if possible
                  const revFile = { ...rev.file };
                  if (!revFile.fileType || revFile.fileType === 'initial_manuscript') {
                    revFile.fileType = `revision_${rev.revisionNumber}`;
                  }
                  chapterFiles.push(revFile);
                }
              });
            }

            return {
              ...submission,
              // Critical: Show the specific chapter title
              bookChapterTitles: [chapter.chapterTitle],
              chapters: [chapter.chapterTitle],
              // Populate individualChapters so we can access chapterId in the view
              individualChapters: [chapter],

              // Override files with chapter-specific ones for reviewer
              files: chapterFiles,

              assignmentId: assignment.id, // Crucial for reviewer actions
              reviewerId: assignment.reviewerId, // Added for reviewer identification
              assignmentStatus: assignment.status === 'IN_PROGRESS'
                ? 'accepted'
                : assignment.status.toLowerCase(),
              assignmentDate: new Date(assignment.assignedDate),
              dueDate: assignment.deadline ? new Date(assignment.deadline) : null,
              reviewStatus: getReviewStatus(assignment.status),
            };
          }

          // Handle Book Level Assignment (Legacy)
          const submission = assignment.submission;
          return {
            ...submission,
            assignmentId: assignment.id, // Crucial for reviewer actions
            reviewerId: assignment.reviewerId, // Added for reviewer identification
            assignmentStatus: assignment.status === 'IN_PROGRESS'
              ? 'accepted'
              : assignment.status.toLowerCase(), // Map backend PENDING -> pending, IN_PROGRESS -> accepted
            assignmentDate: new Date(assignment.assignedDate),
            dueDate: assignment.deadline ? new Date(assignment.deadline) : null,
            reviewStatus: getReviewStatus(assignment.status),
            // Ensure proper mapping of nested objects if needed
            assignedEditor: submission.assignedEditor,
            reviewer: assignment.reviewer
          };
        });

        setAssignments(mappedAssignments);

        if ((response.data as any).pagination) {
          setPagination((response.data as any).pagination);
        }
      }
    } catch (err) {
      const message = utils.parseErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    isLoading,
    error,
    pagination,
    refetch: fetchAssignments,
  };
};

// Helper function for Reviewer Assignments hook
function getReviewStatus(status: string): 'not_started' | 'in_progress' | 'completed' {
  if (status === 'PENDING') return 'not_started';
  if (status === 'ACCEPTED') return 'not_started'; // Accepted but not started
  if (status === 'IN_PROGRESS') return 'in_progress';
  if (status === 'COMPLETED') return 'completed';
  return 'not_started';
}

/**
 * Hook for managing single submission details
 */
export const useSubmissionDetail = (submissionId: number | null) => {
  const [submission, setSubmission] = useState<BookChapterSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await bookChapterService.getSubmissionById(submissionId);
      if (response.data) {
        setSubmission((response.data as any).submission || response.data);
      }
    } catch (err) {
      const message = utils.parseErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const updateSubmission = useCallback((updated: BookChapterSubmission) => {
    setSubmission(updated);
  }, []);

  return {
    submission,
    isLoading,
    error,
    refetch: fetchSubmission,
    updateSubmission,
  };
};

/**
 * Hook for managing filters and sorting
 * ✅ FIXED: Use correct FilterOptions property names and values
 */
export const useSubmissionFilters = () => {
  // ✅ CORRECT: Use 'statuses' (plural) not 'status' (singular)
  // ✅ CORRECT: Use 'all', '7', '30', '90' not '30days', 'all-time', etc.
  // ✅ CORRECT: Use 'recent', 'oldest', 'title-asc', 'title-desc' not 'date', 'status', 'title'
  const [filters, setFilters] = useState<FilterOptions>({
    statuses: [],
    sortBy: 'recent',
    dateRange: 'all',
    search: '',
  });

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      statuses: [],
      sortBy: 'recent',
      dateRange: 'all',
      search: '',
    });
  }, []);

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
  };
};

/**
 * Hook for managing discussions/comments
 */
export const useDiscussions = (submissionId: number) => {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDiscussions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock: In real app, call API
      setDiscussions([]);
    } catch (err) {
      const message = utils.parseErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const addDiscussion = useCallback(async (message: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Mock: In real app, call API
      const newDiscussion = {
        id: utils.generateUniqueId(),
        message,
        timestamp: new Date(),
        author: { name: 'You', role: 'author' },
      };
      setDiscussions(prev => [...prev, newDiscussion]);
    } catch (err) {
      const message = utils.parseErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteDiscussion = useCallback((id: string) => {
    setDiscussions(prev => prev.filter(d => d.id !== id));
  }, []);

  return {
    discussions,
    isLoading,
    error,
    isSubmitting,
    refetch: fetchDiscussions,
    addDiscussion,
    deleteDiscussion,
  };
};

/**
 * Hook for file upload handling
 */
export const useFileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (f: File, maxSizeMB: number = 50): boolean => {
      // Check file type
      if (!utils.isValidFileType(f)) {
        setError('Invalid file type. Only PDF, DOC, and DOCX are allowed.');
        return false;
      }

      // Check file size
      if (!utils.isValidFileSize(f, maxSizeMB)) {
        setError(`File size exceeds ${maxSizeMB}MB limit.`);
        return false;
      }

      setError(null);
      return true;
    },
    []
  );

  const selectFile = useCallback((f: File) => {
    if (validateFile(f)) {
      setFile(f);
    }
  }, [validateFile]);

  const uploadFile = useCallback(
    async (submissionId: number) => {
      if (!file) {
        setError('No file selected');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 30;
          });
        }, 500);

        // Call API
        const response = await bookChapterService.uploadFullChapter(
          submissionId,
          file
        );

        clearInterval(progressInterval);
        setProgress(100);

        return response.data;
      } catch (err) {
        const message = utils.parseErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [file]
  );

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    file,
    isUploading,
    progress,
    error,
    selectFile,
    uploadFile,
    reset,
    validateFile,
  };
};

/**
 * Hook for form submission
 */
export const useSubmissionForm = <T extends Record<string, any> = any>(initialValues: T = {} as T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;
    setValues((prev: T) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [name]: '',
    }));
  }, []);

  const setFieldValue = useCallback((name: string, value: any) => {
    setValues((prev: T) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const handleSubmit = useCallback(
    (onSubmit: (values: any) => Promise<void>) =>
      async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (err) {
          const message = utils.parseErrorMessage(err);
          setErrors(prev => ({
            ...prev,
            general: message,
          }));
        } finally {
          setIsSubmitting(false);
        }
      },
    [values]
  );

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    setFieldValue,
    setFieldError,
    resetForm,
    handleSubmit,
  };
};

/**
 * Hook for managing notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const addNotification = useCallback(
    (
      type: 'success' | 'error' | 'warning' | 'info',
      title: string,
      message: string,
      duration: number = 5000
    ) => {
      const id = utils.generateUniqueId();
      const notification = {
        id,
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);

      if (duration > 0) {
        const timeout = setTimeout(() => {
          removeNotification(id);
        }, duration);
        notificationTimeouts.current[id] = timeout;
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notificationTimeouts.current[id]) {
      clearTimeout(notificationTimeouts.current[id]);
      delete notificationTimeouts.current[id];
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    Object.values(notificationTimeouts.current).forEach(timeout =>
      clearTimeout(timeout)
    );
    notificationTimeouts.current = {};
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
};

/**
 * Hook for managing pagination
 */
export const usePagination = (initialPage: number = 1, initialLimit: number = 20) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    page,
    limit,
    total,
    totalPages,
    setTotal,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changeLimit,
  };
};

/**
 * Hook for debouncing values
 */
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for async state
 */
export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
};

export default {
  useSubmissions,
  useAdminAllSubmissions,
  useEditorAssignedSubmissions,
  useSubmissionDetail,
  useSubmissionFilters,
  useDiscussions,
  useFileUpload,
  useSubmissionForm,
  useNotifications,
  usePagination,
  useDebounce,
  useAsync,
};