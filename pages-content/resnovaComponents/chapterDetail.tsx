'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Quote } from 'lucide-react';
import { bookChapterService } from '../../services/bookChapterService';
import { getExtraPdfUrl, incrementChapterViews } from '../../services/bookChapterPublishing.service';
import type { Book, Chapter, PublishedAuthor } from '../../types/bookTypes';
import { toBookNameSlug } from '../../utils/stringUtils';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { sanitizeUrl } from '../../utils/urlValidation';
import CitationModal from '../../components/common/CitationModal';
import './chapterDetail.css';
import Link from 'next/link';

const formatChapterNumberSlug = (chapterNum: string | number): string => {
    const clean = String(chapterNum).toLowerCase().trim().replace(/^chapter[-_ \s]*/, '');
    return `chapter-${clean}`;
};

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

    const params = useParams<{ id: string; slug?: string[] }>();
    const id = params.id;
    const chapterId = params.slug?.[0];
    const param1 = params.slug?.[1];
    const router = useRouter();
    const [book, setBook] = useState<Book | null>(null);
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCitationOpen, setIsCitationOpen] = useState<boolean>(false);

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
                {/* allow affiliation to wrap, but keep name together */}
                <span className="author-wrapper" style={{ display: 'inline' }}>
                    <Link href={`/author/${String(auth.id)}/${toBookNameSlug(auth.name)}`} className="author-link" style={{ whiteSpace: 'nowrap' }}>{auth.name}</Link>
                    {auth.affiliation && (
                        <span className="author-affiliation">
                            {' '}({auth.affiliation.trim().replace(/^\((.*)\)$/, '$1').trim()})
                        </span>
                    )}
                </span>
            </React.Fragment>
        ));
    };

    useEffect(() => {
        const fetchBookAndChapter = async () => {
            let isRedirecting = false;
            try {
                setLoading(true);
                const resolvedChapterParam = chapterId || param1;
                
                // SEO Redirect for zero-padded IDs
                let needsRedirect = false;
                let newPath = window.location.pathname;
                
                if (id && /^0+\d+$/.test(id)) {
                    const cleanId = parseInt(id, 10).toString();
                    newPath = newPath.replace(`/book/${id}`, `/book/${cleanId}`);
                    needsRedirect = true;
                }
                
                if (resolvedChapterParam) {
                    const match = resolvedChapterParam.match(/^(chapter[-_ \s]*)0+(\d+)$/i);
                    if (match) {
                        const cleanChapter = `${match[1]}${match[2]}`;
                        newPath = newPath.replace(`/${resolvedChapterParam}`, `/${cleanChapter}`);
                        needsRedirect = true;
                    } else if (/^0+\d+$/.test(resolvedChapterParam)) {
                        const cleanChapter = parseInt(resolvedChapterParam, 10).toString();
                        newPath = newPath.replace(`/${resolvedChapterParam}`, `/${cleanChapter}`);
                        needsRedirect = true;
                    }
                }
                
                if (needsRedirect) {
                    isRedirecting = true;
                    router.push(newPath);
                    return;
                }

                if (!id || !resolvedChapterParam) {
                    setError('Invalid routing parameters.');
                    return;
                }

                let numericId: number | null = null;
                const isNumeric = /^\d+$/.test(id);

                if (isNumeric) {
                    numericId = parseInt(id);
                } else {
                    // Fallback: Resolve UID to numeric ID by matching from the books list
                    try {
                        const allBooks = await bookChapterService.getAllBooks();
                        const matchedBook = allBooks.find(b => b.uid && b.uid.toLowerCase() === id.toLowerCase());
                        if (matchedBook) {
                            numericId = matchedBook.id;
                        }
                    } catch (resolveErr) {
                        console.error('Error resolving book UID:', resolveErr);
                    }
                }

                if (!numericId) {
                    setError('Book not found.');
                    return;
                }

                const fetchedBook = await bookChapterService.getBookById(numericId);
                setBook(fetchedBook);

                if (fetchedBook && fetchedBook.chapters) {
                    const rawParam = resolvedChapterParam.toLowerCase().trim();
                    const cleanParam = rawParam.replace(/^chapter[-_ \s]*/, '');
                    const parsedParamInt = parseInt(cleanParam, 10);

                    const foundChapter = fetchedBook.chapters.find(c => {
                        const rawChapNum = String(c.chapterNumber).toLowerCase().trim();
                        const cleanChapNum = rawChapNum.replace(/^chapter[-_ \s]*/, '').replace(/\s+/g, '');
                        const parsedChapInt = parseInt(cleanChapNum, 10);

                        return (
                            rawChapNum === rawParam ||
                            cleanChapNum === cleanParam ||
                            (!isNaN(parsedParamInt) && !isNaN(parsedChapInt) && parsedParamInt === parsedChapInt)
                        );
                    });

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
                if (!isRedirecting) {
                    setLoading(false);
                }
            }
        };

        fetchBookAndChapter();
    }, [id, chapterId, param1]);

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
        const bookIdentifier = book?.uid ? book.uid.toLowerCase() : book?.id;
        const chapterSlugSegment = formatChapterNumberSlug(chap.chapterNumber);
        const chapterTitleSlug = chap.title ? toBookNameSlug(chap.title) : '';
        router.push(`/book/${bookIdentifier}/${chapterSlugSegment}/${chapterTitleSlug}`);
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

    const displayTitle = (chapter && book) ? `${chapter.title} by ${authorNames} | ${book.title} — BR Publications` : (id && (chapterId || param1) ? `Chapter ${chapterId || param1} Details | BR Publications` : 'Chapter Details');
    const metaDescription = chapter?.abstract
        ? chapter.abstract.slice(0, 155)
        : (chapter && book) ? `${chapter.title} — a chapter from "${book.title}" published by BR Publications.` : 'Detailed information about academic research chapters from BR Publications.';

    const bookIdentifier = book?.uid ? book.uid.toLowerCase() : (book?.id ?? id!);
    const chapterSlugSegment = chapter ? formatChapterNumberSlug(chapter.chapterNumber) : (chapterId || param1 ? formatChapterNumberSlug(chapterId || param1 || '') : '');
    const chapterTitleSlug = chapter?.title ? toBookNameSlug(chapter.title) : '';
    const canonicalUrlFull = chapterTitleSlug
        ? `https://www.brpublications.com/book/${bookIdentifier}/${chapterSlugSegment}/${chapterTitleSlug}`
        : `https://www.brpublications.com/book/${bookIdentifier}/${chapterSlugSegment}`;

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
                'url': `https://www.brpublications.com/author/${String(a.id)}/${toBookNameSlug(a.name)}`,
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
            'url': `https://www.brpublications.com/bookchapter/${book.uid ? book.uid.toLowerCase() : book.id}/${book.title ? toBookNameSlug(book.title) : ''}`
        },
        'url': canonicalUrlFull,
        'inLanguage': 'en',
        ...(chapter.doi ? { 'identifier': { '@type': 'PropertyValue', 'propertyID': 'DOI', 'value': chapter.doi } } : {}),
        ...(chapter.pages ? { 'pagination': chapter.pages } : {}),
    } : null;

    return (
        <>
            {chapter && book && schemaData && (
                <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
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
                        <button onClick={() => router.back()} className="back-button">
                            Go Back
                        </button>
                    </div>
                </div>
            ) : (
                <main className="content chapter-detail-page">
                    <section className="resNova-page">
                        <div className="breadcrumbs">
                            <Link href="/bookchapters">Books</Link>
                            <ChevronRight size={14} className="breadcrumb-separator" />
                            <Link href={`/bookchapter/${book.uid ? book.uid.toLowerCase() : book.id}/${book.title ? toBookNameSlug(book.title) : ''}`}>
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

                                            <button
                                                onClick={() => setIsCitationOpen(true)}
                                                className="cite-trigger-btn"
                                                title="Generate citation for this chapter"
                                                style={{ marginTop: '6px', marginBottom: '14px' }}
                                            >
                                                <Quote size={14} /> Cite this Chapter
                                            </button>

                                            <div className="meta-details-grid">
                                                <div className="meta-info-item clickable"><strong>Source Title:</strong> <span onClick={() => router.back()}>{book.title}</span></div>
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

            {book && chapter && (
                <CitationModal
                    isOpen={isCitationOpen}
                    onClose={() => setIsCitationOpen(false)}
                    item={{
                        type: 'chapter',
                        title: chapter.title,
                        authors: chapter.authors || [],
                        containerTitle: book.title,
                        year: book.releaseDate ? book.releaseDate.split('-')[0] : book.publishedDate ? book.publishedDate.split('-')[0] : book.copyright ? book.copyright.replace(/[^\d]/g, '') : '',
                        publisher: 'BR ResNova Academic Press',
                        isbn: book.isbn,
                        doi: chapter.doi || book.doi || undefined,
                        pages: chapter.pages || undefined
                    }}
                />
            )}
        </>
    );
};

export default ChapterDetail;
