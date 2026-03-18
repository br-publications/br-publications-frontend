import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import type { Book, SectionContent } from '../../types/bookTypes';
import bookChapterService from '../../services/bookChapterService';
import { getExtraPdfUrl } from '../../services/bookChapterPublishing.service';
import { contactService, type ContactDetails } from '../../services/contactService';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import './bookchapterDetail.css';
import { setPageTitle, setMetaDescription, setOpenGraph, setCanonicalUrl, setJsonLd, resetSeo } from '../../utils/seoUtils';
import { toSlug } from '../../utils/stringUtils';

type TabType = 'synopsis' | 'scope' | 'toc' | 'biographies' | 'archives';

const BookChapterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('synopsis');
  const [contactInfo, setContactInfo] = useState<ContactDetails | null>(null);
  const [tocSearchQuery, setTocSearchQuery] = useState<string>('');

  /**
   * Helper function to parse section content into paragraphs and lists
   */
  const parseSectionContent = (section: any): SectionContent => {
    if (!section) return { paragraphs: [], lists: [] };

    const paragraphs: string[] = [];
    const lists: string[] = [];

    Object.keys(section).forEach(key => {
      if (key.startsWith('paragrapgh_') || key.startsWith('paragraph_')) {
        paragraphs.push(section[key]);
      } else if (key.startsWith('list_')) {
        lists.push(section[key]);
      }
    });

    return { paragraphs, lists };
  };

  /**
   * Load book details on component mount
   */
  useEffect(() => {
    const loadBookDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to get book from navigation state to show basic info immediately
        const stateBook = location.state?.book as Book | undefined;

        if (stateBook) {
          setBook(stateBook);
          // Don't return here! We still need to fetch the full details
          // because the list API omits large fields like synopsis, scope, etc.
        }

        // Fetch the full details from service using ID
        if (id) {
          const bookData = await bookChapterService.getBookById(parseInt(id));

          if (bookData) {
            setBook(bookData);
            // Apply SEO after data is loaded
            const slug = toSlug(bookData.title);
            const canonicalPath = `/bookchapter/${bookData.id}/${slug}`;
            const editorsStr = bookData.editors && bookData.editors.length > 0
              ? `Editors: ${bookData.editors.join(', ')}.`
              : `By ${bookData.author}.`;
            const description = bookData.synopsis
              ? Object.values(bookData.synopsis).join(' ').replace(/<[^>]+>/g, '').slice(0, 150)
              : `${bookData.title}. ${editorsStr} Published by BR ResNova Academic Press.`;

            setPageTitle(`${bookData.title} | BR ResNova Academic Press`);
            setMetaDescription(description);
            setCanonicalUrl(canonicalPath);
            setOpenGraph({
              title: `${bookData.title} | BR ResNova Academic Press`,
              description,
              image: bookData.coverImage,
              url: `${window.location.origin}${canonicalPath}`,
              type: 'book'
            });
            setJsonLd({
              '@context': 'https://schema.org',
              '@type': 'Book',
              'name': bookData.title,
              'editor': bookData.editors?.map(e => ({ '@type': 'Person', 'name': e })),
              'isbn': bookData.isbn,
              'publisher': { '@type': 'Organization', 'name': 'BR ResNova Academic Press' },
              'image': bookData.coverImage,
              'url': `${window.location.origin}${canonicalPath}`,
              'description': description,
              'numberOfPages': bookData.chapters?.length,
              ...(bookData.doi ? { 'identifier': bookData.doi } : {})
            });
          } else if (!stateBook) {
            setError('Book not found');
          }
        } else if (!stateBook) {
          setError('Invalid book ID');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book details');
        console.error('Error loading book details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookDetails();
    return () => { resetSeo(); };
  }, [id, location.state]);

  // Fetch contact info for the pricing card hover links
  useEffect(() => {
    contactService.getContactDetails()
      .then(res => { if (res.success) setContactInfo(res.data); })
      .catch(() => { /* silently ignore, links will be hidden */ });
  }, []);

  /**
   * Handle back navigation
   */
  const handleBackClick = () => {
    navigate('/bookchapters');
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Scroll to tabs container
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
      tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };



  /**
   * Copy to clipboard
   */
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

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading book details...</p>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error || !book) {
    return (
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
    );
  }

  // Parse tab content
  const synopsisContent = parseSectionContent(book.synopsis);
  const scopeContent = parseSectionContent(book.scope);
  const tocContent = parseSectionContent(book.tableContents);
  const archivesContent = parseSectionContent(book.archives);

  return (
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
                    {book.editors && book.editors.length > 0
                      ? `${book.editors.join(', ')}`
                      : (
                        <>
                          {book.author}
                          {book["co-authors"] && `, ${book["co-authors"]}`}
                        </>
                      )
                    }
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
                        <span>{book.copyright}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <strong>Pages:</strong>
                      <span>{book.pages}</span>
                    </div>
                    {book.doi && (
                      <div
                        className="meta-item clickable"
                        onClick={() => copyToClipboard(book.doi!, 'DOI')}
                        title="Click to copy DOI"
                      >
                        <strong>DOI:</strong>
                        <span>{book.doi}</span>
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
                    {/* Soft Copy Card */}
                    <div className="pricing-card">
                      <div className="pricing-icon">📄</div>
                      <p>Soft Copy</p>
                      <div className="cardPrice">
                        <div className="contact-trigger">
                          {book.pricing?.softCopyPrice ? `₹${book.pricing.softCopyPrice}` : 'Contact Us'}
                          <div className="contact-dropdown">
                            {contactInfo?.whatsapp && (
                              <a href={`https://wa.me/${contactInfo.whatsapp}`} target="_blank" rel="noreferrer" className="contact-option whatsapp">
                                <WhatsAppIcon className="contact-icon wa-icon" /> <span className="contact-text">WhatsApp</span>
                              </a>
                            )}
                            {contactInfo?.phoneNumbers && contactInfo.phoneNumbers.length > 0 && (
                              <a href={`tel:${contactInfo.phoneNumbers[0]}`} className="contact-option phone">
                                <PhoneIcon className="contact-icon phone-icon" /> <span className="contact-text">Call Us</span>
                              </a>
                            )}
                            {!contactInfo?.whatsapp && (!contactInfo?.phoneNumbers || contactInfo.phoneNumbers.length === 0) && (
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

                    {/* Hard Copy Card */}
                    <div className="pricing-card">
                      <div className="pricing-icon">📚</div>
                      <p>Hard Copy</p>
                      <div className="cardPrice">
                        <div className="contact-trigger">
                          {book.pricing?.hardCopyPrice ? `₹${book.pricing.hardCopyPrice}` : 'Contact Us'}
                          <div className="contact-dropdown">
                            {contactInfo?.whatsapp && (
                              <a href={`https://wa.me/${contactInfo.whatsapp}`} target="_blank" rel="noreferrer" className="contact-option whatsapp">
                                <WhatsAppIcon className="contact-icon wa-icon" /> <span className="contact-text">WhatsApp</span>
                              </a>
                            )}
                            {contactInfo?.phoneNumbers && contactInfo.phoneNumbers.length > 0 && (
                              <a href={`tel:${contactInfo.phoneNumbers[0]}`} className="contact-option phone">
                                <PhoneIcon className="contact-icon phone-icon" /> <span className="contact-text">Call Us</span>
                              </a>
                            )}
                            {!contactInfo?.whatsapp && (!contactInfo?.phoneNumbers || contactInfo.phoneNumbers.length === 0) && (
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

                    {/* Combined Card – Featured */}
                    <div className="pricing-card featured">
                      {/* <span className="pricing-card-badge">Best Value</span> */}
                      <div className="pricing-icon">🎁</div>
                      <p>Hard + Soft</p>
                      <div className="cardPrice">
                        <div className="contact-trigger">
                          {book.pricing?.combinedPrice ? `₹${book.pricing.combinedPrice}` : 'Contact Us'}
                          <div className="contact-dropdown">
                            {contactInfo?.whatsapp && (
                              <a href={`https://wa.me/${contactInfo.whatsapp}`} target="_blank" rel="noreferrer" className="contact-option whatsapp">
                                <WhatsAppIcon className="contact-icon wa-icon" /> <span className="contact-text">WhatsApp</span>
                              </a>
                            )}
                            {contactInfo?.phoneNumbers && contactInfo.phoneNumbers.length > 0 && (
                              <a href={`tel:${contactInfo.phoneNumbers[0]}`} className="contact-option phone">
                                <PhoneIcon className="contact-icon phone-icon" /> <span className="contact-text">Call Us</span>
                              </a>
                            )}
                            {!contactInfo?.whatsapp && (!contactInfo?.phoneNumbers || contactInfo.phoneNumbers.length === 0) && (
                              <a href="/contact" className="contact-option">
                                <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <small>Complete Bundle</small>
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

              {/* Tabs Section */}
              <div className="tabs-container">
                <div className="tab-buttons">
                  <button
                    className={`tab-btn ${activeTab === 'synopsis' ? 'active' : ''}`}
                    onClick={() => handleTabChange('synopsis')}
                  >
                    Synopsis
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'scope' ? 'active' : ''}`}
                    onClick={() => handleTabChange('scope')}
                  >
                    Scope
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'toc' ? 'active' : ''}`}
                    onClick={() => handleTabChange('toc')}
                  >
                    Table of Contents
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'biographies' ? 'active' : ''}`}
                    onClick={() => handleTabChange('biographies')}
                  >
                    Author Biographies
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'archives' ? 'active' : ''}`}
                    onClick={() => handleTabChange('archives')}
                  >
                    Archives
                  </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content-wrapper">
                  {/* Synopsis Tab */}
                  {activeTab === 'synopsis' && (
                    <div className="tab-content active">
                      <h3>Synopsis</h3>
                      {synopsisContent.paragraphs.length > 0 ? (
                        synopsisContent.paragraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                      ) : (
                        <p>No synopsis available for this book.</p>
                      )}
                      {synopsisContent.lists.length > 0 && (
                        <ul>
                          {synopsisContent.lists.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Scope Tab */}
                  {activeTab === 'scope' && (
                    <div className="tab-content active">
                      <h3>Scope</h3>
                      {scopeContent.paragraphs.length > 0 ? (
                        scopeContent.paragraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                      ) : (
                        <p>No scope information available for this book.</p>
                      )}
                      {scopeContent.lists.length > 0 && (
                        <ul>
                          {scopeContent.lists.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Table of Contents Tab */}
                  {activeTab === 'toc' && (
                    <div className="tab-content active toc-container">
                      <div className="toc-header">
                        <h3>Table of Contents</h3>
                        <div className="toc-search">
                          <input
                            type="text"
                            placeholder="Search this book..."
                            value={tocSearchQuery}
                            onChange={(e) => setTocSearchQuery(e.target.value)}
                          />
                          <button>Search</button>
                        </div>
                      </div>

                      <div className="toc-list">
                        {/* Frontmatter Rows - Hidden when searching */}
                        {!tocSearchQuery && (
                          <>
                            <div className="toc-frontmatter-row">
                              <span className="row-title">Frontmatter</span>
                              <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Frontmatter'), '_blank')}>
                                <PictureAsPdfIcon fontSize="small" /> View PDF
                              </button>
                            </div>
                            <div className="toc-frontmatter-row">
                              <span className="row-title">Detailed Table of Contents</span>
                              <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Detailed Table of Contents'), '_blank')}>
                                <PictureAsPdfIcon fontSize="small" /> View PDF
                              </button>
                            </div>
                            <div className="toc-frontmatter-row">
                              <span className="row-title">Preface</span>
                              <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Preface'), '_blank')}>
                                <PictureAsPdfIcon fontSize="small" /> View PDF
                              </button>
                            </div>
                            <div className="toc-frontmatter-row">
                              <span className="row-title">Acknowledgment</span>
                              <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Acknowledgment'), '_blank')}>
                                <PictureAsPdfIcon fontSize="small" /> View PDF
                              </button>
                            </div>
                          </>
                        )}

                        {/* Detailed Chapters */}
                        {(() => {
                          const filteredChapters = book.chapters?.filter(chap => {
                            if (!tocSearchQuery) return true;
                            const query = tocSearchQuery.toLowerCase();
                            const titleMatch = chap.title?.toLowerCase().includes(query) || false;
                            const authorMatch = chap.authors?.toLowerCase().includes(query) || false;
                            return titleMatch || authorMatch;
                          });

                          return filteredChapters && filteredChapters.length > 0 ? (
                            <>
                              {filteredChapters.map((chapter) => (
                                <div key={chapter.id} className="toc-chapter-card">
                                  <div className="chapter-card-left">
                                    <span className="chapter-badge">{chapter.chapterNumber}</span>
                                    <h4 className="chapter-title">
                                      <Link to={`/book/${book.id}/chapter/${chapter.id}`}>{chapter.title}</Link>
                                      {chapter.pages && <span className="chapter-pages"> (pages {chapter.pages})</span>}
                                    </h4>
                                    <p className="chapter-authors">{chapter.authors}</p>
                                    <p className="chapter-abstract">{chapter.abstract}</p>
                                  </div>
                                  <div className="chapters-actions-area">
                                    <button
                                      className="btn-view-pdf-alt"
                                      onClick={() => chapter.pdfUrl ? window.open(chapter.pdfUrl, '_blank') : alert('PDF not available for this chapter.')}
                                    >
                                      <PictureAsPdfIcon fontSize="small" /> View PDF
                                    </button>
                                    <button
                                      className="btn-preview"
                                      onClick={() => navigate(`/book/${book.id}/chapter/${chapter.id}`)}
                                    >
                                      Preview Chapter
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            /* Fallback to old plain text if chapters array is missing or search yields 0 results */
                            <div className="toc-fallback">
                              {tocSearchQuery && book.chapters && book.chapters.length > 0 ? (
                                <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                  No chapters found matching "{tocSearchQuery}".
                                </p>
                              ) : (
                                <>
                                  {tocContent?.paragraphs && tocContent.paragraphs.length > 0 && (
                                    <>
                                      {tocContent.paragraphs.map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                      ))}
                                    </>
                                  )}
                                  {tocContent?.lists && tocContent.lists.length > 0 && (
                                    <ul>
                                      {tocContent.lists.map((item, index) => (
                                        <li key={index}>{item}</li>
                                      ))}
                                    </ul>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}

                        {/* Backmatter Rows - Hidden when searching */}
                        {!tocSearchQuery && (
                          <>
                            <div className="toc-frontmatter-row">
                              <span className="row-title">About the Contributors</span>
                              <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'About the Contributors'), '_blank')}>
                                <PictureAsPdfIcon fontSize="small" /> View PDF
                              </button>
                            </div>
                            <div className="toc-frontmatter-row">
                              <span className="row-title">Index</span>
                              <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Index'), '_blank')}>
                                <PictureAsPdfIcon fontSize="small" /> View PDF
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Author Biographies Tab */}
                  {activeTab === 'biographies' && (
                    <div className="tab-content active">
                      <h3>Author Biographies</h3>
                      {book.authorBiographies ? (
                        Object.values(book.authorBiographies).map((author, index) => (
                          <div key={index} className="author-bio">
                            <p>
                              <strong>{author.authorName}</strong> {author.biography}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p>No author biographies available for this book.</p>
                      )}
                    </div>
                  )}

                  {/* Archives Tab */}
                  {activeTab === 'archives' && (
                    <div className="tab-content active">
                      <h3>Archives</h3>
                      {archivesContent.paragraphs.length > 0 ? (
                        archivesContent.paragraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                      ) : (
                        <p>No archives information available for this book.</p>
                      )}
                      {archivesContent.lists.length > 0 && (
                        <ul>
                          {archivesContent.lists.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BookChapterDetail;