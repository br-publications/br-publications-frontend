import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as conferenceService from '../../services/conference.service';
import type { Conference, Pagination } from '../../services/conference.service';
import ConferenceUploadWizard from './ConferenceUploadWizard';
import './conference.css';

const ITEMS_PER_PAGE = 10;

const ConferencePage: React.FC = () => {
    const navigate = useNavigate();

    const isAdmin = !!localStorage.getItem('token');
    const [wizardOpen, setWizardOpen] = useState(false);

    const [conferences, setConferences] = useState<Conference[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
        const fetch = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await conferenceService.getConferences({
                    page,
                    limit: ITEMS_PER_PAGE,
                    search: debouncedSearch || undefined,
                });
                if (!cancelled) {
                    setConferences(data.conferences);
                    setPagination(data.pagination);
                }
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load conferences');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetch();
        return () => { cancelled = true; };
    }, [page, debouncedSearch, refreshKey]);

    const totalPages = pagination?.totalPages ?? 1;
    const total = pagination?.total ?? 0;
    const showing = conferences.length;

    return (
        <>
            <div className="conf-root">
                {/* Page header */}
                <div className="conf-page-header">
                    <div className="conf-page-header-inner">
                        <h1>&#9656; Conferences</h1>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="conf-breadcrumb">
                    <div className="conf-breadcrumb-inner">
                        <a href="/">Home</a>
                        <span className="bc-sep">/</span>
                        <span>Conferences</span>
                    </div>
                </div>

                <div className="conf-list-page">
                    <div className="conf-list-toolbar">
                        <span className="conf-result-count">
                            {loading ? 'Loading…' : `Showing ${showing} of ${total} conferences`}
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {isAdmin && (
                                <button
                                    className="btn-upload-conf"
                                    onClick={() => setWizardOpen(true)}
                                >
                                    + Upload Conference
                                </button>
                            )}
                            <div className="conf-search-bar">
                                <input
                                    type="text"
                                    placeholder="Search conferences..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button>Search</button>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="conf-empty" style={{ color: '#c00' }}>
                            ⚠ {error} &nbsp;
                            <button onClick={() => setPage(p => p)} style={{ fontSize: 11, cursor: 'pointer' }}>Retry</button>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && !error && (
                        <div className="conf-card-list">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div className="conf-card" key={i} style={{ opacity: 0.5 }}>
                                    <span className="conf-card-number">·</span>
                                    <div className="conf-card-body">
                                        <div style={{ height: 14, background: '#e0e7f0', borderRadius: 2, marginBottom: 8, width: '70%' }} />
                                        <div style={{ height: 11, background: '#e8edf4', borderRadius: 2, width: '50%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Conference list */}
                    {!loading && !error && (
                        <div className="conf-card-list">
                            {conferences.map((conf, idx) => (
                                <div className="conf-card" key={conf.id}>
                                    <span className="conf-card-number">{(page - 1) * ITEMS_PER_PAGE + idx + 1}.</span>
                                    <div className="conf-card-body">
                                        <button
                                            className="conf-card-title"
                                            onClick={() => navigate(`/conference/${conf.id}`)}
                                        >
                                            {conf.title}
                                        </button>
                                        <div className="conf-card-meta">
                                            <span><span className="cm-label">Publisher:</span> {conf.publisher}</span>
                                            {conf.publishedDate && <span><span className="cm-label">Date:</span> {conf.publishedDate}</span>}
                                            {conf.location && <span><span className="cm-label">Location:</span> {conf.location}</span>}
                                            {conf.doi && <span><span className="cm-label">DOI:</span> {conf.doi}</span>}
                                        </div>
                                        {conf.issn && <div className="conf-card-issn">ISSN: {conf.issn}</div>}
                                    </div>
                                    <div className="conf-card-actions">
                                        <button
                                            className="btn-view-conf"
                                            onClick={() => navigate(`/conference/${conf.id}`)}
                                        >
                                            View Proceedings
                                        </button>
                                        <span className="conf-article-count">{conf.articleCount} articles</span>
                                    </div>
                                </div>
                            ))}
                            {conferences.length === 0 && (
                                <div className="conf-empty">No conferences found matching your search.</div>
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

            {/* Admin Conference Upload Wizard */}
            <ConferenceUploadWizard
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onSuccess={() => {
                    setPage(1);
                    setRefreshKey(k => k + 1);
                }}
            />
        </>
    );
};

export default ConferencePage;
