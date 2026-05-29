import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { findEditors, type PublishedEditor } from '../../services/bookChapterPublishing.service';
import type { Book } from '../../types/bookTypes';
import bookChapterService from '../../services/bookChapterService';
import { toBookNameSlug } from '../../utils/stringUtils';
import { Helmet } from 'react-helmet-async';
import './bookChapter.css';

const ProductBookChapter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Engineering & Management',
    'Medical & Health Sciences',
    'Interdisciplinary Sciences',
  ]);

  /**
   * Helper to normalize names for reliable matching
   */
  const normalizeName = (name: string | null | undefined): string => {
    if (!name) return '';
    return name
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };
  const [selectedCategory, setSelectedCategory] = useState<string>(location.state?.category || 'All');
  const [searchQuery, setSearchQuery] = useState<string>(location.state?.searchQuery || '');
  const [author, setAuthor] = useState<string>(location.state?.author || '');
  const [publishedAfter, setPublishedAfter] = useState<string>(location.state?.publishedAfter || '');
  const [publishedBefore, setPublishedBefore] = useState<string>(location.state?.publishedBefore || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedEditors, setResolvedEditors] = useState<PublishedEditor[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  // Calculate paginated books
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  /**
   * Fetch categories once on component mount
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await bookChapterService.getCategories();
        const fetchedCategories = Array.isArray(categoriesData) ? categoriesData : [];
        const mergedCategories = Array.from(new Set([
          'All',
          'Engineering & Management',
          'Medical & Health Sciences',
          'Interdisciplinary Sciences',
          ...fetchedCategories
        ]));
        setCategories(mergedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  /**
   * Dispatch prerender-ready event so Puppeteer snapshots the page
   * only after the list data is loaded.
   */
  useEffect(() => {
    if (!loading) {
      setTimeout(() => document.dispatchEvent(new Event('prerender-ready')), 300);
    }
  }, [loading]);

  /**
   * Fetch books when filters change
   */
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let booksData: Book[];
        // If we have any search criteria, use searchBooks service
        if (searchQuery || author || (selectedCategory && selectedCategory !== 'All') || publishedAfter || publishedBefore) {
          booksData = await bookChapterService.searchBooks({
            query: searchQuery,
            author,
            category: selectedCategory,
            publishedAfter,
            publishedBefore
          });
        } else {
          // Otherwise, fetch all books
          booksData = await bookChapterService.getAllBooks();
        }

        if (!controller.signal.aborted) {
          setFilteredBooks(booksData);
          setCurrentPage(1); // Reset to first page when filtering
        }

      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'An error occurred while loading books');
          console.error('Error loading books:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [selectedCategory, searchQuery, author, publishedAfter, publishedBefore]);

  /**
   * Dynamic ID Resolution for Editors in the list
   * Debounced and throttled to avoid hitting rate limits (429)
   */
  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const resolveMissingEditorIds = async () => {
      // Get all unique editor names from the current filtered books that don't have details
      const allEditorNames = Array.from(new Set(
        filteredBooks.flatMap(b => b.editors || [])
      ));

      const missingNames = allEditorNames.filter(name =>
        !resolvedEditors.some(re => re.name.trim().toLowerCase() === name.trim().toLowerCase()) &&
        !filteredBooks.some(b => b.editorDetails?.some(ed => ed.name.trim().toLowerCase() === name.trim().toLowerCase()))
      );

      if (missingNames.length === 0) return;

      // Limit to avoid hitting rate limits or flooding (resolve first 5 missing at a time)
      const namesToResolve = missingNames.slice(0, 5);

      try {
        const results = await Promise.all(
          namesToResolve.map(name => findEditors({ name }))
        );

        if (controller.signal.aborted) return;

        const newlyFound = results.flat().filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

        if (newlyFound.length > 0) {
          setResolvedEditors(prev => {
            const combined = [...prev, ...newlyFound];
            return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          });
        } else {
          // If none of these names were found, add them to a "resolved" list with null IDs 
          // to prevent re-trying them infinitely in this session
          // For now, we skip them by treating them as "not resolvable" in this run
        }
      } catch (err) {
        console.error('Error resolving editor IDs in list:', err);
      }
    };

    if (filteredBooks.length > 0) {
      // Add a 800ms debounce to allow the page to settle before firing multiple small requests
      timeoutId = setTimeout(resolveMissingEditorIds, 800);
    }

    return () => {
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [filteredBooks, resolvedEditors.length]);

  /**
   * Sync category and search query if location state changes (e.g., from header search)
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
   * Handle category selection
   */
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  /**
   * Handle book preview/details navigation
   */
  const handleBookClick = (book: Book) => {
    const identifier = book.uid ? book.uid.toLowerCase() : book.id;
    const slug = book.title ? toBookNameSlug(book.title) : '';
    navigate(`/bookchapter/${identifier}/${slug}`, {
      state: { book }
    });
  };

  /**
   * Pagination handlers
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <Helmet>
          <title>Book Chapters | BR ResNova Academic Press</title>
          <meta name="description" content="Explore a comprehensive collection of peer-reviewed book chapters and academic research across various disciplines." />
        </Helmet>
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
        <Helmet>
          <title>Error | BR ResNova Academic Press</title>
          <meta name="robots" content="index, follow" />
        </Helmet>
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
      <Helmet>
        <title>Book Chapters | BR ResNova Academic Press</title>
        <meta name="description" content="Explore a comprehensive collection of peer-reviewed book chapters and academic research across various disciplines including Engineering, Management, Science, and Technology." />
        <meta name="keywords" content="book chapters, academic research, peer-reviewed publications, ResNova Academic Press, scholarly chapters" />
        <link rel="canonical" href="https://www.brpublications.com/bookchapters" />
      </Helmet>
      <section id="productBookPage" className="productBook-page">
        {/* Hero Section */}
        <section className="productBook-hero">
          <h1>Book Chapters</h1>
        </section>

        <div className="productBook-wrapper">
          {/* Sidebar */}
          <aside className="bookChapter-sidebar">
            <div className="sidebar-card">
              <h3>📚 Categories</h3>
              <ul>
                {categories.map((category) => (
                  <li key={category}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSearchQuery(''); // clear search when manually clicking category
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
          </aside>

          {/* Main Content */}
          <div className="productBook-container">
            <section className="productBook-section">
              {/* No books found message */}
              {filteredBooks.length === 0 ? (
                <div className="no-books-message" style={{ textAlign: 'center', margin: '40px 0', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
                  <i className="fas fa-book" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                  <h3>No Books Found</h3>
                  {searchQuery ? (
                    <p>No book chapter was available in the name of that searched value: <strong>{searchQuery}</strong></p>
                  ) : (
                    <p>No books available in this category.</p>
                  )}
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
                            <p className="editors-list">
                              {Array.isArray(book.editors) && book.editors.length > 0 ? (
                                book.editors.map((editorName, index) => {
                                  const normalizedTarget = normalizeName(editorName);
                                  const editorDetail = (book.editorDetails || []).find(ed => normalizeName(ed.name) === normalizedTarget) ||
                                    resolvedEditors.find(ed => normalizeName(ed.name) === normalizedTarget);
                                  return (
                                    <React.Fragment key={index}>
                                      {editorDetail ? (
                                        <Link
                                          to={`/editor/${String(editorDetail.id).padStart(2, '0')}/${toBookNameSlug(editorDetail.name)}`}
                                          className="editor-link"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {editorName}
                                        </Link>
                                      ) : (
                                        editorName
                                      )}
                                      {index < (book.editors?.length || 0) - 1 ? ', ' : ''}
                                    </React.Fragment>
                                  );
                                })
                              ) : (
                                book.author
                              )}
                            </p>

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

export default ProductBookChapter;