import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as conferenceService from '../../services/conference.service';
import type { Conference, ConferenceArticle, Pagination } from '../../services/conference.service';
import './conference.css';

const ITEMS_PER_PAGE = 10;

const ConferenceDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const confId = Number(id);

    const [conf, setConf] = useState<Conference | null>(null);
    const [articles, setArticles] = useState<ConferenceArticle[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await conferenceService.getArticlesByConference(confId, {
                    page,
                    limit: ITEMS_PER_PAGE,
                    search: debouncedSearch || undefined,
                });
                if (!cancelled) {
                    setConf(data.conference);
                    setArticles(data.articles);
                    setPagination(data.pagination);
                }
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load data');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [confId, page, debouncedSearch]);

    const totalPages = pagination?.totalPages ?? 1;
    const total = pagination?.total ?? 0;

    return (
        <div className="conf-root">
            {/* Page header */}
            <div className="conf-page-header">
                <div className="conf-page-header-inner">
                    <button className="conf-back-btn" onClick={() => navigate('/conference')}>&#8592; Back</button>
                    <h1>&#9656; Conference Proceedings</h1>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="conf-breadcrumb">
                <div className="conf-breadcrumb-inner">
                    <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>Home</a>
                    <span className="bc-sep">/</span>
                    <a href="/conference" onClick={e => { e.preventDefault(); navigate('/conference'); }}>Conferences</a>
                    <span className="bc-sep">/</span>
                    <span>{conf?.code ?? (conf?.title?.substring(0, 40) ?? '…')}</span>
                </div>
            </div>

            <div className="conf-detail-page">
                {/* Conference info banner */}
                {conf && (
                    <div className="conf-info-banner">
                        <div className="conf-info-title">{conf.title}</div>
                        <div className="conf-info-row">
                            <span className="ci-item"><strong>Publisher:</strong> {conf.publisher}</span>
                            {(conf.dateRange || conf.publishedDate) && (
                                <span className="ci-item"><strong>Date:</strong> {conf.dateRange || conf.publishedDate}</span>
                            )}
                            {conf.location && <span className="ci-item"><strong>Location:</strong> {conf.location}</span>}
                            {conf.doi && <span className="ci-item"><strong>DOI:</strong> {conf.doi}</span>}
                            {conf.issn && <span className="ci-item"><strong>ISSN:</strong> {conf.issn}</span>}
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="conf-detail-toolbar">
                    <span className="conf-result-count">
                        {loading ? 'Loading…' : `Showing ${articles.length} of ${total} articles`}
                    </span>
                    <div className="conf-search-bar">
                        <input
                            type="text"
                            placeholder="Search within results..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button>Search</button>
                    </div>
                </div>

                {/* Error */}
                {error && <div className="conf-empty" style={{ color: '#c00' }}>⚠ {error}</div>}

                {/* Loading skeleton */}
                {loading && !error && (
                    <div className="article-card-list">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div className="article-card" key={i} style={{ opacity: 0.5 }}>
                                <span className="article-card-num">·</span>
                                <div className="article-card-body">
                                    <div style={{ height: 14, background: '#e0e7f0', borderRadius: 2, marginBottom: 7, width: '75%' }} />
                                    <div style={{ height: 11, background: '#e8f4f0', borderRadius: 2, width: '40%', marginBottom: 5 }} />
                                    <div style={{ height: 10, background: '#eee', borderRadius: 2, width: '60%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Article list */}
                {!loading && !error && (
                    <div className="article-card-list">
                        {articles.map((article, idx) => (
                            <div className="article-card" key={article.id}>
                                <span className="article-card-num">{(page - 1) * ITEMS_PER_PAGE + idx + 1}.</span>
                                <div className="article-card-body">
                                    <button
                                        className="article-card-title"
                                        onClick={() => navigate(`/conference/${confId}/article/${article.id}`)}
                                    >
                                        {article.title}
                                    </button>
                                    <div className="article-card-authors">
                                        {article.authors.join('; ')}
                                    </div>
                                    <div className="article-card-meta">
                                        {article.year && <span>Year: {article.year}</span>}
                                        {article.pages && <span>Page(s): {article.pages}</span>}
                                        {article.doi && <span>DOI: {article.doi}</span>}
                                    </div>
                                    {article.abstract && (
                                        <div className="article-card-abstract">{article.abstract}</div>
                                    )}
                                </div>
                                <div className="article-card-actions">
                                    <button className="btn-pdf" onClick={() => navigate(`/conference/${confId}/article/${article.id}`)}>
                                        &#128196; PDF
                                    </button>
                                    <button className="btn-preview-sm" onClick={() => navigate(`/conference/${confId}/article/${article.id}`)}>
                                        Preview
                                    </button>
                                </div>
                            </div>
                        ))}
                        {articles.length === 0 && (
                            <div className="conf-empty">No articles found matching your search.</div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="conf-pagination">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&#8249;</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>&#8250;</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConferenceDetails;
