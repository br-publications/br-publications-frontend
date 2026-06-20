// src/services/bookChapterService.ts
import type { Book, Chapter } from '../types/bookTypes';
import {
    getAllPublishedChapters,
    getPublishedChapterById,
    getCategories,
    getCoverUrl,
    getChapterPdfUrl
} from './bookChapterPublishing.service';
import type { PublishedBookChapter } from './bookChapterPublishing.service';

/**
 * Service class to handle book chapter data operations
 * Now uses the real backend API instead of dummy data.
 */
class BookChapterService {
    /**
     * Helper to safely parse JSON strings or return the data as is if already an object/array.
     */
    private safeJsonParse<T>(data: any, defaultValue: T): T {
        if (typeof data === 'string' && data.trim().startsWith('{') || typeof data === 'string' && data.trim().startsWith('[')) {
            try {
                return JSON.parse(data) as T;
            } catch (error) {
                console.error('Failed to parse JSON field:', error);
                return defaultValue;
            }
        }
        return (data as T) || defaultValue;
    }

    /**
     * Helper to map backend PublishedBookChapter to frontend Book interface
     */
    private mapBookData(data: PublishedBookChapter): Book {
        let coverImage = '/assets/books/placeholder.png'; // Updated placeholder relative path
        if (data.hasCoverImage) {
            coverImage = getCoverUrl(data.id, data.updatedAt ? new Date(data.updatedAt).getTime() : undefined);
        } else if (data.coverImage) {
            // Fallback for old data where coverImage might be a URL or relative path
            coverImage = data.coverImage;
        }

        // Parse JSON fields that might be returned as strings from the backend
        const synopsis = this.safeJsonParse(data.synopsis, {});
        const scope = this.safeJsonParse(data.scope, {});
        const tableContentsArray = this.safeJsonParse<any[]>(data.tableContents, []);
        const authorBiographies = this.safeJsonParse(data.authorBiographies, []);
        const archives = this.safeJsonParse(data.archives, {});
        const pricing = this.safeJsonParse(data.pricing, {});
        const frontmatterPdfs = this.safeJsonParse(data.frontmatterPdfs, {});
        const editorBiographies = this.safeJsonParse<any>(data.editorBiographies || (data as any).editor_biographies, []);

        // Map chapters — Prefer relational 'chapters' if available, fallback to 'tableContents' JSONB
        let mappedChapters: Chapter[] = [];

        if (data.chapters && data.chapters.length > 0) {
            mappedChapters = data.chapters.map((ch, index: number) => ({
                id: ch.id,
                chapterNumber: ch.chapterNumber || String(index + 1).padStart(2, '0'),
                title: ch.title || '',
                authors: ch.authors || '',
                abstract: ch.abstract || '',
                price: 0, // Relational chapters don't have individual prices in the current model
                pages: (ch.pagesFrom || ch.pagesTo) ? `${ch.pagesFrom || '?'}${ch.pagesTo ? `-${ch.pagesTo}` : ''}` : '',
                pdfKey: ch.pdfKey,
                pdfUrl: (ch.pdfKey || ch.publishedFileId || ch.pdfName) ? getChapterPdfUrl(data.id, index, ch.pdfKey, ch.publishedFileId) : (ch.pdfData || undefined),
                doi: ch.doi || undefined,
                views: ch.views || 0,
                authorDetails: ch.authorDetails
            }));
        } else {
            mappedChapters = tableContentsArray.map((toc: any, index: number) => ({
                id: `chapter-${index + 1}`,
                chapterNumber: toc.chapterNumber || `Chapter ${index + 1}`,
                title: toc.title || '',
                authors: toc.authors || '',
                abstract: toc.abstract || '',
                price: toc.priceCombined || toc.priceSoftCopy || 0,
                pages: (toc.pagesFrom || toc.pagesTo) ? `${toc.pagesFrom || '?'}${toc.pagesTo ? `-${toc.pagesTo}` : ''}` : '',
                pdfKey: toc.pdfKey,
                pdfUrl: toc.pdfKey ? getChapterPdfUrl(data.id, index) : (toc.pdfData || undefined),
                doi: toc.doi || undefined,
                views: toc.views || 0
            }));
        }

        // Defensive mapping for arrays that might be returned as strings or null from backend
        const editorsRaw = data.editors;
        let safeEditors: string[] = [];
        if (Array.isArray(editorsRaw)) {
            safeEditors = editorsRaw;
        } else if (typeof editorsRaw === 'string') {
            const parsed = this.safeJsonParse<any>(editorsRaw, null);
            if (Array.isArray(parsed)) {
                safeEditors = parsed;
            } else {
                // Not a JSON array, split by comma and trim
                safeEditors = (editorsRaw as string).split(',').map(s => s.trim()).filter(Boolean);
            }
        }

        const keywordsRaw = data.keywords;
        const safeKeywords = Array.isArray(keywordsRaw)
            ? keywordsRaw
            : (typeof keywordsRaw === 'string' ? this.safeJsonParse(keywordsRaw, [keywordsRaw]) : []);

        // Also check biographies for editor names if safeEditors is empty
        if (safeEditors.length === 0 && (editorBiographies as any)) {
            if (Array.isArray(editorBiographies)) {
                safeEditors = (editorBiographies as any).map((eb: any) => eb.editorName || eb.name);
            } else if (typeof editorBiographies === 'object' && editorBiographies !== null) {
                safeEditors = Object.values(editorBiographies).map((eb: any) => eb.editorName || eb.name);
            }
        }

        // Distinct names
        safeEditors = [...new Set(safeEditors)];

        return {
            id: data.id,
            title: data.title,
            author: data.author,
            "co-authors": data.coAuthors,
            editors: Array.isArray(safeEditors) ? safeEditors : [safeEditors],
            keywords: Array.isArray(safeKeywords) ? safeKeywords : [safeKeywords],
            primaryEditor: data.primaryEditor,
            editorDetails: this.safeJsonParse(data.editorDetails || (data as any).editor_details || (data as any).publishedEditors, []),
            coverImage: coverImage,
            category: data.category,
            description: data.description || '',
            indexedIn: data.indexedIn,
            releaseDate: data.releaseDate,
            copyright: data.copyright,
            doi: data.doi,
            isbn: data.isbn,
            publishedDate: data.publishedDate,
            pages: data.pages,
            synopsis,
            scope,
            tableContents: tableContentsArray as any, // Raw toc
            authorBiographies,
            editorBiographies,
            archives,
            pricing,
            chapters: mappedChapters,
            googleLink: data.googleLink,
            flipkartLink: data.flipkartLink,
            amazonLink: data.amazonLink,
            frontmatterPdfs
        };

    }

    /**
     * Get mapped book data
     */
    private mapBooksResponse(books: PublishedBookChapter[]): Book[] {
        return books.map(book => this.mapBookData(book));
    }

    private cachedAllBooks: { data: Book[], timestamp: number } | null = null;
    private allBooksPromise: Promise<Book[]> | null = null;
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Fetch all books
     * @returns Promise with books array
     */
    async getAllBooks(): Promise<Book[]> {
        if (this.cachedAllBooks && Date.now() - this.cachedAllBooks.timestamp < this.CACHE_TTL) {
            return this.cachedAllBooks.data;
        }
        if (this.allBooksPromise) {
            return this.allBooksPromise;
        }

        const fetchPromise = (async () => {
            try {
                // We want only visible books for the public frontend
                const response = await getAllPublishedChapters({ limit: 100, includeHidden: false });
                const mapped = this.mapBooksResponse(response.items || []);
                this.cachedAllBooks = { data: mapped, timestamp: Date.now() };
                return mapped;
            } catch (error) {
                console.error('Error fetching books:', error);
                throw new Error('Failed to load books. Please try again later.');
            } finally {
                this.allBooksPromise = null;
            }
        })();

        this.allBooksPromise = fetchPromise;
        return fetchPromise;
    }

    /**
     * Fetch a single book by ID
     * @param id - Book ID
     * @returns Promise with book details
     */
    async getBookById(id: number): Promise<Book | null> {
        try {
            const response = await getPublishedChapterById(id);
            if (!response) {
                return null;
            }
            return this.mapBookData(response);
        } catch (error) {
            console.error(`Error fetching book with ID ${id}:`, error);
            return null;
        }
    }

    /**
     * Filter books by category
     * @param category - Category name
     * @returns Promise with filtered books array
     */
    async getBooksByCategory(category: string): Promise<Book[]> {
        try {
            if (category === 'All' || !category) {
                return this.getAllBooks();
            }
            const response = await getAllPublishedChapters({ limit: 100, category, includeHidden: false });
            return this.mapBooksResponse(response.items || []);
        } catch (error) {
            console.error(`Error filtering books by category ${category}:`, error);
            throw new Error('Failed to filter books.');
        }
    }

    /**
     * Get all unique categories
     * @returns Promise with categories array
     */
    async getCategories(): Promise<string[]> {
        try {
            const backendCategories = await getCategories();
            return ['All', ...backendCategories];

        } catch (error) {
            console.error('Error fetching categories:', error);
            return ['All'];
        }
    }

    /**
     * Search books with advanced filters
     * @param options - Search criteria
     * @returns Promise with search results
     */
    async searchBooks(options: {
        query?: string;
        author?: string;
        category?: string;
        publishedAfter?: string;
        publishedBefore?: string;
    }): Promise<Book[]> {
        try {
            const { query, author, category, publishedAfter, publishedBefore } = options;

            const params: any = {
                limit: 100,
                includeHidden: false,
                ...(query && { search: query }),
                ...(author && { author }),
                ...(publishedAfter && { publishedAfter }),
                ...(publishedBefore && { publishedBefore }),
            };

            if (category && category !== 'All') {
                params.category = category;
            }

            const response = await getAllPublishedChapters(params);
            return this.mapBooksResponse(response.items || []);
        } catch (error) {
            console.error('Error searching books:', error);
            throw new Error('Failed to search books.');
        }
    }

    /**
     * Fetch paginated books from server
     * @param options - Search criteria with pagination
     * @returns Promise with books, totalPages, and total counts
     */
    async getPaginatedBooks(options: {
        page?: number;
        limit?: number;
        query?: string;
        author?: string;
        category?: string;
        publishedAfter?: string;
        publishedBefore?: string;
    }): Promise<{ books: Book[], totalPages: number, total: number }> {
        try {
            const params: any = {
                limit: options.limit || 20,
                includeHidden: false,
                ...(options.page && { page: options.page }),
                ...(options.query && { search: options.query }),
                ...(options.author && { author: options.author }),
                ...(options.publishedAfter && { publishedAfter: options.publishedAfter }),
                ...(options.publishedBefore && { publishedBefore: options.publishedBefore }),
            };

            if (options.category && options.category !== 'All') {
                params.category = options.category;
            }

            const response = await getAllPublishedChapters(params);
            
            return {
                books: this.mapBooksResponse(response.items || response.books || response.data?.books || []),
                totalPages: response.pagination?.totalPages || response.totalPages || 1,
                total: response.pagination?.total || response.total || (response.items || []).length
            };
        } catch (error) {
            console.error('Error fetching paginated books:', error);
            throw new Error('Failed to load books. Please try again later.');
        }
    }
}

// Export singleton instance
export const bookChapterService = new BookChapterService();
export default bookChapterService;
