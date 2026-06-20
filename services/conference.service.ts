import { API_BASE_URL } from './api.config';

const BASE = `${API_BASE_URL}/api/conferences`;

// ─── Types ────────────────────────────────────────────────────

export interface Conference {
    id: number;
    title: string;
    publisher: string;
    publishedDate: string | null;
    dateRange: string | null;
    location: string | null;
    issn: string | null;
    doi: string | null;
    articleCount: number;
    type: string;
    code: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ConferenceArticle {
    id: number;
    conferenceId: number;
    title: string;
    authors: string[];
    year: number | null;
    pages: string | null;
    abstract: string | null;
    doi: string | null;
    keywords: string[] | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ConferenceFilters {
    page?: number;
    limit?: number;
    search?: string;
    publisher?: string;
}

export interface ArticleFilters {
    page?: number;
    limit?: number;
    search?: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedConferences {
    conferences: Conference[];
    pagination: Pagination;
}

export interface PaginatedArticles {
    articles: ConferenceArticle[];
    conference: Conference;
    pagination: Pagination;
}

export interface ArticleDetail {
    article: ConferenceArticle;
    conference: Conference;
    navigation: {
        total: number;
        position: number;
        prevId: number | null;
        nextId: number | null;
    };
}

// ─── Error handler ────────────────────────────────────────────
const handleResponse = async <T>(res: Response): Promise<T> => {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data as T;
};

// ─── Public API ───────────────────────────────────────────────

/**
 * Get paginated, searchable list of conferences.
 */
export const getConferences = async (filters?: ConferenceFilters): Promise<PaginatedConferences> => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.publisher) params.set('publisher', filters.publisher);
    const res = await fetch(`${BASE}?${params}`);
    return handleResponse<PaginatedConferences>(res);
};

/**
 * Get a single conference by ID.
 */
export const getConference = async (id: number): Promise<{ conference: Conference }> => {
    const res = await fetch(`${BASE}/${id}`);
    return handleResponse<{ conference: Conference }>(res);
};

/**
 * Get paginated articles for a conference.
 */
export const getArticlesByConference = async (
    confId: number,
    filters?: ArticleFilters
): Promise<PaginatedArticles> => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);
    const res = await fetch(`${BASE}/${confId}/articles?${params}`);
    return handleResponse<PaginatedArticles>(res);
};

/**
 * Get a single article with prev/next navigation metadata.
 */
export const getArticleById = async (confId: number, articleId: number): Promise<ArticleDetail> => {
    const res = await fetch(`${BASE}/${confId}/articles/${articleId}`);
    return handleResponse<ArticleDetail>(res);
};

// ─── Admin API ─────────────────────────────────────────────────

const authHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonHeaders = () => ({
    ...authHeader(),
    'Content-Type': 'application/json',
});

export const createConference = async (data: Partial<Conference>): Promise<Conference> => {
    const res = await fetch(BASE, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) });
    const json = await handleResponse<{ conference: Conference }>(res);
    return json.conference;
};

export const updateConference = async (id: number, data: Partial<Conference>): Promise<Conference> => {
    const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) });
    const json = await handleResponse<{ conference: Conference }>(res);
    return json.conference;
};

export const deleteConference = async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeader() });
    await handleResponse<any>(res);
};

export const createArticle = async (confId: number, data: Partial<ConferenceArticle>): Promise<ConferenceArticle> => {
    const res = await fetch(`${BASE}/${confId}/articles`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) });
    const json = await handleResponse<{ article: ConferenceArticle }>(res);
    return json.article;
};

export const updateArticle = async (confId: number, artId: number, data: Partial<ConferenceArticle>): Promise<ConferenceArticle> => {
    const res = await fetch(`${BASE}/${confId}/articles/${artId}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) });
    const json = await handleResponse<{ article: ConferenceArticle }>(res);
    return json.article;
};

export const deleteArticle = async (confId: number, artId: number): Promise<void> => {
    const res = await fetch(`${BASE}/${confId}/articles/${artId}`, { method: 'DELETE', headers: authHeader() });
    await handleResponse<any>(res);
};
