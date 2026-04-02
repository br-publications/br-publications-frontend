import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { bookChapterService } from '../../services/bookChapterService';
import { getExtraPdfUrl, incrementChapterViews } from '../../services/bookChapterPublishing.service';
import type { Book, Chapter, PublishedAuthor } from '../../types/bookTypes';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import './chapterDetail.css';

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
                <Link to={`/author/${auth.id}`} className="author-link">{auth.name}</Link>
                {auth.affiliation && (
                    <span className="author-affiliation"> 
                        {auth.affiliation.trim().startsWith('(') ? auth.affiliation : `(${auth.affiliation})`}
                    </span>
                )}
                {idx < details.length - 1 ? ', ' : ''}
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
                    const foundChapter = fetchedBook.chapters.find(c => String(c.id) === String(chapterId));
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

    const handleViewChapter = async (chap: Chapter) => {
        if (typeof chap.id === 'number') {
            try {
                await incrementChapterViews(chap.id);
                // Update local state for immediate feedback
                setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
            } catch (err) {
                console.error('Failed to increment views:', err);
            }
        } else {
            // Still update state locally to show the click was registered
            setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
        }
        navigate(`/book/${book?.id}/chapter/${chap.id}`);
    };

    const handleViewPdf = async (chap: Chapter) => {
        if (typeof chap.id === 'number') {
            try {
                await incrementChapterViews(chap.id);
                // Update local state for immediate feedback
                setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
            } catch (err) {
                console.error('Failed to increment views:', err);
            }
        } else {
            // Still update state locally to show the click was registered
            setChapter(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
        }

        if (chap.pdfUrl) {
            window.open(chap.pdfUrl, '_blank');
        } else {
            alert('PDF not available for this chapter.');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading chapter details...</p>
            </div>
        );
    }

    if (error || !book || !chapter) {
        return (
            <div className="error-container">
                <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <h3>Oops! Something went wrong</h3>
                    <p>{error || 'Chapter details could not be found.'}</p>
                    <button onClick={() => navigate(-1)} className="back-button">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="content chapter-detail-page">
            <section className="resNova-page">
                <div className="back-btn-wrapper">
                    <button className="chapter-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={13} /> Back
                    </button>
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
                                        <div className="meta-info-item"><strong>Source Title:</strong> <span>{book.title}</span></div>
                                        <div className="meta-info-item"><strong>Copyright:</strong> <span>{book.copyright || 'N/A'}</span></div>
                                        <div className="meta-info-item"><strong>Pages:</strong> <span>{chapter.pages || 'N/A'}</span></div>
                                        <div className="meta-info-item"><strong>Views:</strong> <span>{chapter.views || 0}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="abstract-content">
                                <h3>Abstract</h3>
                                <p>{chapter.abstract}</p>
                                <p className="extended-abstract">
                                    {/* Dummy text to simulate a full abstract as per screenshot 
                                    This chapter provides an exhaustive review of the historical context, current challenges, and future directions within this field of study. The discourse is oriented around the need to continue to address the key issues. The chapter which is framed by the literature reviews traces the need to accommodate all the best practices. As standard procedures are very vital to the enhancement of the overall pedagogy, the quest for qualitative output ensures that this framework dictates higher standards. It reveals the core challenges faced across different scales and defines robust criteria for establishing sustainable guidelines for global educators.*/}
                                </p>
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
                                {/* Frontmatter Rows - Hidden when searching */}
                                {!chapterSearchQuery && (
                                    <>
                                        <div className="toc-frontmatter-row">
                                            <span className="row-title">Dedication</span>
                                            <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Dedication'), '_blank')}>
                                                <PictureAsPdfIcon fontSize="small" /> View PDF
                                            </button>
                                        </div>
                                        <div className="toc-frontmatter-row">
                                            <span className="row-title">Table of Contents</span>
                                            <button className="btn-view-pdf" onClick={() => window.open(getExtraPdfUrl(book.id, 'Table of Contents'), '_blank')}>
                                                <PictureAsPdfIcon fontSize="small" /> View PDF
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Iterating Chapters */}
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
                                                        <p className="chapter-authors">{renderAuthors(ch.authors, ch.authorDetails)}</p>
                                                        <p className="chapter-abstract">{ch.abstract}</p>
                                                    </div>
                                                    <div className="chapters-actions-area">
                                                        <div className="ch-price-box">
                                                            <span>Download This Chapter</span>
                                                        </div>
                                                        <button
                                                            className="btn-view-pdf-alt"
                                                            onClick={() => handleViewPdf(ch)}
                                                        >
                                                            <PictureAsPdfIcon fontSize="small" /> View PDF
                                                        </button>
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

                                {/* Backmatter Rows - Hidden when searching */}
                                {!chapterSearchQuery && (
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

                    </div>

                    {/* Right Sidebar Area 
                    <div className="chapter-sidebar">
                        <div className="buy-card">
                            <h4>Buy Instant Access to This Chapter</h4>
                            <div className="sidebar-price-row">
                                <label><input type="radio" checked readOnly /> OnDemand</label>
                                <strong>${chapter.price ? Number(chapter.price).toFixed(2) : '0.00'}</strong>
                            </div>
                            <button className="btn-add-cart-sidebar">
                                <ShoppingCartIcon fontSize="small" /> Add to Cart
                            </button>
                        </div>

                        <div className="sidebar-accordions">
                            <div className="acc-item">
                                <span>+ Share</span>
                            </div>
                            <div className="acc-item">
                                <span>+ Free Access</span>
                            </div>
                            <div className="acc-item">
                                <span>+ More Information</span>
                            </div>
                        </div>

                        <div className="sidebar-librarians">
                            <h4>For Librarians</h4>
                            <ul>
                                <li><a href="#">Recommend to Reference Librarian</a></li>
                                <li><a href="#">View in SCOPUS</a></li>
                                <li><a href="#">Report an Issue / Bug</a></li>
                            </ul>
                        </div>
                    </div> */}

                </div>
            </section>
        </main >
    );
};

export default ChapterDetail;
