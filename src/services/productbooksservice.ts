// src/services/booksService.ts
import axios from 'axios';
import { API_BASE_URL } from './api.config';
import type { Book } from '../types/bookTypes';

/**
 * Service class to handle all book-related data operations
 * Fetches data from the backend API
 */
class ProductBooksService {
  /**
   * Helper to map backend data to frontend Book interface
   */
  private mapBookData(data: any): Book {
    let coverImage = data.coverImage || '/placeholder-book.png';

    // If it's a protected API path from submission (starts with /api/textbooks), 
    // switch to public published book endpoint: /api/books/:id/cover
    if (coverImage.startsWith('/api/textbooks') && data.id) {
      coverImage = `${API_BASE_URL}/api/books/${data.id}/cover`;
    }
    // Resolve other relative API paths to full URLs
    else if (coverImage.startsWith('/api')) {
      coverImage = `${API_BASE_URL}${coverImage}`;
    }

    return {
      ...data,
      'co-authors': data.coAuthors,
      coverImage: coverImage,
    };
  }

  /**
   * Get filtered mapped book data
   * Since the backend returns `coAuthors` but frontend expects `co-authors`
   */
  private mapBooksResponse(books: any[]): Book[] {
    return books.map(book => this.mapBookData(book));
  }

  /**
   * Fetch all books
   * @returns Promise with books array
   */
  async getAllBooks(filters?: { featured?: boolean; limit?: number }): Promise<Book[]> {
    try {
      const limit = filters?.limit ?? 100; // Default 100 — backward compatible
      let url = `${API_BASE_URL}/api/books?limit=${limit}`;
      if (filters?.featured) {
        url += '&featured=true';
      }
      const response = await axios.get(url);
      // The backend returns { data: { books: [], pagination: {} } } usually wrapped in success response?
      // Let's check the controller `sendSuccess`. It usually returns generic structure.
      // publishedBookController.getAllBooks returns:
      // sendSuccess(res, { books: rows, pagination: ... }, ...)
      // So data is response.data.data.books

      const responseData = response.data;
      // Handle standard response wrapper if exists (success, data, message)
      const books = responseData.data?.books || responseData.books || [];

      return this.mapBooksResponse(books);
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
      const response = await axios.get(`${API_BASE_URL}/api/books/${id}`);
      const bookData = response.data.data || response.data;

      if (!bookData) {
        return null;
      }

      return this.mapBookData(bookData);
    } catch (error) {
      console.error(`Error fetching book with ID ${id}:`, error);
      // Return null or throw? returning null for consistency with previous implementation
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

      const response = await axios.get(`${API_BASE_URL}/api/books?category=${encodeURIComponent(category)}&limit=100`);
      const responseData = response.data;
      const books = responseData.data?.books || responseData.books || [];

      return this.mapBooksResponse(books);
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
      const response = await axios.get(`${API_BASE_URL}/api/books/categories`);
      const data = response.data.data || response.data;
      return data.categories || ['All'];
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

      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (author) params.append('author', author);
      if (category && category !== 'All') params.append('category', category);
      if (publishedAfter) params.append('publishedAfter', publishedAfter);
      if (publishedBefore) params.append('publishedBefore', publishedBefore);
      params.append('limit', '100');

      const response = await axios.get(`${API_BASE_URL}/api/books?${params.toString()}`);
      const responseData = response.data;
      const books = responseData.data?.books || responseData.books || [];

      return this.mapBooksResponse(books);
    } catch (error) {
      console.error('Error searching books:', error);
      throw new Error('Failed to search books.');
    }
  }

  /**
   * Get the full image path for a book cover
   * This method might be redundant if we use the URL directly from the book object
   * but kept for compatibility
   * @param imageName - Image filename or URL
   * @returns Full image path/URL
   */
  getBookCoverPath(imageName: string): string {
    if (!imageName) return '/placeholder-book.png';
    if (imageName.startsWith('http') || imageName.startsWith('data:')) {
      return imageName;
    }
    // If it's a relative path starting with /api, prepend base url
    if (imageName.startsWith('/api')) {
      return `${API_BASE_URL}${imageName}`;
    }
    return imageName;
  }
}

// Export singleton instance
export const productBooksService = new ProductBooksService();
export default productBooksService;