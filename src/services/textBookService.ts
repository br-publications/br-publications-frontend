// API service for Text Book Submission System
import { API_BASE_URL, getAuthHeaders, getAuthToken } from './api.config';
import type {
    TextBookSubmission,
    TextBookDiscussion,
    SubmitTextBookRequest,
    SendDiscussionMessageRequest,
    TextBookFilters,
    PaginatedResponse,
    TextBookStats
} from '../pages/textBookSubmission/types/textBookTypes';

const TEXTBOOK_API_BASE = `${API_BASE_URL}/api/textbooks`;

/**
 * Get submission stats
 */
export const getSubmissionStats = async (): Promise<TextBookStats> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/stats`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch statistics');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Submit new text book
 */
export const submitTextBook = async (requestData: SubmitTextBookRequest): Promise<any> => {
    const formData = new FormData();
    formData.append('mainAuthor', JSON.stringify(requestData.mainAuthor));
    if (requestData.coAuthors) {
        formData.append('coAuthors', JSON.stringify(requestData.coAuthors));
    }
    formData.append('bookTitle', requestData.bookTitle);

    if (requestData.contentFile) {
        formData.append('contentFile', requestData.contentFile);
    }
    if (requestData.fullTextFile) {
        formData.append('fullTextFile', requestData.fullTextFile);
    }
    if (requestData.isDirectSubmission) {
        formData.append('isDirectSubmission', 'true');
    }
    if (requestData.isBulkSubmission) {
        formData.append('isBulkSubmission', 'true');
    }

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${TEXTBOOK_API_BASE}/submit`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit text book');
    }

    const resData = await response.json();
    return resData.data;
};

/**
 * Get my submissions (author)
 */
export const getMySubmissions = async (filters?: TextBookFilters): Promise<PaginatedResponse<TextBookSubmission>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${TEXTBOOK_API_BASE}/my-submissions?${params}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch submissions');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Get admin submissions (admin only)
 */
export const getAdminSubmissions = async (filters?: TextBookFilters): Promise<PaginatedResponse<TextBookSubmission>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isDirectSubmission !== undefined) params.append('isDirectSubmission', filters.isDirectSubmission.toString());
    if (filters?.isBulkSubmission !== undefined) params.append('isBulkSubmission', filters.isBulkSubmission.toString());
    if (filters?.showAll !== undefined) params.append('showAll', filters.showAll.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${TEXTBOOK_API_BASE}/admin/submissions?${params}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch submissions');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Get submission by ID
 */
export const getSubmissionById = async (id: number): Promise<TextBookSubmission> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch submission');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Admin makes proposal decision (accept/reject initial proposal)
 */
export const proposalDecision = async (id: number, decision: 'accept' | 'reject', comments?: string): Promise<TextBookSubmission> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/proposal-decision`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, comments })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record proposal decision');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Admin requests revision from author
 */
export const requestRevision = async (id: number, comments: string): Promise<TextBookSubmission> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/request-revision`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comments })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request revision');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Author submits revision
 */
export const submitRevision = async (id: number, revisionFile: File, comments?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('revisionFile', revisionFile);
    if (comments) {
        formData.append('comments', comments);
    }

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/submit-revision`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit revision');
    }

    return response.json();
};

/**
 * Admin makes final decision (accept/reject submission)
 */
export const finalDecision = async (id: number, decision: 'accept' | 'reject', comments?: string): Promise<TextBookSubmission> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/final-decision`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, comments })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record final decision');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Admin applies for ISBN
 */
export const applyIsbn = async (id: number, comments?: string): Promise<TextBookSubmission> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/apply-isbn`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comments })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to apply for ISBN');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Admin records ISBN receipt
 */
export const receiveIsbn = async (id: number, isbnNumber: string, doiNumber?: string, comments?: string): Promise<TextBookSubmission> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/receive-isbn`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isbnNumber, doiNumber, comments })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record ISBN');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Admin starts publication process
 */
export const startPublication = async (id: number, comments?: string): Promise<TextBookSubmission> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/start-publication`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comments })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start publication');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Admin publishes text book
 */
export const publishTextBook = async (id: number, publicationDetails: any, coverImage?: File | null, comments?: string): Promise<TextBookSubmission> => {
    const formData = new FormData();
    formData.append('publicationDetails', JSON.stringify(publicationDetails));
    if (comments) {
        formData.append('comments', comments);
    }
    if (coverImage) {
        formData.append('coverImage', coverImage);
    }

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/publish`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish text book');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Send discussion message
 */
export const sendDiscussionMessage = async (id: number, message: SendDiscussionMessageRequest): Promise<TextBookDiscussion> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/discussion`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(message)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Get discussions for a submission
 */
export const getDiscussions = async (id: number): Promise<TextBookDiscussion[]> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${id}/discussions`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch discussions');
    }

    const data = await response.json();
    return data.data;
};

/**
 * Send bulk upload report
 */
export const sendBulkUploadReport = async (data: any): Promise<void> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/bulk-report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send bulk upload report');
    }
};

/**
 * Check if ISBNs are available
 */
export const checkIsbnAvailability = async (isbns: string[], excludeId?: number): Promise<string[]> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/check-isbn`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isbns, excludeId })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to check ISBN availability');
    }

    return data.data.existingIsbns;
};

/**
 * Download file
 * GET /api/textbooks/:id/download/:fileId
 */
export const downloadFile = async (submissionId: number, fileId: number, fileName: string): Promise<void> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${submissionId}/download/${fileId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName; // Set the file name
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

/**
 * Preview file (get blob URL)
 * GET /api/textbooks/:id/download/:fileId
 */
export const previewFile = async (submissionId: number, fileId: number): Promise<{ url: string; type: string }> => {
    const response = await fetch(`${TEXTBOOK_API_BASE}/${submissionId}/download/${fileId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to load file preview');
    }

    const blob = await response.blob();
    return {
        url: window.URL.createObjectURL(blob),
        type: blob.type
    };
};

export default {
    submitTextBook,
    getMySubmissions,
    getAdminSubmissions,
    getSubmissionById,
    proposalDecision,
    requestRevision,
    submitRevision,
    finalDecision,
    applyIsbn,
    receiveIsbn,
    startPublication,
    publishTextBook,
    sendDiscussionMessage,
    getDiscussions,
    getSubmissionStats,
    sendBulkUploadReport,
    downloadFile,
    previewFile
};


