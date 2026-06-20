'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../services/api.config';
import {
    ArrowLeft,
    CheckCircle2,
    BookOpen,
    User,
    ChevronUp,
} from 'lucide-react';
import { getEditorById, type PublishedEditor } from '../../../services/bookChapterPublishing.service';
import { toBookNameSlug } from '../../../utils/stringUtils';
import './editorDetail.css';

const EditorDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [editor, setEditor] = useState<PublishedEditor | null>(null);
    const [loading, setLoading] = useState<boolean>(!!id);
    const [error, setError] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    /* ── Fetch ── */
    useEffect(() => {
        if (!id) return;

        // SEO Redirect for zero-padded IDs
        if (/^0+\d+$/.test(id)) {
            const cleanId = parseInt(id, 10).toString();
            const newPath = window.location.pathname.replace(`/editor/${id}`, `/editor/${cleanId}`);
            router.push(newPath, { replace: true });
            return;
        }

        const fetchEditorDetails = async () => {
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

    /**
     * Dispatch prerender-ready event so Puppeteer snapshots the page
     * only after data is loaded and page-specific metadata is set.
     */
    useEffect(() => {
        if (!loading) {
            setTimeout(() => document.dispatchEvent(new Event('prerender-ready')), 300);
        }
    }, [loading]);


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
                <button onClick={() => router.back()} className="back-btn">
                    <ArrowLeft size={14} /> Go Back
                </button>
            </div>
        );
    }

    /* ── Helpers ── 
    const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        editor.name
    )}&background=1e5292&color=fff&size=180`;

    /* ── SEO Logic ── */
    const canonicalId = String(editor.id);
    const nameSlug = editor.name ? toBookNameSlug(editor.name) : '';
    const canonicalPath = `/editor/${canonicalId}/${nameSlug}`;
    const description = editor.biography
        ? editor.biography.replace(/\n/g, ' ').slice(0, 155)
        : `${editor.name} is a verified academic editor at BR Publications${editor.affiliation ? `, affiliated with ${editor.affiliation}` : ''}.`;
    const bookTitles = editor.books?.map(b => b.title).join(', ') || '';
    const canonicalUrlFull = `https://www.brpublications.com${canonicalPath}`;

    const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': editor.name,
        'url': canonicalUrlFull,
        ...(editor.affiliation ? { 'affiliation': { '@type': 'Organization', 'name': editor.affiliation } } : {}),
        ...(editor.biography ? { 'description': editor.biography.slice(0, 500) } : {}),
        ...(editor.email ? { 'email': editor.email } : {}),
        'worksFor': { '@type': 'Organization', 'name': 'BR Publications', 'url': 'https://www.brpublications.com' },
        'hasOccupation': { '@type': 'Occupation', 'name': 'Academic Editor' },
        ...(editor.books && editor.books.length > 0 ? {
            'editor': editor.books.map(b => ({
                '@type': 'Book',
                'name': b.title,
                ...(b.isbn ? { 'isbn': b.isbn } : {}),
                'publisher': { '@type': 'Organization', 'name': 'BR Publications' }
            }))
        } : {})
    };

    /* ── Render ── */
    return (
        <div className="editor-detail-page">
            {schemaData && (
                <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
            )}

            {/* ── Hero Bar ── */}
            <section className="product-hero">
                <div className="hero-content">
                    <button className="back-btn" onClick={() => router.back()}>
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
                                    onClick={() => {
                                        const identifier = book.uid ? book.uid.toLowerCase() : book.id;
                                        const slug = book.title ? toBookNameSlug(book.title) : '';
                                        router.push(`/bookchapter/${identifier}/${slug}`);
                                    }}
                                >
                                    <div className="chapter-cover">
                                        <img
                                            src={`${API_BASE_URL}/api/book-chapter-publishing/${book.id}/cover/thumbnail?width=64&height=88`}
                                            alt={book.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/assets/books/placeholder.png';
                                            }}
                                        />
                                    </div>
                                    <div className="chapter-body">
                                        <h4 className="chapter-card-title">{book.title}</h4>
                                        <div className="chapter-card-metadata">
                                            {book.isbn && (
                                                <div className="metadata-item">
                                                    <strong>ISBN:</strong> {book.isbn}
                                                </div>
                                            )}
                                            {(book as any).publishedDate && (
                                                <div className="metadata-item">
                                                    <strong>Published:</strong> {(book as any).publishedDate}
                                                </div>
                                            )}
                                        </div>
                                        <p className="chapter-card-authors">
                                            {book.author ? `Author: ${book.author}` : 'Associated Publication'}
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