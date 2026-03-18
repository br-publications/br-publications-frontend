// src/services/bookChapterPublishing.service.ts
// ============================================================
// Separate service for the NEW /api/book-chapter-publishing
// endpoints (do NOT touch bookChapterSumission.service.ts)
// ============================================================

import { API_BASE_URL as BASE_URL, getAuthToken } from './api.config';

const API_BASE = `${BASE_URL}/api/book-chapter-publishing`;

function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    return { Authorization: token ? `Bearer ${token}` : '' };
}

function getJsonHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
    };
}

async function handleResponse(response: Response) {
    const json = await response.json();
    if (!response.ok) throw { status: response.status, ...json };
    // If the backend uses our standard sendSuccess, return the 'data' payload
    return json.data !== undefined ? json.data : json;
}

// ============================================================
// Types
// ============================================================

export interface TocChapterPayload {
    title: string;
    chapterNumber?: string;
    authors?: string;
    pagesFrom?: string;
    pagesTo?: string;
    abstract?: string;
    priceSoftCopy?: number;
    priceHardCopy?: number;
    priceCombined?: number;
    /** Disk-based file key returned by the pre-upload endpoint */
    pdfKey?: string;
    pdfMimeType?: string;
    pdfName?: string;
}

export interface AuthorBiographyPayload {
    authorName: string;
    biography: string;
}

export interface PublishBookChapterPayload {
    title: string;
    editors?: string[];
    author: string;
    coAuthors?: string;
    coverImage?: string;           // base64 data URL
    category: string;
    description: string;
    isbn: string;
    publishedDate: string;         // "2024"
    pages: number;
    keywords?: string[];
    indexedIn?: string;
    releaseDate?: string;
    copyright?: string;
    doi?: string;
    synopsis?: Record<string, string>;
    scope?: Record<string, string>;
    tableContents?: TocChapterPayload[];
    authorBiographies?: AuthorBiographyPayload[];
    archives?: Record<string, string>;
    pricing?: Record<string, number>;
    googleLink?: string;
    flipkartLink?: string;
    amazonLink?: string;
    /** Map of type→fileKey references (e.g. { Preface: "1234.pdf" }) */
    frontmatterPdfs?: Record<string, { pdfKey?: string; mimeType?: string; name?: string; }>;
}

export interface PublishedBookChapter extends PublishBookChapterPayload {
    id: number;
    submissionId: number;
    isHidden: boolean;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
    hasCoverImage: boolean;
}

// ============================================================
// Admin API
// ============================================================

/**
 * POST /api/book-chapter-publishing/:submissionId/publish
 * Publish an APPROVED book chapter submission.
 * Body: full wizard payload — PDFs referenced by pdfKey (pre-uploaded).
 */
export const publishBookChapter = async (
    submissionId: number,
    payload: PublishBookChapterPayload,
): Promise<any> => {
    const response = await fetch(`${API_BASE}/${submissionId}/publish`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

/**
 * POST /api/book-chapter-publishing/:submissionId/upload-temp-pdf
 * Upload a single PDF file to temporary server storage.
 * Returns { fileKey, originalName, mimeType, size }.
 */
export const uploadTempPdf = async (
    submissionId: number,
    file: File,
    onProgress?: (pct: number) => void,
): Promise<{ fileKey: string; originalName: string; mimeType: string; size: number }> => {
    return new Promise((resolve, reject) => {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('pdf', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/${submissionId}/upload-temp-pdf`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
            if (onProgress && e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.data || data);
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err.message || `Upload failed (${xhr.status})`));
                } catch {
                    reject(new Error(`Upload failed (${xhr.status})`));
                }
            }
        };
        xhr.onerror = () => reject(new Error('Network error during PDF upload'));
        xhr.send(formData);
    });
};

/**
 * POST /api/book-chapter-publishing/direct
 * Publish a new book chapter directly (manual entry, no submission ID).
 */
export const publishDirectBookChapter = async (
    payload: PublishBookChapterPayload,
): Promise<any> => {
    const response = await fetch(`${API_BASE}/direct`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

/**
 * POST /api/book-chapter-publishing/upload-temp-pdf
 * Upload a single PDF file for a direct publication (manual entry).
 */
export const uploadDirectTempPdf = async (
    file: File,
    onProgress?: (pct: number) => void,
): Promise<{ fileKey: string; originalName: string; mimeType: string; size: number }> => {
    return new Promise((resolve, reject) => {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('pdf', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/upload-temp-pdf`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
            if (onProgress && e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.data || data);
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err.message || `Upload failed (${xhr.status})`));
                } catch {
                    reject(new Error(`Upload failed (${xhr.status})`));
                }
            }
        };
        xhr.onerror = () => reject(new Error('Network error during PDF upload'));
        xhr.send(formData);
    });
};

/**
 * PUT /api/book-chapter-publishing/:id
 * Update an existing published book chapter.
 */
export const updatePublishedChapter = async (
    id: number,
    payload: Partial<PublishBookChapterPayload>,
): Promise<any> => {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

/**
 * PUT /api/book-chapter-publishing/:id/visibility
 */
export const updateVisibility = async (id: number, isHidden: boolean): Promise<any> => {
    const response = await fetch(`${API_BASE}/${id}/visibility`, {
        method: 'PUT',
        headers: getJsonHeaders(),
        body: JSON.stringify({ isHidden }),
    });
    return handleResponse(response);
};

/**
 * PUT /api/book-chapter-publishing/:id/featured
 */
export const updateFeatured = async (id: number, isFeatured: boolean): Promise<any> => {
    const response = await fetch(`${API_BASE}/${id}/featured`, {
        method: 'PUT',
        headers: getJsonHeaders(),
        body: JSON.stringify({ isFeatured }),
    });
    return handleResponse(response);
};

/**
 * PUT /api/book-chapter-publishing/:id/cover
 * Update cover image (multipart)
 */
export const updateChapterCover = async (id: number, file: File): Promise<any> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('coverImage', file);

    const response = await fetch(`${API_BASE}/${id}/cover`, {
        method: 'PUT',
        headers: {
            Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
    });
    return handleResponse(response);
};

/**
 * DELETE /api/book-chapter-publishing/:id
 * Delete a published chapter.
 */
export const deletePublishedChapter = async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

// ============================================================
// Public API
// ============================================================

/**
 * GET /api/book-chapter-publishing
 * List published book chapters (paginated).
 */
export const getAllPublishedChapters = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    author?: string;
    publishedAfter?: string;
    publishedBefore?: string;
    category?: string;
    includeHidden?: boolean;
    featured?: boolean;
}) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.limit) q.set('limit', params.limit.toString());
    if (params?.search) q.set('search', params.search);
    if (params?.author) q.set('author', params.author);
    if (params?.publishedAfter) q.set('publishedAfter', params.publishedAfter);
    if (params?.publishedBefore) q.set('publishedBefore', params.publishedBefore);
    if (params?.category) q.set('category', params.category);
    if (params?.includeHidden) q.set('includeHidden', 'true');
    if (params?.featured) q.set('featured', 'true');
    const response = await fetch(`${API_BASE}?${q}`, { method: 'GET', headers: getAuthHeaders() });
    return handleResponse(response);
};

/**
 * GET /api/book-chapter-publishing/:id
 */
export const getPublishedChapterById = async (id: number) => {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'GET', headers: getAuthHeaders() });
    return handleResponse(response);
};

/** URL helpers for serving binary content */
export const getCoverUrl = (id: number, t?: string | number) =>
    `${API_BASE}/${id}/cover${t ? `?t=${t}` : ''}`;
export const getCoverThumbnailUrl = (id: number, w = 200, h = 280, t?: string | number) =>
    `${API_BASE}/${id}/cover/thumbnail?width=${w}&height=${h}${t ? `&t=${t}` : ''}`;
export const getChapterPdfUrl = (bookId: number, chapterIndex: number) =>
    `${API_BASE}/${bookId}/toc/${chapterIndex}/pdf`;
export const getExtraPdfUrl = (bookId: number, type: string) =>
    `${API_BASE}/${bookId}/extra-pdf/${type}`;

/**
 * GET /api/book-chapter-publishing/categories
 */
export const getCategories = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE}/categories`, { method: 'GET' });
    const payload = await handleResponse(response);
    return payload.categories || [];
};

/**
 * POST /api/book-chapter-publishing/check-isbn
 * Returns the subset of the given ISBNs that already exist in published_book_chapters.
 */
export const checkBookChapterIsbnAvailability = async (isbns: string[]): Promise<string[]> => {
    if (isbns.length === 0) return [];
    const response = await fetch(`${API_BASE}/check-isbn`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ isbns }),
    });
    const data = await handleResponse(response);
    return data.existingIsbns ?? [];
};
