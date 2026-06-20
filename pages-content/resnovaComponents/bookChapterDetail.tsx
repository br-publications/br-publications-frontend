'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import type { Book, SectionContent } from '../../types/bookTypes';
import bookChapterService from '../../services/bookChapterService';
import { getExtraPdfUrl, incrementChapterViews, findEditors, type PublishedEditor } from '../../services/bookChapterPublishing.service';
import { contactService, type ContactDetails } from '../../services/contactService';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { ArrowLeft, Quote } from 'lucide-react';
import CitationModal from '../../components/common/CitationModal';
import './bookChapterDetail.css';
import { sanitizeUrl } from '../../utils/urlValidation';
import { toBookNameSlug } from '../../utils/stringUtils';
import Link from 'next/link';

type TabType = 'synopsis' | 'scope' | 'toc' | 'biographies' | 'archives';

const BookChapterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const location = React.useMemo(() => ({ pathname, state: {}, search: "" }), [pathname]);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);

  /**
   * Helper to normalize names for reliable matching
   * Handle non-breaking spaces, multi-spaces, and casing
   */
  const normalizeName = (name: string | null | undefined): string => {
    if (!name) return '';
    return name
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
      .replace(/\s+/g, ' ')    // Collapse multiple spaces
      .trim()
      .toLowerCase();
  };
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('synopsis');
  const [isCitationOpen, setIsCitationOpen] = useState<boolean>(false);
  const [contactInfo, setContactInfo] = useState<ContactDetails | null>(null);
  const [tocSearchQuery, setTocSearchQuery] = useState<string>('');
  const [resolvedEditors, setResolvedEditors] = useState<PublishedEditor[]>([]);

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

        // SEO Redirect for zero-padded IDs
        if (id && /^0+\d+$/.test(id)) {
            const cleanId = parseInt(id, 10).toString();
            const newPath = window.location.pathname.replace(`/bookchapter/${id}`, `/bookchapter/${cleanId}`);
            router.push(newPath);
            return;
        }

        // First, try to get book from navigation state to show basic info immediately
        const stateBook = (location.state as any)?.book as Book | undefined;

        if (stateBook) {
          setBook(stateBook);
          // Don't return here! We still need to fetch the full details
          // because the list API omits large fields like synopsis, scope, etc.
        }

        // Fetch the full details from service using ID
        if (id) {
          let numericId: number | null = null;
          const isNumeric = /^\d+$/.test(id);

          if (isNumeric) {
            numericId = parseInt(id);
          } else if (stateBook && stateBook.id) {
            numericId = stateBook.id;
          } else {
            // Fallback: Resolve UID to numeric ID by matching from the books list
            try {
              const allBooks = await bookChapterService.getAllBooks();
              const matchedBook = allBooks.find(b => b.uid && b.uid.toLowerCase() === id.toLowerCase());
              if (matchedBook) {
                numericId = matchedBook.id;
              }
            } catch (resolveErr) {
              console.error('Error resolving book chapter UID:', resolveErr);
            }
          }

          if (numericId) {
            const bookData = await bookChapterService.getBookById(numericId);
            if (bookData) {
              setBook(bookData);
            } else if (!stateBook) {
              setError('Book not found');
            }
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



  // Fetch contact info for the pricing card hover links
  useEffect(() => {
    contactService.getContactDetails()
      .then(res => { if (res.success) setContactInfo(res.data); })
      .catch(() => { /* silently ignore, links will be hidden */ });
  }, []);

  // Resolve editor details dynamically by name if book.editors is present
  useEffect(() => {
    const resolveBookEditors = async () => {
      if (!book || !book.editors || book.editors.length === 0) {
        setResolvedEditors([]);
        return;
      }

      try {
        const promises = book.editors.map(async (editorName) => {
          const normalizedTarget = normalizeName(editorName);
          
          // Check if we already have it in editorDetails
          const existing = book.editorDetails?.find(
            ed => normalizeName(ed.name) === normalizedTarget
          );
          if (existing) return existing;

          // Otherwise, fetch from database using findEditors API
          let matched: PublishedEditor | null = null;
          try {
            const results = await findEditors({ name: editorName });
            matched = results.find(
              r => normalizeName(r.name) === normalizedTarget
            ) || null;
          } catch (e) {
            console.error('Failed to fetch editor by name:', e);
          }

          if (matched) return matched;

          // Check biographies to get affiliation if any
          let affiliation = '';
          if (book.editorBiographies) {
            let bioArray: any[] = [];
            if (Array.isArray(book.editorBiographies)) {
              bioArray = book.editorBiographies;
            } else if (typeof book.editorBiographies === 'object') {
              bioArray = Object.values(book.editorBiographies);
            }
            const bioMatch = bioArray.find(
              b => normalizeName(b.editorName || b.name) === normalizedTarget
            );
            if (bioMatch && bioMatch.affiliation) {
              affiliation = bioMatch.affiliation;
            }
          }

          return {
            id: 0,
            name: editorName,
            affiliation
          } as PublishedEditor;
        });

        const resolved = await Promise.all(promises);
        setResolvedEditors(resolved);
      } catch (err) {
        console.error('Error resolving editors:', err);
      }
    };

    resolveBookEditors();
  }, [book]);

  /**
   * Handle back navigation
   */
  const handleBackClick = () => {
    router.push('/bookchapters');
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

  const handleChapterAction = async (chap: any, action: 'view' | 'pdf') => {
    if (typeof chap.id === 'number') {
      try {
        await incrementChapterViews(chap.id);
        // Optimistically update local state
        setBook(prev => {
          if (!prev || !prev.chapters) return prev;
          return {
            ...prev,
            chapters: prev.chapters.map(c =>
              c.id === chap.id ? { ...c, views: (c.views || 0) + 1 } : c
            )
          };
        });
      } catch (err) {
        console.error('Failed to increment views:', err);
      }
    }

    if (action === 'view') {
      const bookIdentifier = book?.uid ? book.uid.toLowerCase() : book?.id;
      const cleanNum = String(chap.chapterNumber).toLowerCase().trim().replace(/^chapter[-_ \s]*/, '');
      const chapterSlugSegment = `chapter-${cleanNum}`;
      const chapterTitleSlug = chap.title ? toBookNameSlug(chap.title) : '';
      router.push(`/book/${bookIdentifier}/${chapterSlugSegment}/${chapterTitleSlug}`);
    } else {
      if (chap.pdfUrl) {
        window.open(chap.pdfUrl, '_blank');
      } else {
        alert('PDF not available for this chapter.');
      }
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

  // SEO and Metadata logic
  // SEO and Metadata logic
  // Build a consistent displayTitle that ALWAYS includes the brand suffix.
  // Every <Helmet> in this component just uses {displayTitle} — never append the suffix again.
  const displayTitle = book
    ? `${book.title}${book.editors && book.editors.length > 0 ? ` by ${book.editors.join(', ')}` : book.author ? ` by ${book.author}` : ''} | BR ResNova Academic Press`
    : (id ? `Book Chapter Details | BR Publications` : 'Book Chapter Details | BR Publications');
  const editorsStr = book && Array.isArray(book.editors) && book.editors.length > 0
    ? `Editors: ${book.editors.join(', ')}.`
    : book?.author ? `By ${book.author}.` : '';

  let metaDescription = 'Detailed information about academic book chapters and research publications from BR Publications.';
  if (book) {
    if (book.description) {
      metaDescription = book.description.replace(/<[^>]+>/g, '').trim().slice(0, 160);
    } else if (book.synopsis) {
      metaDescription = Object.values(book.synopsis).join(' ').replace(/<[^>]+>/g, '').trim().slice(0, 160);
    } else {
      metaDescription = `${book.title}. ${editorsStr} Published by BR ResNova Academic Press.`;
    }
  }

  const identifier = book?.uid ? book.uid.toLowerCase() : (book?.id ?? id!);
  const bookSlug = book?.title ? toBookNameSlug(book.title) : '';
  const canonicalUrlFull = bookSlug
    ? `https://www.brpublications.com/bookchapter/${identifier}/${bookSlug}`
    : `https://www.brpublications.com/bookchapter/${identifier}`;

  const schemaData = book ? {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "editor": book.editors?.map(e => ({ '@type': 'Person', 'name': e })),
    "isbn": book.isbn,
    "publisher": {
      "@type": "Organization",
      "name": "BR ResNova Academic Press",
      "url": "https://www.brpublications.com"
    },
    "image": book.coverImage,
    "url": canonicalUrlFull,
    "description": metaDescription,
    "inLanguage": "en",
    "numberOfPages": book.chapters?.length,
    ...(book.doi ? { 'identifier': book.doi } : {})
  } : null;

  /**
   * Render loading state
   */
  if (loading && !book) {
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

  // Tab contents parsed
  const synopsisContent = parseSectionContent(book.synopsis);
  const scopeContent = parseSectionContent(book.scope);
  const tocContent = parseSectionContent(book.tableContents);
  const archivesContent = parseSectionContent(book.archives);

  return (
    <>
      {book && schemaData && (
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      )}
      {loading && !book ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading book details...</p>
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
        <section id="resNovaPage" className="resNova-page">
          <section className="product-hero">
            <div className="hero-content">
              <Link href="/bookchapters" className="simple-back-link">
                <ArrowLeft size={16} />Back
              </Link>
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
                    <h1 className="book-chapter-title">{book.title}</h1>
                    <p className="author-list">
                      {resolvedEditors.length > 0 ? (
                        resolvedEditors.map((editorDetail, index) => {
                          return (
                            <React.Fragment key={index}>
                              {editorDetail.id > 0 ? (
                                <>
                                  <Link href={`/editor/${String(editorDetail.id)}/${toBookNameSlug(editorDetail.name)}`} className="editor-link">
                                    {editorDetail.name}
                                  </Link>
                                  {editorDetail.affiliation && (
                                    <span className="editor-affiliation">
                                      {' '}({editorDetail.affiliation.trim().replace(/^\((.*)\)$/, '$1').trim()})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span>{editorDetail.name}</span>
                                  {editorDetail.affiliation && (
                                    <span className="editor-affiliation">
                                      {' '}({editorDetail.affiliation.trim().replace(/^\((.*)\)$/, '$1').trim()})
                                    </span>
                                  )}
                                </>
                              )}
                              {index < resolvedEditors.length - 1 ? ', ' : ''}
                            </React.Fragment>
                          );
                        })
                      ) : Array.isArray(book.editors) && book.editors.length > 0 ? (
                        book.editors.map((editorName, index) => (
                          <React.Fragment key={index}>
                            {editorName}
                            {index < (book.editors?.length || 0) - 1 ? ', ' : ''}
                          </React.Fragment>
                        ))
                      ) : (
                        <span>{book.author}</span>
                      )}
                    </p>

                    <button
                      onClick={() => setIsCitationOpen(true)}
                      className="cite-trigger-btn"
                      title="Generate citation for this book"
                    >
                      <Quote size={14} /> Cite
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
                          <span>{book.copyright}</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <strong>Pages:</strong>
                        <span>{book.pages}</span>
                      </div>
                      {book.doi && (
                        <div
                          className="meta-item"
                        >
                          <strong>DOI:</strong>
                          <a href={sanitizeUrl(book.doi)} target="_blank" rel="noopener noreferrer" className="doi-link">{book.doi}</a>
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
                                <Link href="/contact" className="contact-option">
                                  <span className="contact-icon email-icon">✉️</span> <span className="contact-text">Contact Page</span>
                                </Link>
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
                    {book.authorBiographies && <button className={`tab-btn ${activeTab === 'biographies' ? 'active' : ''}`} onClick={() => setActiveTab('biographies')}>Author Biographies</button>}
                    {book.archives && <button className={`tab-btn ${activeTab === 'archives' ? 'active' : ''}`} onClick={() => setActiveTab('archives')}>Archives</button>}
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
                              {(book.frontmatterPdfs?.['Frontmatter']?.pdfKey || (book.frontmatterPdfs?.['Frontmatter'] as any)?.publishedFileId) && (
                                <div className="toc-frontmatter-row">
                                  <span className="row-title">Frontmatter</span>
                                  <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Frontmatter'), '_blank')}>
                                    <PictureAsPdfIcon fontSize="small" /> View PDF
                                  </button>
                                </div>
                              )}
                              {(book.frontmatterPdfs?.['Detailed Table of Contents']?.pdfKey || (book.frontmatterPdfs?.['Detailed Table of Contents'] as any)?.publishedFileId) && (
                                <div className="toc-frontmatter-row">
                                  <span className="row-title">Detailed Table of Contents</span>
                                  <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Detailed Table of Contents'), '_blank')}>
                                    <PictureAsPdfIcon fontSize="small" /> View PDF
                                  </button>
                                </div>
                              )}
                              {(book.frontmatterPdfs?.['Preface']?.pdfKey || (book.frontmatterPdfs?.['Preface'] as any)?.publishedFileId) && (
                                <div className="toc-frontmatter-row">
                                  <span className="row-title">Preface</span>
                                  <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Preface'), '_blank')}>
                                    <PictureAsPdfIcon fontSize="small" /> View PDF
                                  </button>
                                </div>
                              )}
                              {(book.frontmatterPdfs?.['Acknowledgment']?.pdfKey || (book.frontmatterPdfs?.['Acknowledgment'] as any)?.publishedFileId) && (
                                <div className="toc-frontmatter-row">
                                  <span className="row-title">Acknowledgment</span>
                                  <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Acknowledgment'), '_blank')}>
                                    <PictureAsPdfIcon fontSize="small" /> View PDF
                                  </button>
                                </div>
                              )}
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
                                {[...filteredChapters].sort((a, b) =>
                                  a.chapterNumber.toString().localeCompare(b.chapterNumber.toString(), undefined, { numeric: true })
                                ).map((chapter) => (
                                  <div key={chapter.id} className="toc-chapter-card">
                                    <div className="chapter-card-left">
                                      <span className="chapter-badge">{chapter.chapterNumber}</span>
                                      <h4 className="chapter-title">
                                        <span className="chapter-link-span" onClick={() => handleChapterAction(chapter, 'view')} style={{ cursor: 'pointer', color: '#1e5292' }}>{chapter.title}</span>
                                        {chapter.pages && <span className="chapter-pages"> (pages {chapter.pages})</span>}
                                      </h4>
                                      <div className="chapter-meta-row" style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                                        <span className="chapter-views"><strong>Views:</strong> {chapter.views || 0}</span>
                                      </div>
                                      <p className="chapter-authors">
                                        {chapter.authorDetails && chapter.authorDetails.length > 0 ? (
                                          chapter.authorDetails.map((author, index) => (
                                            <React.Fragment key={author.id}>
                                              <Link href={`/author/${String(author.id)}/${toBookNameSlug(author.name)}`}>{author.name}</Link>
                                              {index < chapter.authorDetails!.length - 1 ? ', ' : ''}
                                            </React.Fragment>
                                          ))
                                        ) : chapter.authors}
                                      </p>
                                      <p className="chapter-abstract">{chapter.abstract}</p>
                                    </div>
                                    <div className="chapters-actions-area">
                                      {chapter.pdfUrl && (
                                        <button
                                          className="btn-view-pdf-alt"
                                          onClick={() => handleChapterAction(chapter, 'pdf')}
                                        >
                                          <PictureAsPdfIcon fontSize="small" /> View PDF
                                        </button>
                                      )}
                                      <button
                                        className="btn-preview"
                                        onClick={() => handleChapterAction(chapter, 'view')}
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
                              {(book.frontmatterPdfs?.['About the Contributors']?.pdfKey || (book.frontmatterPdfs?.['About the Contributors'] as any)?.publishedFileId) && (
                                <div className="toc-frontmatter-row">
                                  <span className="row-title">About the Contributors</span>
                                  <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'About the Contributors'), '_blank')}>
                                    <PictureAsPdfIcon fontSize="small" /> View PDF
                                  </button>
                                </div>
                              )}
                              {(book.frontmatterPdfs?.['Index']?.pdfKey || (book.frontmatterPdfs?.['Index'] as any)?.publishedFileId) && (
                                <div className="toc-frontmatter-row">
                                  <span className="row-title">Index</span>
                                  <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Index'), '_blank')}>
                                    <PictureAsPdfIcon fontSize="small" /> View PDF
                                  </button>
                                </div>
                              )}
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
                          (Array.isArray(book.authorBiographies)
                            ? book.authorBiographies
                            : Object.values(book.authorBiographies)
                          ).map((author, index) => {
                            // Try to find author ID from any chapter's authorDetails
                            const linkedAuthor = book.chapters?.flatMap(c => c.authorDetails || [])
                              .find(a => a.name === (author as any).authorName || (author as any).name);

                            return (
                              <div key={index} className="author-bio">
                                <p>
                                  <strong>
                                    {linkedAuthor ? (
                                      <Link href={`/author/${String(linkedAuthor.id).padStart(2, '0')}/${toBookNameSlug((author as any).authorName || (author as any).name)}`}>{(author as any).authorName || (author as any).name}</Link>
                                    ) : ((author as any).authorName || (author as any).name)}
                                  </strong> {(author as any).biography}
                                </p>
                              </div>
                            );
                          })
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
      )}

      {book && (
        <CitationModal
          isOpen={isCitationOpen}
          onClose={() => setIsCitationOpen(false)}
          item={{
            type: 'book',
            title: book.title,
            authors: [],
            editors: book.editors || [],
            year: book.releaseDate ? book.releaseDate.split('-')[0] : book.publishedDate ? book.publishedDate.split('-')[0] : book.copyright ? book.copyright.replace(/[^\d]/g, '') : '',
            publisher: 'BR ResNova Academic Press',
            isbn: book.isbn,
            doi: book.doi,
            pages: book.pages ? String(book.pages) : undefined
          }}
        />
      )}
    </>
  );
};

export default BookChapterDetail;
