'use client';
import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { Book } from '../../types/bookTypes';
import productBooksService from '../../services/productbooksservice';
import { contactService, type ContactDetails } from '../../services/contactService';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Quote } from 'lucide-react';
import CitationModal from '../../components/common/CitationModal';
import './booksDetail.css';
import { sanitizeUrl } from '../../utils/urlValidation';
import { toBookNameSlug } from '../../utils/stringUtils';
import Link from 'next/link';

const BooksDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const location = React.useMemo(() => ({ pathname, state: {}, search: "" }), [pathname]);
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCitationOpen, setIsCitationOpen] = useState<boolean>(false);

  /**
   * Load book details and contact info on component mount
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch contact details
        try {
          const contactResponse = await contactService.getContactDetails();
          if (contactResponse.success) {
            setContactDetails(contactResponse.data);
          }
        } catch (contactErr) {
          console.error('Failed to fetch contact details:', contactErr);
        }

        // Fetch book details
        const stateBook = (location.state as any)?.book as Book | undefined;

        if (stateBook) {
          setBook(stateBook);
        }

        if (id) {
          const bookData = await productBooksService.getBookById(id);
          if (bookData) {
            setBook(bookData);
          } else if (!stateBook) {
            setError('Book not found');
          }
        } else if (!stateBook) {
          setError('Invalid book ID');
          setLoading(false);
          return;
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book details');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, location.state]);

  /**
   * Dispatch prerender-ready event so Puppeteer snapshots the page
   * only after data is loaded and page-specific metadata is set.
   */
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        document.dispatchEvent(new Event('prerender-ready'));
      }, 500);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && book) {
      setTimeout(() => {
        document.dispatchEvent(new Event('ZoteroItemUpdated'));
        window.dispatchEvent(new Event('ZoteroItemUpdated'));
      }, 500);
    }
  }, [loading, book]);

  const handleBackClick = () => {
    router.push('/books');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      window.dispatchEvent(new CustomEvent('app-alert', {
        detail: {
          type: 'success',
          title: 'Copied',
          message: `${label} copied to clipboard!`
        }
      }));
    });
  };

  // Helper to split author strings by comma, 'and', etc.
  const getAuthorsList = (authorStr?: string, coAuthorStr?: string): string[] => {
    const list: string[] = [];
    if (authorStr) {
      authorStr.split(/, and | and |,/).forEach(a => {
        const trimmed = a.trim();
        if (trimmed) list.push(trimmed);
      });
    }
    if (coAuthorStr) {
      coAuthorStr.split(/, and | and |,/).forEach(a => {
        const trimmed = a.trim();
        if (trimmed) list.push(trimmed);
      });
    }
    return list;
  };

  const authorsList = book ? getAuthorsList(book.author, book["co-authors"]) : [];

  // SEO and Metadata logic
  const displayTitle = book
    ? `${book.title} | BR Publications`
    : (id ? `Book Details | BR Publications` : 'Book Details');
  let metaDescription = 'Detailed information about academic books and research publications from BR Publications.';
  if (book) {
    if (book.description) {
      metaDescription = book.description.replace(/<[^>]+>/g, '').trim().slice(0, 160);
    } else if (book.synopsis) {
      metaDescription = Object.values(book.synopsis).join(' ').replace(/<[^>]+>/g, '').trim().slice(0, 160);
    } else {
      metaDescription = `${book.title} by ${book.author} — published by BR Publications.`;
    }
  }

  const identifier = book?.uid 
    ? book.uid.toLowerCase() 
    : (book?.id ?? id!);
  const bookSlug = book?.title ? toBookNameSlug(book.title) : '';
  const canonicalUrlFull = bookSlug 
    ? `https://www.brpublications.com/book/${identifier}/${bookSlug}`
    : `https://www.brpublications.com/book/${identifier}`;

  const schemaData = book ? {
    '@context': 'https://schema.org',
    '@type': 'Book',
    'name': book.title,
    'author': authorsList.map(name => ({ '@type': 'Person', 'name': name })),
    'isbn': book.isbn,
    'publisher': {
      '@type': 'Organization',
      'name': 'BR Publications',
      'url': 'https://www.brpublications.com'
    },
    'image': book.coverImage,
    'url': canonicalUrlFull,
    'description': metaDescription,
    'inLanguage': 'en',
    'numberOfPages': book.pages ? Number(book.pages) : undefined,
    ...(book.doi ? { 'identifier': book.doi } : {}),
    ...(book.publishedDate ? { 'datePublished': book.publishedDate } : {})
  } : null;

  // Generate COinS title parameter
  const getCoinsTitle = (bk: Book, authsList: string[]): string => {
    const params = new URLSearchParams();
    params.append('ctx_ver', 'Z39.88-2004');
    params.append('rft_val_fmt', 'info:ofi/fmt:kev:mtx:book');
    params.append('rft.genre', 'book');
    params.append('rft.btitle', bk.title);
    params.append('rft.pub', 'BR Publications');

    authsList.forEach(auth => {
      params.append('rft.au', auth);
    });

    const year = bk.releaseDate 
      ? bk.releaseDate.split('-')[0] 
      : bk.publishedDate 
        ? bk.publishedDate.split('-')[0] 
        : bk.copyright 
          ? bk.copyright.replace(/[^\d]/g, '') 
          : '';
    if (year) params.append('rft.date', year);
    if (bk.isbn) params.append('rft.isbn', bk.isbn);
    if (bk.pages) params.append('rft.pages', String(bk.pages));
    if (bk.doi) {
      params.append('rft_id', `info:doi/${bk.doi}`);
    }
    return params.toString();
  };

  return (
    <>
      {book && schemaData && (
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      )}

      {loading && !book ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading details...</p>
        </div>
      ) : error || !book ? (
        <div className="error-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Book Not Found</h3>
            <p>{error || 'The requested book could not be found.'}</p>
            <button onClick={handleBackClick} className="back-button">
              Back to Products
            </button>
          </div>
        </div>
      ) : (
        <main className="content">
          <section id="resNovaPage" className="resNova-page">
            {/* COinS Metadata Span for reference extraction tools like Zotero */}
            <span className="Z3988" style={{ display: 'none' }} title={getCoinsTitle(book, authorsList)}></span>
            {/* Hero Section */}
            <section className="product-hero">
              <div className="hero-content">
                <button onClick={handleBackClick} className="back-btn">
                  <i className="fas fa-arrow-left"></i> Back to Books List
                </button>
                <h1>Book Details</h1>
              </div>
            </section>

            <div className="product-wrapper">
              {/* Main Content */}
              <div className="product-container">
                <section className="product-section">
                  {/* Product Details Grid */}
                  <div className="product-grid">
                    {/* Book Cover */}
                    <div className="book-cover-large">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        onError={(e) => {
                          e.currentTarget.src = '/assets/books/placeholder.png';
                        }}
                      />
                    </div>

                    {/* Book Details */}
                    <div className="book-details">
                      <h1>{book.title}</h1>
                      <p className="author-list">
                        {book.author}
                        {book["co-authors"] && (
                          <span className="co-authors-text">
                            {", "}
                            {book["co-authors"]}
                          </span>
                        )}
                      </p>

                      <button
                        onClick={() => setIsCitationOpen(true)}
                        className="cite-trigger-btn"
                        title="Generate citation for this book"
                      >
                        <Quote size={14} /> Cite this Book
                      </button>

                      <div className="meta-info">
                        {book.indexedIn && (
                          <div className="meta-item">
                            <strong>Indexed In:</strong>
                            <span>{book.indexedIn}</span>
                          </div>
                        )}
                        {book.releaseDate && (
                          <div className="meta-item">
                            <strong>Release Date:</strong>
                            <span>{book.releaseDate}</span>
                          </div>
                        )}
                        {book.copyright && (
                          <div className="meta-item">
                            <strong>Copyright:</strong>
                            <span>© {book.copyright}</span>
                          </div>
                        )}
                        <div className="meta-item">
                          <strong>Pages:</strong>
                          <span>{book.pages}</span>
                        </div>
                        {book.doi && (
                          <div className="meta-item">
                            <strong>DOI:</strong>
                            <a href={sanitizeUrl(book.doi)} target="_blank" rel="noopener noreferrer">{book.doi}</a>
                          </div>
                        )}
                        <div
                          className="meta-item clickable"
                          onClick={() => copyToClipboard(book.isbn, 'ISBN')}
                          title="Click to copy ISBN"
                        >
                          <strong>ISBN:</strong>
                          <span>{book.isbn}</span>
                        </div>
                      </div>

                      {/* Online Selling Links */}
                      {(book.googleLink || book.flipkartLink || book.amazonLink) && (
                        <div className="online-selling-links">
                          <h3>Available on Online Stores</h3>
                          {book.googleLink && (
                            <a href={book.googleLink} target="_blank" rel="noreferrer" className="selling-link-btn google">
                              <i className="fab fa-google"></i> Google Books
                            </a>
                          )}
                          {book.flipkartLink && (
                            <a href={book.flipkartLink} target="_blank" rel="noreferrer" className="selling-link-btn flipkart">
                              <i className="fas fa-shopping-bag"></i> Flipkart
                            </a>
                          )}
                          {book.amazonLink && (
                            <a href={book.amazonLink} target="_blank" rel="noreferrer" className="selling-link-btn amazon">
                              <i className="fab fa-amazon"></i> Amazon
                            </a>
                          )}
                        </div>
                      )}

                      {/* Pricing Options */}
                      <div className="pricing-options">
                        <div className="pricing-card">
                          <div className="pricing-icon">📄</div>
                          <p>Soft Copy</p>
                          <div className="cardPrice">
                            <div className="contact-trigger">
                              {book.pricing?.softCopyPrice ? `₹${book.pricing.softCopyPrice}` : 'Contact Us'}
                              <div className="contact-dropdown">
                                {contactDetails?.whatsapp && (
                                  <a href={`https://wa.me/${contactDetails.whatsapp}`} target="_blank" rel="noreferrer" className="contact-option whatsapp">
                                    <WhatsAppIcon className="contact-icon wa-icon" /> <span className="contact-text">WhatsApp</span>
                                  </a>
                                )}
                                {contactDetails?.phoneNumbers && contactDetails.phoneNumbers.length > 0 && (
                                  <a href={`tel:${contactDetails.phoneNumbers[0]}`} className="contact-option phone">
                                    <PhoneIcon className="contact-icon phone-icon" /> <span className="contact-text">Call Us</span>
                                  </a>
                                )}
                                {!contactDetails?.whatsapp && (!contactDetails?.phoneNumbers || contactDetails.phoneNumbers.length === 0) && (
                                  <Link href="/contact" className="contact-option">
                                    <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                          <small>Digital PDF Format</small>
                          <div className="pricing-card-divider" />
                          <ul className="pricing-card-features">
                            <li>Instant download access</li>
                            <li>Searchable &amp; printable PDF</li>
                            <li>Lifetime digital access</li>
                          </ul>
                        </div>

                        <div className="pricing-card">
                          <div className="pricing-icon">📚</div>
                          <p>Hard Copy</p>
                          <div className="cardPrice">
                            <div className="contact-trigger">
                              {book.pricing?.hardCopyPrice ? `₹${book.pricing.hardCopyPrice}` : 'Contact Us'}
                              <div className="contact-dropdown">
                                {contactDetails?.whatsapp && (
                                  <a href={`https://wa.me/${contactDetails.whatsapp}`} target="_blank" rel="noreferrer" className="contact-option whatsapp">
                                    <WhatsAppIcon className="contact-icon wa-icon" /> <span className="contact-text">WhatsApp</span>
                                  </a>
                                )}
                                {contactDetails?.phoneNumbers && contactDetails.phoneNumbers.length > 0 && (
                                  <a href={`tel:${contactDetails.phoneNumbers[0]}`} className="contact-option phone">
                                    <PhoneIcon className="contact-icon phone-icon" /> <span className="contact-text">Call Us</span>
                                  </a>
                                )}
                                {!contactDetails?.whatsapp && (!contactDetails?.phoneNumbers || contactDetails.phoneNumbers.length === 0) && (
                                  <Link href="/contact" className="contact-option">
                                    <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                          <small>Physical Book</small>
                          <div className="pricing-card-divider" />
                          <ul className="pricing-card-features">
                            <li>Premium printed edition</li>
                            <li>Shipped to your address</li>
                            <li>Durable binding &amp; cover</li>
                          </ul>
                        </div>

                        <div className="pricing-card featured">
                          <div className="pricing-icon">🎁</div>
                          <p>Hard + Soft</p>
                          <div className="cardPrice">
                            <div className="contact-trigger">
                              {book.pricing?.bundlePrice ? `₹${book.pricing.bundlePrice}` : 'Contact Us'}
                              <div className="contact-dropdown">
                                {contactDetails?.whatsapp && (
                                  <a href={`https://wa.me/${contactDetails.whatsapp}`} target="_blank" rel="noreferrer" className="contact-option whatsapp">
                                    <WhatsAppIcon className="contact-icon wa-icon" /> <span className="contact-text">WhatsApp</span>
                                  </a>
                                )}
                                {contactDetails?.phoneNumbers && contactDetails.phoneNumbers.length > 0 && (
                                  <a href={`tel:${contactDetails.phoneNumbers[0]}`} className="contact-option phone">
                                    <PhoneIcon className="contact-icon phone-icon" /> <span className="contact-text">Call Us</span>
                                  </a>
                                )}
                                {!contactDetails?.whatsapp && (!contactDetails?.phoneNumbers || contactDetails.phoneNumbers.length === 0) && (
                                  <Link href="/contact" className="contact-option">
                                    <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                          <small>Best Value Bundle</small>
                          <div className="pricing-card-divider" />
                          <ul className="pricing-card-features">
                            <li>Print + digital edition</li>
                            <li>Instant PDF &amp; shipped copy</li>
                            <li>Maximum savings</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </main>
      )}

      {book && (
        <CitationModal
          isOpen={isCitationOpen}
          onClose={() => setIsCitationOpen(false)}
          item={{
            type: 'book',
            title: book.title,
            authors: authorsList,
            year: book.releaseDate ? book.releaseDate.split('-')[0] : book.publishedDate ? book.publishedDate.split('-')[0] : book.copyright ? book.copyright.replace(/[^\d]/g, '') : '',
            publisher: 'BR Publications',
            isbn: book.isbn,
            doi: book.doi,
            pages: book.pages ? String(book.pages) : undefined
          }}
        />
      )}
    </>
  );
};

export default BooksDetail;