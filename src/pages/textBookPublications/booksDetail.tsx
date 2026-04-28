import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { Book } from '../../types/bookTypes';
import productBooksService from '../../services/productbooksservice';
import { contactService, type ContactDetails } from '../../services/contactService';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import './booksDetail.css';
import { sanitizeUrl } from '../../utils/urlValidation';
import { Helmet } from 'react-helmet-async';

const BooksDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        const stateBook = location.state?.book as Book | undefined;

        if (stateBook) {
          setBook(stateBook);
        }

        if (id) {
          const bookData = await productBooksService.getBookById(parseInt(id));
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
      setTimeout(() => document.dispatchEvent(new Event('prerender-ready')), 500);
    }
  }, [loading]);

  const handleBackClick = () => {
    navigate('/books');
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

  // SEO and Metadata logic
  const displayTitle = book
    ? `${book.title} by ${book.author} | BR Publications`
    : (id ? `Book Details | BR Publications` : 'Book Details');
  const metaDescription = book?.synopsis
    ? Object.values(book.synopsis).join(' ').replace(/<[^>]+>/g, '').slice(0, 150)
    : book ? `${book.title} by ${book.author} — published by BR Publications.` : 'Detailed information about academic books and research publications from BR Publications.';

  const canonicalUrlFull = `https://www.brpublications.com/book/${id}`;

  const schemaData = book ? {
    '@context': 'https://schema.org',
    '@type': 'Book',
    'name': book.title,
    'author': { '@type': 'Person', 'name': book.author },
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
    ...(book.publishedDate ? { 'datePublished': book.publishedDate } : {})
  } : null;

  return (
    <>
      <Helmet>
        <title>{displayTitle}</title>
        <meta name="description" content={metaDescription} />
        {book && (
          <>
            <meta name="keywords" content={`${book.title}, ${book.author ?? ''}, academic book, ${book.isbn}, BR Publications, peer-reviewed`} />
            <meta property="og:title" content={displayTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={book.coverImage} />
            <meta property="og:url" content={canonicalUrlFull} />
            <meta property="og:type" content="book" />
            <link rel="canonical" href={canonicalUrlFull} />

            {/* Google Scholar / Academic Metadata */}
            <meta name="citation_title" content={book.title} />
            <meta name="citation_author" content={book.author} />
            {book["co-authors"] && book["co-authors"].split(',').map(name => (
              <meta name="citation_author" content={name.trim()} key={name} />
            ))}
            {book.publishedDate && <meta name="citation_publication_date" content={book.publishedDate} />}
            <meta name="citation_isbn" content={book.isbn} />
            <meta name="citation_publisher" content="BR Publications" />
            <meta name="citation_language" content="en" />
            <meta name="citation_abstract_html_url" content={canonicalUrlFull} />
            {book.doi && <meta name="citation_doi" content={book.doi} />}
            {schemaData && <script type="application/ld+json">{JSON.stringify(schemaData)}</script>}
          </>
        )}
        {error && <meta name="robots" content="noindex, follow" />}
      </Helmet>

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
                                  <a href="/contact" className="contact-option">
                                    <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                                  </a>
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
                                  <a href="/contact" className="contact-option">
                                    <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                                  </a>
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
                                  <a href="/contact" className="contact-option">
                                    <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                                  </a>
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
    </>
  );
};

export default BooksDetail;