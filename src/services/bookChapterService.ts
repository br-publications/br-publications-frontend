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

        // Map chapters — Prefer relational 'chapters' if available, fallback to 'tableContents' JSONB
        let mappedChapters: Chapter[] = [];

        console.log('DEBUG: mapBookData for Book ID', data.id, 'Relational Chapters count:', data.chapters?.length || 0);
        
        if (data.chapters && data.chapters.length > 0) {
            console.log('DEBUG: First Relational Chapter Audit:', {
                id: data.chapters[0].id,
                title: data.chapters[0].title,
                pdfKey: data.chapters[0].pdfKey,
                hasPdfData: !!data.chapters[0].pdfData,
                allFields: Object.keys(data.chapters[0])
            });
        }

        if (data.chapters && data.chapters.length > 0) {
            mappedChapters = data.chapters.map((ch, index: number) => ({
                id: ch.id,
                chapterNumber: ch.chapterNumber || '',
                title: ch.title || '',
                authors: ch.authors || '',
                abstract: ch.abstract || '',
                price: ch.priceSoftCopy || 0,
                pages: (ch.pagesFrom && ch.pagesTo) ? `${ch.pagesFrom}-${ch.pagesTo}` : (ch.pages || ''),
                pdfKey: ch.pdfKey,
                pdfUrl: ch.pdfKey ? getChapterPdfUrl(data.id, index) : (ch.pdfData || undefined),
                views: ch.views || 0,
                authorDetails: ch.authorDetails
            }));
        } else {
            mappedChapters = (data.tableContents || []).map((toc, index: number) => ({
                id: `chapter-${index + 1}`,
                chapterNumber: toc.chapterNumber || `Chapter ${index + 1}`,
                title: toc.title || '',
                authors: toc.authors || '',
                abstract: toc.abstract || '',
                price: toc.priceCombined || toc.priceSoftCopy || 0,
                pages: (toc.pagesFrom && toc.pagesTo) ? `${toc.pagesFrom}-${toc.pagesTo}` : '',
                pdfKey: toc.pdfKey,
                pdfUrl: toc.pdfKey ? getChapterPdfUrl(data.id, index) : (toc.pdfData || undefined),
                views: toc.views || 0
            }));
        }

        return {
            id: data.id,
            title: data.title,
            author: data.author,
            "co-authors": data.coAuthors,
            editors: data.editors,
            primaryEditor: data.primaryEditor,
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
            synopsis: data.synopsis,
            scope: data.scope,
            tableContents: data.tableContents as any, // Raw toc
            authorBiographies: data.authorBiographies as any,
            archives: data.archives,
            pricing: data.pricing,
            chapters: mappedChapters,
            googleLink: data.googleLink,
            flipkartLink: data.flipkartLink,
            amazonLink: data.amazonLink
        };
    }

    /**
     * Get mapped book data
     */
    private mapBooksResponse(books: PublishedBookChapter[]): Book[] {
        return books.map(book => this.mapBookData(book));
    }

    /**
     * Fetch all books
     * @returns Promise with books array
     */
    async getAllBooks(): Promise<Book[]> {
        try {
            // We want only visible books for the public frontend
            const response = await getAllPublishedChapters({ limit: 100, includeHidden: false });
            return this.mapBooksResponse(response.items || []);
        } catch (error) {
            console.error('Error fetching books:', error);
            throw new Error('Failed to load books. Please try again later.');
        }
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
}

// Export singleton instance
export const bookChapterService = new BookChapterService();
export default bookChapterService;
