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

        // Map Table of Contents payloads to Chapter format used in UI
        const mappedChapters: Chapter[] = (data.tableContents || []).map((toc: any, index: number) => ({
            id: `chapter-${index + 1}`,
            chapterNumber: toc.chapterNumber || `Chapter ${index + 1}`,
            title: toc.title || '',
            authors: toc.authors || '',
            abstract: toc.abstract || '',
            price: toc.priceCombined || toc.priceSoftCopy || 0,
            pages: (toc.pagesFrom && toc.pagesTo) ? `${toc.pagesFrom}-${toc.pagesTo}` : '',
            pdfKey: toc.pdfKey,
            pdfUrl: (toc.pdfKey || toc.pdfData) ? getChapterPdfUrl(data.id, index) : undefined
        }));

        return {
            id: data.id,
            title: data.title,
            author: data.author,
            "co-authors": data.coAuthors,
            editors: data.editors,
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
