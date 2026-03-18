import { API_BASE_URL, getAuthHeaders, getAuthToken } from './api.config';

const BOOK_API_BASE = `${API_BASE_URL}/api/books`;

export interface PublishedBook {
    id: number;
    title: string;
    author: string;
    coAuthors: string | null;
    coverImage: string | null;
    category: string;
    description: string;
    isbn: string;
    publishedDate: string;
    pages: number;
    indexedIn: string | null;
    releaseDate: string | null;
    copyright: string | null;
    doi: string | null;
    pricing: Record<string, number> | null;
    googleLink: string | null;
    flipkartLink: string | null;
    amazonLink: string | null;
    isHidden: boolean;
    isFeatured: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface BookFilters {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    featured?: boolean;
    includeHidden?: boolean;
}

export interface PaginatedResponse<T> {
    books: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Get all published books
 */
export const getAllBooks = async (filters?: BookFilters): Promise<PaginatedResponse<PublishedBook>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    if (filters?.category) params.append('category', filters.category);
    if (filters?.featured) params.append('featured', 'true');
    if (filters?.includeHidden) params.append('includeHidden', 'true');

    const response = await fetch(`${BOOK_API_BASE}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch books');
    const data = await response.json();

    // Process books to ensure coverImage URLs are absolute and accessible
    if (data.data?.books) {
        data.data.books = data.data.books.map((book: PublishedBook) => {
            let coverImage = book.coverImage;

            if (coverImage) {
                // If it's a protected API path from submission (starts with /api/textbooks), 
                // switch to public published book endpoint: /api/books/:id/cover
                if (coverImage.startsWith('/api/textbooks')) {
                    coverImage = `${API_BASE_URL}/api/books/${book.id}/cover`;
                }
                // Resolve other relative API paths to full URLs
                else if (coverImage.startsWith('/api')) {
                    coverImage = `${API_BASE_URL}${coverImage}`;
                }
            }

            return { ...book, coverImage };
        });
    }

    return data.data;
};

/**
 * Get unique categories
 */
export const getCategories = async (): Promise<string[]> => {
    const response = await fetch(`${BOOK_API_BASE}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.data.categories;
};

/**
 * Get book by ID
 */
export const getBookById = async (id: number): Promise<PublishedBook> => {
    const response = await fetch(`${BOOK_API_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch book');
    const data = await response.json();
    return data.data;
};

/**
 * Update book details (Admin)
 */
export const updateBookDetails = async (id: number, details: Partial<PublishedBook>): Promise<PublishedBook> => {
    const response = await fetch(`${BOOK_API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(details)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update book');
    }
    const data = await response.json();
    return data.data;
};

/**
 * Update book cover (Admin)
 */
export const updateBookCover = async (id: number, file: File): Promise<{ coverImage: string }> => {
    const formData = new FormData();
    formData.append('coverImage', file);

    const response = await fetch(`${BOOK_API_BASE}/${id}/cover`, {
        method: 'PUT',
        headers: {
            // Do not set Content-Type for FormData, browser sets it with boundary
            ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cover');
    }
    const data = await response.json();
    return data.data;
};

/**
 * Toggle visibility (Admin)
 */
export const updateVisibility = async (id: number, isHidden: boolean): Promise<{ isHidden: boolean }> => {
    const response = await fetch(`${BOOK_API_BASE}/${id}/visibility`, {
        method: 'PUT',
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isHidden })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update visibility');
    }
    const data = await response.json();
    return data.data;
};

/**
 * Toggle featured status (Admin)
 */
export const updateFeatured = async (id: number, isFeatured: boolean): Promise<{ isFeatured: boolean }> => {
    const response = await fetch(`${BOOK_API_BASE}/${id}/featured`, {
        method: 'PUT',
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFeatured })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update featured status');
    }
    const data = await response.json();
    return data.data;
};

/**
 * Delete book (Admin)
 */
export const deleteBook = async (id: number): Promise<void> => {
    const response = await fetch(`${BOOK_API_BASE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete book');
    }
};
