import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Book } from '../../types/bookTypes';
import productBooksService from '../../services/productbooksservice';
import { toSlug } from '../../utils/stringUtils';
import './productBooks.css';

const ProductBooks: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(location.state?.searchQuery || '');
  const [author, setAuthor] = useState<string>(location.state?.author || '');
  const [publishedAfter, setPublishedAfter] = useState<string>(location.state?.publishedAfter || '');
  const [publishedBefore, setPublishedBefore] = useState<string>(location.state?.publishedBefore || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(location.state?.category || 'All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  // Calculate paginated books
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  /**
   * Fetch all books on component mount
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [booksData] = await Promise.all([
          productBooksService.getAllBooks(),
          productBooksService.getCategories()
        ]);

        setFilteredBooks(booksData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while loading books');
        console.error('Error loading books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Sync category and search query if location state changes (e.g. from header search)
   */
  useEffect(() => {
    if (location.state?.category) {
      setSelectedCategory(location.state.category);
    }
    if (location.state?.searchQuery !== undefined) {
      setSearchQuery(location.state.searchQuery);
    }
    if (location.state?.author !== undefined) {
      setAuthor(location.state.author);
    }
    if (location.state?.publishedAfter !== undefined) {
      setPublishedAfter(location.state.publishedAfter);
    }
    if (location.state?.publishedBefore !== undefined) {
      setPublishedBefore(location.state.publishedBefore);
    }
  }, [location.state]);

  /**
   * Filter books by search query / category
   */
  useEffect(() => {
    const filterBooks = async () => {
      try {
        setLoading(true);
        const filtered = await productBooksService.searchBooks({
          query: searchQuery,
          author,
          category: selectedCategory,
          publishedAfter,
          publishedBefore
        });
        setFilteredBooks(filtered);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error filtering books:', err);
      } finally {
        setLoading(false);
      }
    };

    filterBooks();
  }, [searchQuery, author, selectedCategory, publishedAfter, publishedBefore]);

  /**
   * Filter books by category
   */
  /**
   * Filter books by category
   */
  // useEffect(() => {
  //   const filterBooks = async () => {
  //     try {
  //       const filtered = await productBooksService.getBooksByCategory(selectedCategory);
  //       setFilteredBooks(filtered);
  //       setCurrentPage(1); // Reset to first page when filtering
  //     } catch (err) {
  //       console.error('Error filtering books:', err);
  //     }
  //   };

  //   if (selectedCategory) {
  //     filterBooks();
  //   }
  // }, [selectedCategory]);

  /**
   * Scroll to top when page changes
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  /**
   * Handle category selection
   */
  /**
   * Handle category selection
   */
  // const handleCategoryChange = (category: string) => {
  //   setSelectedCategory(category);
  // };

  /**
   * Handle book preview/details navigation
   */
  const handleBookClick = (book: Book) => {
    const slug = toSlug(book.title);
    navigate(`/book/${book.id}/${slug}`, {
      state: { book }
    });
  };

  /**
   * Pagination handlers
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  /**
   * Generate page numbers for pagination
   */
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisiblePages = 6;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page range, and last page
      pages.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (startPage > 2) pages.push(-1); // -1 represents ellipsis

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) pages.push(-1); // -1 represents ellipsis
      pages.push(totalPages);
    }

    return pages;
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading books...</p>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Books</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="content">
      <section id="productBookPage" className="productBook-page">
        {/* Hero Section */}
        <section className="productBook-hero">
          <h1>Books Published</h1>
        </section>

        <div className="productBook-wrapper">
          {/* Sidebar 
          <aside className="productBook-sidebar">
            <div className="sidebar-card">
              <h3>📚 Categories</h3>
              <ul>
                {categories.map((category) => (
                  <li key={category}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategoryChange(category);
                      }}
                      className={selectedCategory === category ? 'active' : ''}
                    >
                      <i className="fas fa-angle-right"></i>
                      {category}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside> */}

          {/* Main Content */}
          <div className="productBook-container">
            <section className="productBook-section">
              {/* No books found message */}
              {filteredBooks.length === 0 ? (
                <div className="no-books-message">
                  <i className="fas fa-book"></i>
                  <h3>No Books Found</h3>
                  <p>No books available in this category.</p>
                </div>
              ) : (
                <>
                  {/* Books Grid */}
                  <section className="trending-books" id="home-books">
                    <div id="productBooks-grid" className="productBooks-grid">
                      {paginatedBooks.map((book) => (
                        <div
                          key={book.id}
                          className="book-card"
                          onClick={() => handleBookClick(book)}
                        >
                          <div className="book-cover">
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                // Fallback image if book cover fails to load
                                e.currentTarget.src = '/assets/books/placeholder.png';
                              }}
                            />
                          </div>
                          <div className="book-info">
                            <h3>{book.title}</h3>
                            <p>by {book.author}</p>
                          </div>
                          <div className="book-buttons">
                            <button
                              className="preview-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookClick(book);
                              }}
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pag-btn"
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                      >
                        First
                      </button>
                      <button
                        className="pag-btn"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        Back
                      </button>

                      <div className="page-numbers">
                        {getPageNumbers().map((pageNum, index) => (
                          pageNum === -1 ? (
                            <span key={`ellipsis-${index}`} className="ellipsis">...</span>
                          ) : (
                            <button
                              key={pageNum}
                              className={`page ${currentPage === pageNum ? 'active' : ''}`}
                              onClick={() => goToPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          )
                        ))}
                      </div>

                      <button
                        className="pag-btn"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                      <button
                        className="pag-btn"
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProductBooks;