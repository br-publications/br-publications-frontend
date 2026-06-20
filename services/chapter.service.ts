// Chapter Service - API calls for chapter-centric operations
import { API_BASE_URL, getAuthHeaders, getAuthToken } from './api.config';
import type {
    IndividualChapter,
    ChapterProgress,
    PublishingEligibility,
    ReviewerAssignmentRequest,
    ReviewSubmission,
    EditorDecisionRequest,
    RevisionRequest,
    ChapterStatusHistory,
} from '../types/chapterTypes';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

class ChapterService {
    private baseUrl = `${API_BASE_URL}/api/chapters`;

    /**
     * Get all chapters for a submission
     */
    async getChaptersBySubmission(submissionId: number): Promise<ApiResponse<IndividualChapter[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/submission/${submissionId}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error fetching chapters:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch chapters',
            };
        }
    }

    /**
     * Get a single chapter by ID
     */
    async getChapterById(chapterId: number): Promise<ApiResponse<IndividualChapter>> {
        try {
            const response = await fetch(`${this.baseUrl}/${chapterId}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error fetching chapter:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch chapter',
            };
        }
    }

    /**
     * Upload manuscript for a chapter
     */
    async uploadManuscript(chapterId: number, file: File, description?: string): Promise<ApiResponse<IndividualChapter>> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (description) {
                formData.append('description', description);
            }

            const token = getAuthToken();
            const response = await fetch(`${this.baseUrl}/${chapterId}/upload-manuscript`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error uploading manuscript:', error);
            return {
                success: false,
                error: error.message || 'Failed to upload manuscript',
            };
        }
    }

    /**
     * Accept chapter abstract
     */
    async acceptAbstract(chapterId: number, notes?: string): Promise<ApiResponse<IndividualChapter>> {
        try {
            const response = await fetch(`${this.baseUrl}/${chapterId}/accept-abstract`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ notes }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error accepting abstract:', error);
            return {
                success: false,
                error: error.message || 'Failed to accept abstract',
            };
        }
    }

    /**
     * Reject chapter abstract
     */
    async rejectAbstract(chapterId: number, notes: string): Promise<ApiResponse<IndividualChapter>> {
        try {
            const response = await fetch(`${this.baseUrl}/${chapterId}/reject-abstract`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ notes }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error rejecting abstract:', error);
            return {
                success: false,
                error: error.message || 'Failed to reject abstract',
            };
        }
    }

    /**
     * Assign reviewers to a chapter
     */
    async assignReviewers(request: ReviewerAssignmentRequest): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/${request.chapterId}/assign-reviewers`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    reviewerIds: request.reviewerIds,
                    deadline: request.deadline,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error assigning reviewers:', error);
            return {
                success: false,
                error: error.message || 'Failed to assign reviewers',
            };
        }
    }

    /**
     * Respond to reviewer assignment
     */
    async respondToAssignment(assignmentId: number, action: 'accept' | 'reject', reason?: string): Promise<ApiResponse<any>> {
        try {
            const apiResponse = await fetch(`${this.baseUrl}/assignment/${assignmentId}/response`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ action, reason }),
            });

            if (!apiResponse.ok) {
                throw new Error(`HTTP error! status: ${apiResponse.status}`);
            }

            return await apiResponse.json();
        } catch (error: any) {
            console.error('Error responding to assignment:', error);
            return {
                success: false,
                error: error.message || 'Failed to respond to assignment',
            };
        }
    }

    /**
     * Submit review for a chapter
     */
    async submitReview(review: ReviewSubmission): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/assignment/${review.assignmentId}/submit-review`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(review),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error submitting review:', error);
            return {
                success: false,
                error: error.message || 'Failed to submit review',
            };
        }
    }

    /**
     * Request revision for a chapter
     */
    async requestRevision(request: RevisionRequest): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/${request.chapterId}/request-revision`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reviewerComments: request.reviewerComments }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error requesting revision:', error);
            return {
                success: false,
                error: error.message || 'Failed to request revision',
            };
        }
    }

    /**
     * Submit revision for a chapter
     */
    async submitRevision(revisionId: number, file: File, authorResponse?: string): Promise<ApiResponse<any>> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (authorResponse) {
                formData.append('authorResponse', authorResponse);
            }

            const token = getAuthToken();
            const response = await fetch(`${this.baseUrl}/revision/${revisionId}/submit`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error submitting revision:', error);
            return {
                success: false,
                error: error.message || 'Failed to submit revision',
            };
        }
    }

    /**
     * Make editor decision on a chapter
     */
    async makeEditorDecision(request: EditorDecisionRequest): Promise<ApiResponse<IndividualChapter>> {
        try {
            const response = await fetch(`${this.baseUrl}/${request.chapterId}/editor-decision`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    decision: request.decision,
                    notes: request.notes,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error making editor decision:', error);
            return {
                success: false,
                error: error.message || 'Failed to make editor decision',
            };
        }
    }

    /**
     * Get status history for a chapter
     */
    async getStatusHistory(chapterId: number): Promise<ApiResponse<ChapterStatusHistory[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/${chapterId}/status-history`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error fetching status history:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch status history',
            };
        }
    }

    /**
     * Get chapter progress for a submission
     */
    async getProgress(submissionId: number): Promise<ApiResponse<ChapterProgress>> {
        try {
            const response = await fetch(`${this.baseUrl}/submission/${submissionId}/progress`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error fetching chapter progress:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch chapter progress',
            };
        }
    }

    /**
     * Check publishing eligibility for a submission
     */
    async getPublishingEligibility(submissionId: number): Promise<ApiResponse<PublishingEligibility>> {
        try {
            const response = await fetch(`${this.baseUrl}/submission/${submissionId}/publishing-eligibility`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error checking publishing eligibility:', error);
            return {
                success: false,
                error: error.message || 'Failed to check publishing eligibility',
            };
        }
    }


    /**
     * Publish the book
     */
    async publishBook(submissionId: number): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/submission/${submissionId}/publish`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Error publishing book:', error);
            return {
                success: false,
                error: error.message || 'Failed to publish book',
            };
        }
    }

    /**
     * Download file
     */
    async downloadFile(fileId: number, fileName: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/book-chapters/files/${fileId}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
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
    }

    /**
     * Preview file
     */
    async previewFile(fileId: number): Promise<{ url: string; type: string }> {
        const response = await fetch(`${API_BASE_URL}/api/book-chapters/files/${fileId}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        return {
            url: window.URL.createObjectURL(blob),
            type: blob.type
        };
    }
}

export default new ChapterService();
