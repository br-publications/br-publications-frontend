import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/api.config';
import {
    ArrowLeft,
    CheckCircle2,
    Linkedin,
    Mail,
    Globe,
    Award,
    BookOpen,
    User,
    Lightbulb,
    ChevronUp,
} from 'lucide-react';
import './authorDetail.css';

interface Author {
    id: number;
    name: string;
    email: string | null;
    affiliation?: string;
    biography?: string;
    image?: string | null;
    chapters: Array<{
        id: number;
        title: string;
        chapterNumber: string | null;
        authors: string | null;
        pagesFrom: string | null;
        abstract: string | null;
        book: {
            id: number;
            title: string;
            isbn: string;
        };
    }>;
}

const AuthorDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [author, setAuthor] = useState<Author | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    /* ── Fetch ── */
    useEffect(() => {
        const fetchAuthorDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `${API_BASE_URL}/api/book-chapter-publishing/authors/${id}`
                );
                if (!response.ok) throw new Error('Failed to fetch author details');
                const data = await response.json();
                setAuthor(data.data);
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching author details');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchAuthorDetails();
    }, [id]);

    /* ── Scroll-to-top visibility ── */
    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.pageYOffset > 400);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="author-detail-page loading">
                <div className="spinner" />
                <p>Loading author profile…</p>
            </div>
        );
    }

    /* ── Error state ── */
    if (error || !author) {
        return (
            <div className="author-detail-page error">
                <h2>Error</h2>
                <p>{error || 'Author not found'}</p>
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={14} /> Go Back
                </button>
            </div>
        );
    }

    /* ── Helpers ── */
    const hasImage = Boolean(author.image);

    const imageSrc = hasImage
        ? author.image!.startsWith('http')
            ? author.image!
            : `${API_BASE_URL}${author.image}`
        : null;

    const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        author.name
    )}&background=1e5292&color=fff&size=180`;

    // Derive expertise tags from biography sentences (short, keyword-like)
    const expertiseTags: string[] = author.biography
        ? Array.from(
            new Set(
                author.biography
                    .split(/[.,;]/)
                    .map((s) => s.replace(/[^a-zA-Z ]/g, '').trim())
                    .filter((s) => s.length >= 5 && s.length <= 40)
                    .slice(0, 8)
            )
        )
        : ['Research', 'Academic Writing', 'Publication'];

    /* ── Render ── */
    return (
        <div className="author-detail-page">

            {/* ── Hero Bar ── */}
            <section className="product-hero">
                <div className="hero-content">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={13} /> Back
                    </button>
                    <h1>Author Profile</h1>
                </div>
            </section>

            <div className="product-wrapper-details">

                {/* ══════════════════════════════════
                    AUTHOR PROFILE CARD
                ═══════════════════════════════════ */}
                <div className="author-profile-section">
                    <div className={`profile-grid${!hasImage ? ' no-image' : ''}`}>

                        {/* ── Profile image (only when available) ── */}
                        {hasImage && (
                            <div className="author-image-wrap">
                                <img
                                    src={imageSrc!}
                                    alt={author.name}
                                    className="author-image"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = fallbackSrc;
                                    }}
                                />
                                <div className="verified-badge" title="Verified Author">
                                    <CheckCircle2 size={13} />
                                </div>
                            </div>
                        )}

                        {/* ── Author text details ── */}
                        <div className="author-details-main">

                            {/* Name */}
                            <h1 className="author-name">
                                {author.name}
                                {/* Show badge inline when there's no image */}
                                {!hasImage && (
                                    <span className="name-verified" title="Verified Author">
                                        <CheckCircle2 size={11} />
                                    </span>
                                )}
                            </h1>

                            {/* Designation / Affiliation */}
                            <p className="author-designation">
                                {author.affiliation || 'Academic Researcher'}
                            </p>

                            {/* Stats table */}
                            <div className="author-stats-table">
                                <div className="stat-row">
                                    <strong>Publications:</strong>
                                    <span>{author.chapters?.length ?? 0}</span>
                                </div>
                                <div className="stat-row">
                                    <strong>Status:</strong>
                                    <span>Verified Author</span>
                                </div>
                                {author.email && (
                                    <div className="stat-row">
                                        <strong>Email:</strong>
                                        <span>{author.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Social links
                            <div className="social-row">
                                <span className="social-label">Find on:</span>
                                <a href="#" className="social-link" title="LinkedIn">
                                    <Linkedin size={11} /> LinkedIn
                                </a>
                                {author.email && (
                                    <a
                                        href={`mailto:${author.email}`}
                                        className="social-link"
                                        title="Email"
                                    >
                                        <Mail size={11} /> Email
                                    </a>
                                )}
                                <a href="#" className="social-link" title="Google Scholar">
                                    <Globe size={11} /> Google Scholar
                                </a>
                                <a href="#" className="social-link" title="ORCID">
                                    <Award size={11} /> ORCID
                                </a>
                            </div>
                            */}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════
                    BIOGRAPHY SECTION
                ═══════════════════════════════════ */}
                <div className="section-block">
                    <div className="section-heading">
                        <User size={14} />
                        Biography
                    </div>
                    <div className="section-body">
                        {author.biography ? (
                            author.biography
                                .split('\n')
                                .filter((p) => p.trim().length > 0)
                                .map((para, i) => (
                                    <p key={i} className="biography-text">{para.trim()}</p>
                                ))
                        ) : (
                            <p className="biography-text">
                                No biography available for this author.
                            </p>
                        )}

                        {/* Areas of Expertise 
                        <div className="expertise-subheading">
                            <Lightbulb size={13} />
                            Areas of Expertise
                        </div>
                        <div className="expertise-tags">
                            {expertiseTags.map((tag, i) => (
                                <span key={i} className="tag">{tag}</span>
                            ))}
                        </div>
                        */}
                    </div>
                </div>

                {/* ══════════════════════════════════
                    CHAPTERS & PUBLICATIONS SECTION
                ═══════════════════════════════════ */}
                <div className="section-block">
                    <div className="section-heading">
                        <BookOpen size={14} />
                        Chapters &amp; Publications
                    </div>

                    {author.chapters && author.chapters.length > 0 ? (
                        <div className="chapter-list">
                            {author.chapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className="chapter-card"
                                    onClick={() => navigate(`/bookchapter/${chapter.book.id}`)}
                                >
                                    {/* Book cover thumbnail */}
                                    <div className="chapter-cover">
                                        <img
                                            src={`${API_BASE_URL}/api/book-chapter-publishing/${chapter.book.id}/cover/thumbnail`}
                                            alt={chapter.book.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/64x88/1e5292/ffffff?text=BR';
                                            }}
                                        />
                                    </div>

                                    {/* Chapter text */}
                                    <div className="chapter-body">
                                        <h3 className="chapter-card-title">{chapter.title}</h3>
                                        <p className="chapter-card-meta">
                                            {chapter.authors
                                                ? `${chapter.authors}. `
                                                : ''}
                                            In: <strong>{chapter.book.title}</strong>
                                            {chapter.book.isbn
                                                ? ` — ISBN: ${chapter.book.isbn}`
                                                : ''}
                                            {chapter.pagesFrom
                                                ? `. Pages: ${chapter.pagesFrom}`
                                                : ''}
                                        </p>
                                        <p className="chapter-card-abstract">
                                            {chapter.abstract ||
                                                'This publication explores critical themes in research and development within its respective field, contributing new insights to the academic community.'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-publications">
                            No publications found for this author.
                        </p>
                    )}
                </div>

            </div>{/* /.product-wrapper */}

            {/* ── Scroll to top ── */}
            <button
                className={`scroll-top-btn${showScrollTop ? ' visible' : ''}`}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Scroll to top"
            >
                <ChevronUp size={20} />
            </button>

        </div>
    );
};

export default AuthorDetail;