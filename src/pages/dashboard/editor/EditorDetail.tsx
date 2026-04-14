import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/api.config';
import {
    ArrowLeft,
    CheckCircle2,
    BookOpen,
    User,
    ChevronUp,
} from 'lucide-react';
import { getEditorById, type PublishedEditor } from '../../../services/bookChapterPublishing.service';
import './editorDetail.css';

const EditorDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [editor, setEditor] = useState<PublishedEditor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    /* ── Fetch ── */
    useEffect(() => {
        const fetchEditorDetails = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getEditorById(parseInt(id));
                setEditor(data);
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching editor details');
            } finally {
                setLoading(false);
            }
        };
        fetchEditorDetails();
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
            <div className="editor-detail-page loading">
                <div className="spinner" />
                <p>Loading editor profile…</p>
            </div>
        );
    }

    /* ── Error state ── */
    if (error || !editor) {
        return (
            <div className="editor-detail-page error">
                <h2>Error</h2>
                <p>{error || 'Editor not found'}</p>
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={14} /> Go Back
                </button>
            </div>
        );
    }

    /* ── Helpers ── 
    const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        editor.name
    )}&background=1e5292&color=fff&size=180`;

    /* ── Render ── */
    return (
        <div className="editor-detail-page">

            {/* ── Hero Bar ── */}
            <section className="product-hero">
                <div className="hero-content">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={13} /> Back
                    </button>
                    <h1>Editor Profile</h1>
                </div>
            </section>

            <div className="product-wrapper-details">

                {/* ══════════════════════════════════
                    EDITOR PROFILE CARD
                ═══════════════════════════════════ */}
                <div className="editor-profile-section">
                    <div className="profile-grid no-image">

                        {/* ── Editor text details ── */}
                        <div className="editor-details-main">

                            {/* Name */}
                            <h1 className="editor-name">
                                {editor.name}
                                <span className="name-verified" title="Verified Editor">
                                    <CheckCircle2 size={11} />
                                </span>
                            </h1>

                            {/* Designation / Affiliation */}
                            <p className="editor-designation">
                                {editor.affiliation || 'Academic Editor'}
                            </p>

                            {/* Stats table */}
                            <div className="editor-stats-table">
                                <div className="stat-row">
                                    <strong>Publications:</strong>
                                    <span>{editor.books?.length ?? 0}</span>
                                </div>
                                <div className="stat-row">
                                    <strong>Status:</strong>
                                    <span>Verified Editor</span>
                                </div>
                                {editor.email && (
                                    <div className="stat-row">
                                        <strong>Email:</strong>
                                        <span>{editor.email}</span>
                                    </div>
                                )}
                            </div>
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
                        {editor.biography ? (
                            editor.biography
                                .split('\n')
                                .filter((p) => p.trim().length > 0)
                                .map((para, i) => (
                                    <p key={i} className="biography-text">{para.trim()}</p>
                                ))
                        ) : (
                            <p className="biography-text">
                                No biography available for this editor.
                            </p>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════
                    CHAPTERS & PUBLICATIONS SECTION
                ═══════════════════════════════════ */}
                <div className="section-block">
                    <div className="section-heading">
                        <BookOpen size={14} />
                        Books &amp; Publications
                    </div>

                    {editor.books && editor.books.length > 0 ? (
                        <div className="chapter-list">
                            {editor.books.map((book) => (
                                <div
                                    key={book.id}
                                    className="chapter-card"
                                    onClick={() => navigate(`/bookchapter/${book.id}`)}
                                >
                                    {/* Book cover thumbnail */}
                                    <div className="chapter-cover">
                                        <img
                                            src={`${API_BASE_URL}/api/book-chapter-publishing/${book.id}/cover/thumbnail`}
                                            alt={book.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/64x88/1e5292/ffffff?text=BR';
                                            }}
                                        />
                                    </div>

                                    {/* Book text */}
                                    <div className="chapter-body">
                                        <h3 className="chapter-card-title">{book.title}</h3>
                                        <p className="chapter-card-meta">
                                            {book.author
                                                ? `${book.author}. `
                                                : ''}
                                            {book.isbn
                                                ? ` — ISBN: ${book.isbn}`
                                                : ''}
                                            {book.publishedDate
                                                ? `. Published: ${book.publishedDate}`
                                                : ''}
                                        </p>
                                        <p className="chapter-card-abstract">
                                            {book.description ||
                                                'This publication explores critical themes in research and development within its respective field, contributing new insights to the academic community.'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-publications">
                            No publications found for this editor.
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

export default EditorDetail;
