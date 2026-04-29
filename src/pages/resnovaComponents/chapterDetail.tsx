import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { bookChapterService } from '../../services/bookChapterService';
import { getExtraPdfUrl, incrementChapterViews } from '../../services/bookChapterPublishing.service';
import type { Book, Chapter, PublishedAuthor } from '../../types/bookTypes';
import { generateUniqueSlug } from '../../utils/stringUtils';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { sanitizeUrl } from '../../utils/urlValidation';
import './chapterDetail.css';
import { Helmet } from 'react-helmet-async';

/**
 * Helper to truncate text to a specific number of words
 */
const truncateWords = (text: string, count: number) => {
    if (!text) return '';
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= count) return text;
    return words.slice(0, count).join(' ') + '...';
};

const ChapterDetail: React.FC = () => {

    const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
    const navigate = useNavigate();
    const [book, setBook] = useState<Book | null>(null);
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const renderAuthors = (authors: string, details?: PublishedAuthor[]) => {
        if (!details || details.length === 0) return authors;

        return details.map((auth, idx) => (
            <React.Fragment key={auth.id}>
                {/* separator: ", and " before last, ", " between others, nothing before first */}
                {idx > 0 && (
                    idx === details.length - 1
                        ? <span style={{ color: '#555', fontWeight: 'normal' }}>{' and '}</span>
                        : ', '
                )}
                {/* keep name + affiliation together so they never break mid-name */}
                <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                    <Link to={`/author/${auth.id}`} className="author-link">{auth.name}</Link>
                    {auth.affiliation && (
                        <span className="author-affiliation">
                            {' '}{auth.affiliation.trim().startsWith('(') ? auth.affiliation : `(${auth.affiliation})`}
                        </span>
                    )}
                </span>
            </React.Fragment>
        ));
    };

    useEffect(() => {
        const fetchBookAndChapter = async () => {
            try {
                setLoading(true);
                if (!id || !chapterId) {
                    setError('Invalid routing parameters.');
                    return;
                }

                const fetchedBook = await bookChapterService.getBookById(Number(id));
                setBook(fetchedBook);

                if (fetchedBook && fetchedBook.chapters) {
                    const normalizedParam = String(chapterId).toLowerCase().trim();
                    const foundChapter = fetchedBook.chapters.find(c =>
                        String(c.chapterNumber).toLowerCase().trim() === normalizedParam
                    );

                    if (foundChapter) {
                        setChapter(foundChapter);
                    } else {
                        setError('Chapter not found in this book.');
                    }
                } else {
                    setError('No chapters available for this book.');
                }
            } catch (err) {
                console.error('Error fetching details:', err);
                setError('Failed to load chapter details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookAndChapter();
    }, [id, chapterId]);

    /**
     * Dispatch prerender-ready event so Puppeteer snapshots the page
     * only after data is loaded and page-specific metadata is set.
     */
    useEffect(() => {
        if (!loading) {
            setTimeout(() => document.dispatchEvent(new Event('prerender-ready')), 500);
        }
    }, [loading]);

    const handleViewChapter = async (chap: Chapter) => {
        if (typeof chap.id === 'number') {
            try {
                await incrementChapterViews(chap.id);
                setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
            } catch (err) {
                console.error('Failed to increment views:', err);
            }
        } else {
            setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
        }
        navigate(`/book/${book?.id}/chapter/${chap.chapterNumber}`);
    };

    const handleViewPdf = async (chap: Chapter) => {
        if (typeof chap.id === 'number') {
            try {
                await incrementChapterViews(chap.id);
                setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
            } catch (err) {
                console.error('Failed to increment views:', err);
            }
        } else {
            setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
        }

        if (chap.pdfUrl) {
            window.open(chap.pdfUrl, '_blank');
        } else {
            alert('PDF not available for this chapter.');
        }
    };

    // SEO and Metadata logic
    const authorNames = chapter?.authorDetails && chapter.authorDetails.length > 0
        ? chapter.authorDetails.map(a => a.name).join(', ')
        : chapter?.authors || '';

    const displayTitle = (chapter && book) ? `${chapter.title} by ${authorNames} | ${book.title} — BR Publications` : (id && chapterId ? `Chapter ${chapterId} Details | BR Publications` : 'Chapter Details');
    const metaDescription = chapter?.abstract
        ? chapter.abstract.slice(0, 155)
        : (chapter && book) ? `${chapter.title} — a chapter from "${book.title}" published by BR Publications.` : 'Detailed information about academic research chapters from BR Publications.';
    const canonicalUrlFull = (book && chapter) ? `https://www.brpublications.com/book/${book.id}/chapter/${String(chapter.chapterNumber).padStart(2, '0')}` : `https://www.brpublications.com/book/${id}/chapter/${chapterId}`;

    const schemaData = (book && chapter) ? {
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        'name': chapter.title,
        'headline': chapter.title,
        'description': metaDescription,
        'author': chapter.authorDetails && chapter.authorDetails.length > 0
            ? chapter.authorDetails.map(a => ({
                '@type': 'Person',
                'name': a.name,
                'url': `https://www.brpublications.com/author/${a.id}`,
                ...(a.affiliation ? { 'affiliation': { '@type': 'Organization', 'name': a.affiliation } } : {})
            }))
            : [{ '@type': 'Person', 'name': chapter.authors }],
        'isPartOf': {
            '@type': 'Book',
            'name': book.title,
            'isbn': book.isbn,
            'publisher': {
                '@type': 'Organization',
                'name': 'BR Publications',
                'url': 'https://www.brpublications.com'
            },
            'image': book.coverImage,
            'url': `https://www.brpublications.com/bookchapter/${book.id}/${generateUniqueSlug(book.isbn, book.releaseDate)}`
        },
        'url': canonicalUrlFull,
        'inLanguage': 'en',
        ...(chapter.doi ? { 'identifier': { '@type': 'PropertyValue', 'propertyID': 'DOI', 'value': chapter.doi } } : {}),
        ...(chapter.pages ? { 'pagination': chapter.pages } : {}),
    } : null;

    return (
        <>
            <Helmet>
                <title>{displayTitle}</title>
                <meta name="description" content={metaDescription} />
                {error && <meta name="robots" content="noindex, follow" />}
            </Helmet>
            
            {chapter && book && (
                <Helmet>
                    <meta name="keywords" content={`${chapter.title}, ${authorNames}, ${book.title}, ${book.isbn}, book chapter, academic research, BR Publications`} />
                    <meta property="og:title" content={displayTitle} />
                    <meta property="og:description" content={metaDescription} />
                    <meta property="og:image" content={book.coverImage} />
                    <meta property="og:url" content={canonicalUrlFull} />
                    <meta property="og:type" content="article" />
                    <link rel="canonical" href={canonicalUrlFull} />

                    {/* Google Scholar / Academic Metadata */}
                    <meta name="citation_title" content={chapter.title} />
                    {chapter.authorDetails && chapter.authorDetails.length > 0 ? (
                        chapter.authorDetails.map(a => (
                            <meta name="citation_author" content={a.name} key={a.id} />
                        ))
                    ) : (
                        chapter.authors && <meta name="citation_author" content={chapter.authors} />
                    )}
                    {(book.publishedDate || book.releaseDate) && (
                        <meta name="citation_publication_date" content={book.publishedDate || book.releaseDate} />
                    )}
                    <meta name="citation_inbook_title" content={book.title} />
                    {book.editors && book.editors.map(name => (
                        <meta name="citation_editor" content={name} key={name} />
                    ))}
                    <meta name="citation_publisher" content="BR Publications" />
                    <meta name="citation_isbn" content={book.isbn} />
                    <meta name="citation_language" content="en" />
                    <meta name="citation_abstract_html_url" content={canonicalUrlFull} />
                    {chapter.pages && chapter.pages.includes('-') ? (
                        [
                            <meta key="firstpage" name="citation_firstpage" content={chapter.pages.split('-')[0].trim()} />,
                            <meta key="lastpage" name="citation_lastpage" content={chapter.pages.split('-')[1].trim()} />
                        ]
                    ) : (
                        chapter.pages && <meta name="citation_firstpage" content={chapter.pages} />
                    )}
                    <meta name="citation_pdf_url" content={`https://api.brpublications.com/api/book-chapter-publishing/${id}/pdf`} />
                    {chapter.doi && <meta name="citation_doi" content={chapter.doi} />}
                    {schemaData && <script type="application/ld+json">{JSON.stringify(schemaData)}</script>}
                </Helmet>
            )}

            {loading && (!book || !chapter) ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading chapter details...</p>
                </div>
            ) : error || !book || !chapter ? (
                <div className="error-container">
                    <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        <p>{error || 'Chapter details could not be found.'}</p>
                        <button onClick={() => navigate(-1)} className="back-button">
                            Go Back
                        </button>
                    </div>
                </div>
            ) : (
                <main className="content chapter-detail-page">
                    <section className="resNova-page">
                        <div className="breadcrumbs">
                            <Link to="/bookchapters">Books</Link>
                            <ChevronRight size={14} className="breadcrumb-separator" />
                            <Link to={`/bookchapter/${book.id}/${generateUniqueSlug(book.isbn, book.releaseDate)}`}>
                                {truncateWords(book.title, 4)}
                            </Link>

                            <ChevronRight size={14} className="breadcrumb-separator" />
                            <span className="current-page">{chapter.title}</span>
                        </div>

                        <div className="chapter-layout">
                            {/* Main Content Area */}
                            <div className="chapter-main">
                                {/* Abstract Section */}
                                <div className="chapter-abstract-box">
                                    <div className="chapter-info-header">
                                        <div className="book-cover-thumbnail">
                                            <img
                                                src={book.coverImage}
                                                alt={book.title}
                                                onError={(e) => {
                                                    e.currentTarget.src = '/assets/books/placeholder.png';
                                                }}
                                            />
                                        </div>
                                        <div className="chapter-info-text">
                                            <h1 className="main-chapter-title">{chapter.title}</h1>
                                            <p className="main-chapter-authors">{renderAuthors(chapter.authors, chapter.authorDetails)}</p>

                                            <div className="meta-details-grid">
                                                <div className="meta-info-item clickable"><strong>Source Title:</strong> <span onClick={() => navigate(-1)}>{book.title}</span></div>
                                                <div className="meta-info-item"><strong>Copyright:</strong> <span>{book.copyright || 'N/A'}</span></div>
                                                {chapter.doi && (
                                                    <div className="meta-info-item">
                                                        <strong>DOI:</strong>
                                                        <a href={sanitizeUrl(chapter.doi)} target="_blank" rel="noopener noreferrer" className="doi-link">{chapter.doi}</a>
                                                    </div>
                                                )}
                                                <div className="meta-info-item"><strong>Pages:</strong> <span>{chapter.pages || 'N/A'}</span></div>
                                                <div className="meta-info-item"><strong>Views:</strong> <span>{chapter.views || 0}</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="abstract-content">
                                        <h3>Abstract</h3>
                                        <p>{chapter.abstract}</p>
                                    </div>
                                </div>

                                {/* Complete Chapter List */}
                                <div className="complete-chapter-list">
                                    <h3>Complete Chapter List</h3>
                                    <div className="toc-search-bar">
                                        <input
                                            type="text"
                                            placeholder="Search this book's list of contents..."
                                            value={chapterSearchQuery}
                                            onChange={(e) => setChapterSearchQuery(e.target.value)}
                                        />
                                        <button>Search</button>
                                    </div>

                                    <div className="toc-list">
                                        {!chapterSearchQuery && (
                                            <>
                                                {(book.frontmatterPdfs?.['Dedication']?.pdfKey || (book.frontmatterPdfs?.['Dedication'] as any)?.publishedFileId) && (
                                                    <div className="toc-frontmatter-row">
                                                        <span className="row-title">Dedication</span>
                                                        <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Dedication'), '_blank')}>
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
                                            </>
                                        )}

                                        {(() => {
                                            const filteredChapters = book.chapters?.filter(chap => {
                                                if (!chapterSearchQuery) return true;
                                                const query = chapterSearchQuery.toLowerCase();
                                                const titleMatch = chap.title?.toLowerCase().includes(query) || false;
                                                const authorMatch = chap.authors?.toLowerCase().includes(query) || false;
                                                return titleMatch || authorMatch;
                                            });

                                            return filteredChapters && filteredChapters.length > 0 ? (
                                                <>
                                                    {[...filteredChapters].sort((a, b) =>
                                                        a.chapterNumber.toString().localeCompare(b.chapterNumber.toString(), undefined, { numeric: true })
                                                    ).map((ch) => (
                                                        <div key={ch.id} className={`toc-chapter-card ${String(ch.id) === String(chapter.id) ? 'active-chapter' : ''}`}>
                                                            <div className="chapter-card-left">
                                                                <span className="chapter-badge">{ch.chapterNumber}</span>
                                                                <h4 className="chapter-title">
                                                                    <span className="chapter-link-span" onClick={() => handleViewChapter(ch)}>{ch.title}</span>
                                                                    {ch.pages && <span className="chapter-pages"> (pages {ch.pages})</span>}
                                                                </h4>
                                                                <p className="chapter-authors">{renderAuthors(ch.authors)}</p>
                                                                <p className="chapter-abstract">{ch.abstract}</p>
                                                            </div>
                                                            <div className="chapters-actions-area">
                                                                <div className="ch-price-box">
                                                                    <span>Download This Chapter</span>
                                                                </div>
                                                                {ch.pdfUrl && (
                                                                    <button
                                                                        className="btn-view-pdf-alt"
                                                                        onClick={() => handleViewPdf(ch)}
                                                                    >
                                                                        <PictureAsPdfIcon fontSize="small" /> View PDF
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="btn-preview"
                                                                    onClick={() => handleViewChapter(ch)}
                                                                >
                                                                    Preview Chapter
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="toc-fallback">
                                                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                        No chapters found matching "{chapterSearchQuery}".
                                                    </p>
                                                </div>
                                            );
                                        })()}

                                        {!chapterSearchQuery && (
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
                            </div>
                        </div>
                    </section>
                </main>
            )}
        </>
    );
};

export default ChapterDetail;
