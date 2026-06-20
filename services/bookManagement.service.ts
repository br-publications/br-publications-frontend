import { API_BASE_URL as BASE_URL, getAuthToken } from './api.config';
const API_BASE_URL = `${BASE_URL}/api`;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any;
}

export interface BookTitle {
    id: number;
    title: string;
    description: string | null;
    isActive: boolean;
    createdBy: number;
    chapterCount?: number;
    editorCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BookChapter {
    id: number;
    bookTitleId: number;
    chapterTitle: string;
    chapterNumber: number | null;
    description: string | null;
    isActive: boolean;
    isPublished: boolean;
    isReadyForPublication: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Populated by backend once supported: submission-level chapter status
    submissionStatus?: string; // e.g. 'chapter_approved', 'chapter_rejected', 'under_review'
    submissionId?: number;
}

export interface BookEditor {
    id: number;
    bookTitleId: number;
    editorId: number;
    assignedBy: number;
    assignedAt: string;
    isPrimary: boolean;
}

export interface PaginatedResponse<T> {
    bookTitles?: T[];
    chapters?: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================



/**
 * Create headers with authentication and JSON content type
 */
const getJsonHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

/**
 * Handle API errors
 */
const handleResponse = async (response: Response): Promise<ApiResponse> => {
    const data = await response.json();

    if (!response.ok) {
        console.error('API Error:', data);
        throw {
            status: response.status,
            ...data
        };
    }

    return data;
};

// ============================================================================
// BOOK TITLE SERVICE
// ============================================================================

export const bookTitleService = {
    /**
     * Create a new book title
     * POST /api/book-titles
     */
    createBookTitle: async (title: string, description?: string): Promise<ApiResponse<BookTitle>> => {
        const response = await fetch(`${API_BASE_URL}/book-titles`, {
            method: 'POST',
            headers: getJsonHeaders(),
            body: JSON.stringify({ title, description }),
        });

        return handleResponse(response);
    },

    /**
     * Get all book titles
     * GET /api/book-titles
     */
    getAllBookTitles: async (params?: {
        activeOnly?: boolean;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<PaginatedResponse<BookTitle>>> => {
        const queryParams = new URLSearchParams();
        if (params?.activeOnly) queryParams.append('activeOnly', 'true');
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const url = `${API_BASE_URL}/book-titles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get book title by ID
     * GET /api/book-titles/:id
     */
    getBookTitleById: async (id: number): Promise<ApiResponse<BookTitle>> => {
        const response = await fetch(`${API_BASE_URL}/book-titles/${id}`, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get book title with chapters (for dropdowns)
     * GET /api/book-titles/:id/with-chapters
     */
    getBookTitleWithChapters: async (id: number): Promise<ApiResponse<{ id: number; title: string; chapters: BookChapter[] }>> => {
        const response = await fetch(`${API_BASE_URL}/book-titles/${id}/with-chapters`, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Update book title
     * PUT /api/book-titles/:id
     */
    updateBookTitle: async (id: number, data: {
        title?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<ApiResponse<BookTitle>> => {
        const response = await fetch(`${API_BASE_URL}/book-titles/${id}`, {
            method: 'PUT',
            headers: getJsonHeaders(),
            body: JSON.stringify(data),
        });

        return handleResponse(response);
    },

    /**
     * Delete book title (soft delete)
     * DELETE /api/book-titles/:id
     */
    deleteBookTitle: async (id: number): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/book-titles/${id}`, {
            method: 'DELETE',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get book title by exact name
     * GET /api/book-titles/by-title
     */
    getBookTitleByTitle: async (title: string): Promise<ApiResponse<any>> => {
        const response = await fetch(`${API_BASE_URL}/book-titles/by-title?title=${encodeURIComponent(title)}`, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },
};

// ============================================================================
// BOOK CHAPTER SERVICE
// ============================================================================

export const bookChapterService = {
    /**
     * Create a new book chapter
     * POST /api/book-chapter-list
     */
    createBookChapter: async (data: {
        bookTitleId: number;
        chapterTitle: string;
        chapterNumber?: number;
        description?: string;
    }): Promise<ApiResponse<BookChapter>> => {
        const response = await fetch(`${API_BASE_URL}/book-chapter-list`, {
            method: 'POST',
            headers: getJsonHeaders(),
            body: JSON.stringify(data),
        });

        return handleResponse(response);
    },

    /**
     * Get chapters by book title ID
     * GET /api/book-chapter-list/book/:bookTitleId
     */
    getChaptersByBookTitle: async (bookTitleId: number, activeOnly: boolean = true, includePublished: boolean = true): Promise<ApiResponse<{
        bookTitle: { id: number; title: string };
        chapters: BookChapter[];
    }>> => {
        const queryParams = new URLSearchParams();
        if (activeOnly) queryParams.append('activeOnly', 'true');
        if (!includePublished) queryParams.append('includePublished', 'false');

        const url = `${API_BASE_URL}/book-chapter-list/book/${bookTitleId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get all chapters
     * GET /api/book-chapter-list
     */
    getAllChapters: async (params?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<PaginatedResponse<BookChapter>>> => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const url = `${API_BASE_URL}/book-chapter-list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get chapter by ID
     * GET /api/book-chapter-list/:id
     */
    getChapterById: async (id: number): Promise<ApiResponse<BookChapter>> => {
        const response = await fetch(`${API_BASE_URL}/book-chapter-list/${id}`, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Update chapter
     * PUT /api/book-chapter-list/:id
     */
    updateBookChapter: async (id: number, data: {
        chapterTitle?: string;
        chapterNumber?: number;
        description?: string;
        isActive?: boolean;
    }): Promise<ApiResponse<BookChapter>> => {
        const response = await fetch(`${API_BASE_URL}/book-chapter-list/${id}`, {
            method: 'PUT',
            headers: getJsonHeaders(),
            body: JSON.stringify(data),
        });

        return handleResponse(response);
    },

    /**
     * Delete chapter (soft delete)
     * DELETE /api/book-chapter-list/:id
     */
    deleteBookChapter: async (id: number): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/book-chapter-list/${id}`, {
            method: 'DELETE',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Reorder chapters
     * PUT /api/book-chapter-list/book/:bookTitleId/reorder
     */
    reorderChapters: async (bookTitleId: number, chapters: { id: number; chapterNumber: number }[]): Promise<ApiResponse<BookChapter[]>> => {
        const response = await fetch(`${API_BASE_URL}/book-chapter-list/book/${bookTitleId}/reorder`, {
            method: 'PUT',
            headers: getJsonHeaders(),
            body: JSON.stringify({ chapters }),
        });

        return handleResponse(response);
    },
};

// ============================================================================
// BOOK EDITOR SERVICE
// ============================================================================

export const bookEditorService = {
    /**
     * Assign editor to book title
     * POST /api/book-editors
     */
    assignEditor: async (bookTitleId: number, editorId: number): Promise<ApiResponse<BookEditor>> => {
        const response = await fetch(`${API_BASE_URL}/book-editors`, {
            method: 'POST',
            headers: getJsonHeaders(),
            body: JSON.stringify({ bookTitleId, editorId }),
        });

        return handleResponse(response);
    },

    /**
     * Bulk assign editors to book title
     * POST /api/book-editors/bulk
     */
    bulkAssignEditors: async (bookTitleId: number, editorIds: number[]): Promise<ApiResponse<{
        successful: { editorId: number; assignmentId: number }[];
        failed: { editorId: number; reason: string }[];
    }>> => {
        const response = await fetch(`${API_BASE_URL}/book-editors/bulk`, {
            method: 'POST',
            headers: getJsonHeaders(),
            body: JSON.stringify({ bookTitleId, editorIds }),
        });

        return handleResponse(response);
    },

    /**
     * Get editors by book title ID
     * GET /api/book-editors/book/:bookTitleId
     */
    getEditorsByBookTitle: async (bookTitleId: number): Promise<ApiResponse<{
        bookTitle: { id: number; title: string };
        editors: BookEditor[];
    }>> => {
        const response = await fetch(`${API_BASE_URL}/book-editors/book/${bookTitleId}`, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get books by editor ID
     * GET /api/book-editors/editor/:editorId
     */
    getBooksByEditor: async (editorId: number): Promise<ApiResponse<{
        editor: { id: number; userId: string; fullName: string; email: string };
        bookTitles: BookEditor[];
    }>> => {
        const response = await fetch(`${API_BASE_URL}/book-editors/editor/${editorId}`, {
            method: 'GET',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Remove editor assignment
     * DELETE /api/book-editors/:id
     */
    removeEditorAssignment: async (id: number): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/book-editors/${id}`, {
            method: 'DELETE',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Set an editor as primary for a book title
     * PATCH /api/book-editors/:bookTitleId/set-primary/:editorId
     */
    setPrimaryEditor: async (bookTitleId: number, editorId: number): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/book-editors/${bookTitleId}/set-primary/${editorId}`, {
            method: 'PATCH',
            headers: getJsonHeaders(),
        });

        return handleResponse(response);
    },
};

// ============================================================================
// DEFAULT EXPORT - Combined Service
// ============================================================================

const bookManagementService = {
    bookTitle: bookTitleService,
    bookChapter: bookChapterService,
    bookEditor: bookEditorService,
};

export default bookManagementService;
