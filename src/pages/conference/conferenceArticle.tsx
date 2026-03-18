import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as conferenceService from '../../services/conference.service';
import type { Conference, ConferenceArticle } from '../../services/conference.service';
import './conference.css';

interface Navigation {
    total: number;
    position: number;
    prevId: number | null;
    nextId: number | null;
}

const ConferenceArticlePage: React.FC = () => {
    const navigate = useNavigate();
    const { id, articleId } = useParams<{ id: string; articleId: string }>();
    const confId = Number(id);
    const artId = Number(articleId);

    const [conf, setConf] = useState<Conference | null>(null);
    const [article, setArticle] = useState<ConferenceArticle | null>(null);
    const [nav, setNav] = useState<Navigation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'abstract' | 'authors' | 'keywords'>('abstract');

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                setActiveTab('abstract');
                const data = await conferenceService.getArticleById(confId, artId);
                if (!cancelled) {
                    setConf(data.conference);
                    setArticle(data.article);
                    setNav(data.navigation);
                }
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load article');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [confId, artId]);

    const goToArticle = (artIdTarget: number) =>
        navigate(`/conference/${confId}/article/${artIdTarget}`);

    if (loading) {
        return (
            <div className="conf-root">
                <div className="conf-page-header">
                    <div className="conf-page-header-inner">
                        <button className="conf-back-btn" onClick={() => navigate(`/conference/${confId}`)}>&#8592; Back</button>
                        <h1>&#9656; Article Detail</h1>
                    </div>
                </div>
                <div className="article-detail-page">
                    <div className="article-section" style={{ opacity: 0.5 }}>
                        <div style={{ height: 16, background: '#e0e7f0', borderRadius: 2, marginBottom: 10, width: '80%' }} />
                        <div style={{ height: 12, background: '#e8edf4', borderRadius: 2, width: '50%' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !article || !conf) {
        return (
            <div className="conf-root">
                <div className="conf-page-header">
                    <div className="conf-page-header-inner">
                        <button className="conf-back-btn" onClick={() => navigate(`/conference/${confId}`)}>&#8592; Back</button>
                        <h1>&#9656; Article Detail</h1>
                    </div>
                </div>
                <div className="conf-empty" style={{ marginTop: 20, color: '#c00' }}>
                    ⚠ {error ?? 'Article not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="conf-root">
            {/* Page header */}
            <div className="conf-page-header">
                <div className="conf-page-header-inner">
                    <button className="conf-back-btn" onClick={() => navigate(`/conference/${confId}`)}>&#8592; Back</button>
                    <h1>&#9656; Article Detail</h1>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="conf-breadcrumb">
                <div className="conf-breadcrumb-inner">
                    <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>Home</a>
                    <span className="bc-sep">/</span>
                    <a href="/conference" onClick={e => { e.preventDefault(); navigate('/conference'); }}>Conferences</a>
                    <span className="bc-sep">/</span>
                    <a href={`/conference/${confId}`} onClick={e => { e.preventDefault(); navigate(`/conference/${confId}`); }}>
                        {conf.code ?? conf.title.substring(0, 30)}
                    </a>
                    <span className="bc-sep">/</span>
                    <span>{article.title.length > 45 ? article.title.substring(0, 45) + '…' : article.title}</span>
                </div>
            </div>

            <div className="article-detail-page">
                {/* Prev / Next nav bar */}
                <div className="article-nav-bar">
                    {nav?.prevId ? (
                        <a href="#prev" onClick={e => { e.preventDefault(); goToArticle(nav.prevId!); }}>&#8249; Previous</a>
                    ) : <span style={{ color: '#ccc', fontSize: 11 }}>&#8249; Previous</span>}

                    <span style={{ color: '#ccc' }}>|</span>
                    {nav && (
                        <span style={{ color: '#888', fontSize: 10 }}>Article {nav.position} of {nav.total}</span>
                    )}
                    <div className="article-nav-spacer" />

                    {nav?.nextId ? (
                        <a href="#next" onClick={e => { e.preventDefault(); goToArticle(nav.nextId!); }}>Next &#8250;</a>
                    ) : <span style={{ color: '#ccc', fontSize: 11 }}>Next &#8250;</span>}
                </div>

                {/* Article header */}
                <div className="article-detail-header">
                    <div className="article-publisher-badge">Publisher: {conf.publisher}</div>
                    <div className="article-detail-title">{article.title}</div>
                    <div className="article-detail-authors">
                        {article.authors.map((a, i) => (
                            <span key={i}>
                                <a href="#">{a}</a>
                                {i < article.authors.length - 1 && '; '}
                            </span>
                        ))}
                        {article.authors.length > 3 && (
                            <a href="#" className="article-all-authors-link">All Authors</a>
                        )}
                    </div>
                    <div className="article-action-bar">
                        <button className="btn-cite">&#128196; Cite This</button>
                        <button className="btn-full-pdf">&#128196; PDF</button>
                    </div>
                </div>

                {/* Section tabs */}
                <div className="article-section no-pad">
                    <div className="section-nav">
                        {(['abstract', 'authors', 'keywords'] as const).map(tab => (
                            <button
                                key={tab}
                                className={`section-nav-btn${activeTab === tab ? ' active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Abstract */}
                {activeTab === 'abstract' && (
                    <div className="article-section">
                        <div className="article-section-title">Abstract</div>
                        <p className="article-abstract-text">{article.abstract ?? 'No abstract available.'}</p>
                    </div>
                )}

                {/* Authors */}
                {activeTab === 'authors' && (
                    <div className="article-section">
                        <div className="article-section-title">Authors</div>
                        <div className="author-cards">
                            {article.authors.map((author, i) => (
                                <div className="author-card-item" key={i}>
                                    <strong>{author}</strong>
                                    <span>Affiliation not available</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Keywords */}
                {activeTab === 'keywords' && (
                    <div className="article-section">
                        <div className="article-section-title">Keywords</div>
                        {article.keywords && article.keywords.length > 0 ? (
                            <div className="keyword-tags">
                                {article.keywords.map(k => (
                                    <span className="keyword-tag" key={k}>{k}</span>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: 11, color: '#888' }}>No keywords available for this article.</p>
                        )}
                    </div>
                )}

                {/* Publication metadata */}
                <div className="article-section">
                    <div className="article-section-title">Publication Details</div>
                    <table className="article-meta-table">
                        <tbody>
                            <tr>
                                <td>Published In</td>
                                <td>
                                    <a href={`/conference/${confId}`} onClick={e => { e.preventDefault(); navigate(`/conference/${confId}`); }}>
                                        {conf.title}
                                    </a>
                                </td>
                            </tr>
                            {(conf.dateRange || conf.publishedDate) && (
                                <tr>
                                    <td>Date of Conference</td>
                                    <td>{conf.dateRange || conf.publishedDate}</td>
                                </tr>
                            )}
                            <tr><td>Publisher</td><td>{conf.publisher}</td></tr>
                            {conf.location && <tr><td>Conference Location</td><td>{conf.location}</td></tr>}
                            {article.pages && <tr><td>Page(s)</td><td>{article.pages}</td></tr>}
                            {article.year && <tr><td>Publication Year</td><td>{article.year}</td></tr>}
                            {article.doi && (
                                <tr>
                                    <td>DOI</td>
                                    <td><a href={`https://doi.org/${article.doi}`} target="_blank" rel="noreferrer">{article.doi}</a></td>
                                </tr>
                            )}
                            {conf.issn && <tr><td>ISSN</td><td>{conf.issn}</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Blurred intro */}
                <div className="article-section">
                    <div className="article-section-title">I. Introduction</div>
                    <div className="article-intro-wrap">
                        <p className="article-intro-text">
                            {article.abstract} With growing applications across engineering and applied sciences,
                            effective methods for the topic remain an active area of research. The problem of
                            accurate interpretation continues to drive innovation, particularly where precision
                            is critical to system performance and reliability.
                        </p>
                        <p className="article-intro-text" style={{ marginTop: 7 }}>
                            Traditional approaches relying on manual inspection and rule-based methods are
                            time-consuming and prone to error. This work presents a systematic approach that
                            leverages modern computational techniques to address these shortcomings.
                        </p>
                    </div>
                    <button className="continue-reading-btn">Sign in to Continue Reading</button>
                </div>
            </div>
        </div>
    );
};

export default ConferenceArticlePage;
