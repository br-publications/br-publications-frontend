import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Save, X } from 'lucide-react';
import * as conferenceService from '../../../services/conference.service';
import type { Conference, ConferenceArticle } from '../../../services/conference.service';
import AlertPopup from '../../../components/common/alertPopup';
import '../../../components/submissions/individualPublishChapterWizard.css';
import '../conferenceUploadWizard.css';

// ============================================================
// Props & Types
// ============================================================

interface EditConferenceModalProps {
    conference: Conference;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type TabType = 'conf' | 'articles' | 'review';

const TABS = [
    { id: 'conf' as TabType, label: 'Conference Details', num: 1 },
    { id: 'articles' as TabType, label: 'Articles', num: 2 },
    { id: 'review' as TabType, label: 'Review & Save', num: 3 },
];

const CONF_TYPES = [
    'International Conference', 'National Conference', 'Symposium', 'Workshop', 'Seminar',
];

interface ConfForm {
    title: string;
    publisher: string;
    type: string;
    code: string;
    issn: string;
    doi: string;
    publishedDate: string;
    dateRange: string;
    location: string;
    isActive: boolean;
}

interface ArticleRow extends Partial<ConferenceArticle> {
    tempId: string;
    authorsRaw: string;
    keywordsRaw: string;
    isDirty: boolean;
    isNew: boolean;
    isDeleted: boolean;
}

// ============================================================
// Component
// ============================================================

const EditConferenceModal: React.FC<EditConferenceModalProps> = ({
    conference, isOpen, onClose, onSuccess,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('conf');
    const [loading, setLoading] = useState(false);
    const [articlesLoading, setArticlesLoading] = useState(false);
    const [errors, setErrors] = useState('');

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean; type: 'success' | 'error' | 'warning' | 'info';
        title: string; message: string; showCancel?: boolean; onConfirm?: () => void;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    // ── Conference form ───────────────────────────────────────
    const [confForm, setConfForm] = useState<ConfForm>({
        title: '', publisher: '', type: '', code: '', issn: '', doi: '',
        publishedDate: '', dateRange: '', location: '', isActive: true,
    });

    // ── Articles ──────────────────────────────────────────────
    const [articles, setArticles] = useState<ArticleRow[]>([]);
    const [artTotal, setArtTotal] = useState(0);
    const [artPage, setArtPage] = useState(1);
    const ART_LIMIT = 20;

    // ── Pre-fill on open ────────────────────────────────────
    useEffect(() => {
        if (!isOpen || !conference) return;
        setActiveTab('conf');
        setErrors('');
        setConfForm({
            title: conference.title ?? '',
            publisher: conference.publisher ?? '',
            type: conference.type ?? '',
            code: conference.code ?? '',
            issn: conference.issn ?? '',
            doi: conference.doi ?? '',
            publishedDate: conference.publishedDate ?? '',
            dateRange: conference.dateRange ?? '',
            location: conference.location ?? '',
            isActive: conference.isActive,
        });
        loadArticles(1);
    }, [isOpen, conference]);

    const loadArticles = async (page: number) => {
        setArticlesLoading(true);
        try {
            const data = await conferenceService.getArticlesByConference(conference.id, {
                page, limit: ART_LIMIT,
            });
            const rows: ArticleRow[] = data.articles.map(a => ({
                ...a,
                tempId: `existing-${a.id}`,
                authorsRaw: Array.isArray(a.authors) ? a.authors.join(', ') : '',
                keywordsRaw: Array.isArray(a.keywords) ? a.keywords.join(', ') : '',
                isDirty: false,
                isNew: false,
                isDeleted: false,
            }));
            setArticles(rows);
            setArtTotal(data.pagination.total);
            setArtPage(page);
        } catch {
            toast.error('Failed to load articles');
        } finally {
            setArticlesLoading(false);
        }
    };

    // ── Conf form handlers ───────────────────────────────────
    const handleConfChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const v = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setConfForm(p => ({ ...p, [name]: v }));
    };

    // ── Article row handlers ─────────────────────────────────
    const addArticle = () => {
        const newRow: ArticleRow = {
            tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: '', authorsRaw: '', keywordsRaw: '',
            year: new Date().getFullYear(), pages: '', doi: '', abstract: '',
            isDirty: true, isNew: true, isDeleted: false, isActive: true,
        };
        setArticles(p => [newRow, ...p]);
    };

    const updateArticle = (tempId: string, field: keyof ArticleRow, val: any) => {
        setArticles(p => p.map(a => a.tempId === tempId ? { ...a, [field]: val, isDirty: true } : a));
    };

    const markDeleted = (tempId: string) => {
        const art = articles.find(a => a.tempId === tempId);
        if (art?.isNew) {
            // Just remove from list
            setArticles(p => p.filter(a => a.tempId !== tempId));
        } else {
            setAlertConfig({
                isOpen: true, type: 'warning',
                title: 'Remove Article',
                message: `Delete "${art?.title || 'this article'}"? This will permanently remove it.`,
                showCancel: true,
                onConfirm: () => setArticles(p => p.map(a => a.tempId === tempId ? { ...a, isDeleted: true } : a)),
            });
        }
    };

    // ── Validation ───────────────────────────────────────────
    const validateConf = (): string => {
        if (!confForm.title.trim()) return 'Conference title is required.';
        if (!confForm.publisher.trim()) return 'Publisher is required.';
        return '';
    };

    const validateArticles = (): string => {
        const active = articles.filter(a => !a.isDeleted);
        for (let i = 0; i < active.length; i++) {
            const a = active[i];
            if (!a.title?.trim()) return `Article ${i + 1}: title is required.`;
            if (!a.authorsRaw?.trim()) return `Article ${i + 1}: at least one author is required.`;
        }
        return '';
    };

    const handleNextTab = () => {
        if (activeTab === 'conf') {
            const e = validateConf();
            if (e) { setErrors(e); return; }
        }
        if (activeTab === 'articles') {
            const e = validateArticles();
            if (e) { setErrors(e); return; }
        }
        setErrors('');
        const order: TabType[] = ['conf', 'articles', 'review'];
        const idx = order.indexOf(activeTab);
        if (idx < order.length - 1) setActiveTab(order[idx + 1]);
    };

    const handlePrevTab = () => {
        setErrors('');
        const order: TabType[] = ['conf', 'articles', 'review'];
        const idx = order.indexOf(activeTab);
        if (idx > 0) setActiveTab(order[idx - 1]);
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        const e1 = validateConf();
        if (e1) { setActiveTab('conf'); setErrors(e1); return; }
        const e2 = validateArticles();
        if (e2) { setActiveTab('articles'); setErrors(e2); return; }

        setLoading(true);
        try {
            // 1. Update conference
            await conferenceService.updateConference(conference.id, {
                title: confForm.title.trim(),
                publisher: confForm.publisher.trim(),
                type: confForm.type,
                code: confForm.code.trim() || null,
                issn: confForm.issn.trim() || null,
                doi: confForm.doi.trim() || null,
                publishedDate: confForm.publishedDate.trim() || null,
                dateRange: confForm.dateRange.trim() || null,
                location: confForm.location.trim() || null,
                isActive: confForm.isActive,
            });

            // 2. Process articles
            for (const art of articles) {
                const authors = art.authorsRaw
                    ? art.authorsRaw.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
                const keywords = art.keywordsRaw
                    ? art.keywordsRaw.split(',').map(s => s.trim()).filter(Boolean)
                    : null;

                if (art.isDeleted && art.id) {
                    await conferenceService.deleteArticle(conference.id, art.id);
                } else if (art.isNew && !art.isDeleted) {
                    await conferenceService.createArticle(conference.id, {
                        title: art.title?.trim() ?? '',
                        authors,
                        year: art.year ? Number(art.year) : null,
                        pages: art.pages?.trim() || null,
                        doi: art.doi?.trim() || null,
                        abstract: art.abstract?.trim() || null,
                        keywords,
                        isActive: true,
                    });
                } else if (art.isDirty && !art.isDeleted && art.id) {
                    await conferenceService.updateArticle(conference.id, art.id, {
                        title: art.title?.trim() ?? '',
                        authors,
                        year: art.year ? Number(art.year) : null,
                        pages: art.pages?.trim() || null,
                        doi: art.doi?.trim() || null,
                        abstract: art.abstract?.trim() || null,
                        keywords,
                        isActive: art.isActive,
                    });
                }
            }

            toast.success('🎉 Conference updated successfully!');
            onSuccess();
        } catch (e: any) {
            const msg = e?.message || 'Failed to save changes.';
            toast.error(msg);
            setErrors(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const activeArticles = articles.filter(a => !a.isDeleted);
    const newCount = articles.filter(a => a.isNew && !a.isDeleted).length;
    const deletedCount = articles.filter(a => a.isDeleted).length;

    return (
        <div className="modal-overlay">
            <div className="publish-chapter-form-wrapper conf-wizard-wrapper">
                <div className="pcw-form-container">

                    {/* ── Header ── */}
                    <div className="pcw-header">
                        <div>
                            <h2>✏️ Edit Conference</h2>
                            <div className="pcw-header-sub" style={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {conference.title}
                            </div>
                        </div>
                        <button onClick={onClose} className="pcw-close-btn">&times;</button>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="form-tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => { setErrors(''); setActiveTab(tab.id); }}
                            >
                                <span>{tab.num}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ── Body ── */}
                    <div className="pcw-body">
                        {errors && <div className="pcw-error-banner">⚠ {errors}</div>}

                        {/* ─── TAB 1: Conference Details ─── */}
                        {activeTab === 'conf' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Conference Details</p>
                                <p className="pcw-step-desc">Edit the core information about this conference.</p>

                                <div className="pcw-section-title"><span>Basic Information</span></div>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Conference Title <span className="req">*</span></label>
                                        <input className="pcw-input" name="title" value={confForm.title} onChange={handleConfChange} />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Publisher <span className="req">*</span></label>
                                        <input className="pcw-input" name="publisher" value={confForm.publisher} onChange={handleConfChange} />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Conference Type <span className="req">*</span></label>
                                        <select className="pcw-select" name="type" value={confForm.type} onChange={handleConfChange}>
                                            {CONF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Conference Code</label>
                                        <input className="pcw-input" name="code" value={confForm.code} onChange={handleConfChange} placeholder="e.g. ICET-2024" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Location</label>
                                        <input className="pcw-input" name="location" value={confForm.location} onChange={handleConfChange} placeholder="e.g. New Delhi, India" />
                                    </div>
                                </div>

                                <div className="pcw-section-title" style={{ marginTop: 12 }}><span>Dates</span></div>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field">
                                        <label className="pcw-label">Published Date</label>
                                        <input className="pcw-input" name="publishedDate" value={confForm.publishedDate} onChange={handleConfChange} placeholder="e.g. 2024" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Date Range</label>
                                        <input className="pcw-input" name="dateRange" value={confForm.dateRange} onChange={handleConfChange} placeholder="e.g. 15–17 March 2024" />
                                    </div>
                                </div>

                                <div className="pcw-section-title" style={{ marginTop: 12 }}><span>Identifiers</span></div>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field">
                                        <label className="pcw-label">ISSN</label>
                                        <input className="pcw-input" name="issn" value={confForm.issn} onChange={handleConfChange} placeholder="e.g. 2456-1234" />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">DOI</label>
                                        <input className="pcw-input" name="doi" value={confForm.doi} onChange={handleConfChange} placeholder="e.g. 10.xxxxx/xxxxx" />
                                    </div>
                                </div>

                                <div className="pcw-section-title" style={{ marginTop: 12 }}><span>Visibility</span></div>
                                <div className="conf-toggle-row">
                                    <input
                                        type="checkbox" id="edit-isActive" name="isActive"
                                        checked={confForm.isActive} onChange={handleConfChange}
                                    />
                                    <label htmlFor="edit-isActive" className="conf-toggle-label">
                                        Active (visible to all users)
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 2: Articles ─── */}
                        {activeTab === 'articles' && (
                            <div className="tab-pane active slide-in-bottom">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <p className="pcw-step-title" style={{ marginBottom: 1 }}>Articles / Papers</p>
                                        <p className="pcw-step-desc">Add, edit, or remove articles. Changes are applied on Save.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {deletedCount > 0 && (
                                            <span style={{ fontSize: 10, background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: 4, border: '1px solid #ffc107' }}>
                                                {deletedCount} to delete
                                            </span>
                                        )}
                                        {newCount > 0 && (
                                            <span style={{ fontSize: 10, background: '#d1e7dd', color: '#0f5132', padding: '2px 8px', borderRadius: 4, border: '1px solid #86efac' }}>
                                                {newCount} new
                                            </span>
                                        )}
                                        <button type="button" className="pcw-add-btn" onClick={addArticle} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Plus size={11} /> Add Article
                                        </button>
                                    </div>
                                </div>

                                {articlesLoading ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                                        Loading articles…
                                    </div>
                                ) : (
                                    <div className="conf-article-list">
                                        {activeArticles.length === 0 && (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 12, border: '1px dashed #e5e7eb', borderRadius: 6 }}>
                                                No articles yet. Click "+ Add Article" to get started.
                                            </div>
                                        )}
                                        {activeArticles.map((art, i) => (
                                            <ArticleEditorRow
                                                key={art.tempId}
                                                art={art}
                                                index={i}
                                                onChange={updateArticle}
                                                onDelete={markDeleted}
                                            />
                                        ))}
                                    </div>
                                )}

                                {artTotal > ART_LIMIT && (
                                    <div style={{ marginTop: 8, fontSize: 11, color: '#7a8a9e', textAlign: 'center' }}>
                                        Showing {activeArticles.length} of {artTotal} articles
                                        (editing all {artTotal} — scroll to see more)
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── TAB 3: Review & Save ─── */}
                        {activeTab === 'review' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Review & Save</p>
                                <p className="pcw-step-desc">Confirm your changes and click Save to apply them to the database.</p>

                                {/* Conf summary */}
                                <div className="pcw-section-title"><span>Conference Summary</span></div>
                                <div className="conf-review-grid">
                                    {[
                                        { label: 'Title', val: confForm.title },
                                        { label: 'Publisher', val: confForm.publisher },
                                        { label: 'Type', val: confForm.type },
                                        { label: 'Code', val: confForm.code || null },
                                        { label: 'ISSN', val: confForm.issn || null },
                                        { label: 'DOI', val: confForm.doi || null },
                                        { label: 'Published Date', val: confForm.publishedDate || null },
                                        { label: 'Date Range', val: confForm.dateRange || null },
                                        { label: 'Location', val: confForm.location || null },
                                        { label: 'Status', val: confForm.isActive ? 'Active' : 'Inactive' },
                                    ].map(r => (
                                        <div key={r.label} className="conf-review-card">
                                            <div className="conf-review-card-title">{r.label}</div>
                                            <div className="conf-review-card-val">{r.val ?? <em>—</em>}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Article changes summary */}
                                <div className="pcw-section-title" style={{ marginTop: 14 }}>
                                    <span>Pending Article Changes</span>
                                </div>
                                <div className="conf-review-card" style={{ padding: '10px 12px' }}>
                                    {newCount === 0 && deletedCount === 0 && articles.filter(a => a.isDirty && !a.isNew && !a.isDeleted).length === 0 ? (
                                        <div style={{ fontSize: 11, color: '#9ca3af' }}>No article changes</div>
                                    ) : (
                                        <>
                                            {newCount > 0 && (
                                                <div style={{ fontSize: 11, color: '#0f5132', marginBottom: 4 }}>
                                                    ✚ {newCount} new article(s) will be created
                                                </div>
                                            )}
                                            {deletedCount > 0 && (
                                                <div style={{ fontSize: 11, color: '#842029', marginBottom: 4 }}>
                                                    ✖ {deletedCount} article(s) will be deleted
                                                </div>
                                            )}
                                            {articles.filter(a => a.isDirty && !a.isNew && !a.isDeleted).length > 0 && (
                                                <div style={{ fontSize: 11, color: '#664d03' }}>
                                                    ✎ {articles.filter(a => a.isDirty && !a.isNew && !a.isDeleted).length} article(s) will be updated
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Full article list */}
                                <div className="pcw-section-title" style={{ marginTop: 12 }}>
                                    <span>All Articles ({activeArticles.length})</span>
                                </div>
                                <div className="conf-review-card" style={{ gridColumn: 'unset', padding: 0 }}>
                                    {activeArticles.length === 0 && (
                                        <div style={{ padding: '10px 12px', fontSize: 11, color: '#9ca3af' }}>No articles to display</div>
                                    )}
                                    {activeArticles.map((art, i) => (
                                        <div key={art.tempId} className="conf-review-article">
                                            <strong>
                                                {i + 1}. {art.title || '(untitled)'}
                                                {art.isNew && <span style={{ fontSize: 9, marginLeft: 6, background: '#d1e7dd', color: '#0f5132', padding: '1px 5px', borderRadius: 3 }}>NEW</span>}
                                                {art.isDirty && !art.isNew && <span style={{ fontSize: 9, marginLeft: 6, background: '#fff3cd', color: '#856404', padding: '1px 5px', borderRadius: 3 }}>EDITED</span>}
                                            </strong>
                                            <span style={{ fontSize: 10, color: '#4b5563' }}>
                                                {art.authorsRaw}
                                                {art.year ? ` · ${art.year}` : ''}
                                                {art.pages ? ` · pp. ${art.pages}` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="pcw-footer">
                        <button
                            type="button"
                            className="pcw-btn-secondary"
                            onClick={activeTab === 'conf' ? onClose : handlePrevTab}
                            disabled={loading}
                        >
                            {activeTab === 'conf' ? 'Cancel' : '← Back'}
                        </button>

                        {activeTab !== 'review' ? (
                            <button type="button" className="pcw-btn-primary" onClick={handleNextTab} disabled={loading}>
                                Next →
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="pcw-btn-primary"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Save size={13} />
                                {loading ? 'Saving…' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                showCancel={alertConfig.showCancel}
                onConfirm={() => { if (alertConfig.onConfirm) alertConfig.onConfirm(); setAlertConfig(p => ({ ...p, isOpen: false })); }}
                onClose={() => setAlertConfig(p => ({ ...p, isOpen: false }))}
            />
        </div>
    );
};

// ============================================================
// ArticleEditorRow — individual article card inside Tab 2
// ============================================================

interface ArticleEditorRowProps {
    art: ArticleRow;
    index: number;
    onChange: (tempId: string, field: keyof ArticleRow, val: any) => void;
    onDelete: (tempId: string) => void;
}

const ArticleEditorRow: React.FC<ArticleEditorRowProps> = ({ art, index, onChange, onDelete }) => {
    const [collapsed, setCollapsed] = useState(!art.isNew);

    return (
        <div className="conf-article-row" style={art.isDirty ? { borderLeftColor: '#f59e0b' } : {}}>
            <div className="conf-article-row-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span className="conf-article-row-num">{index + 1}</span>
                    <button
                        type="button"
                        onClick={() => setCollapsed(c => !c)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1e5292', textAlign: 'left', padding: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {art.title?.trim() || `Article ${index + 1}`}
                        <span style={{ fontSize: 9, marginLeft: 6, color: '#9ca3af' }}>{collapsed ? '▼ expand' : '▲ collapse'}</span>
                    </button>
                    {art.isNew && <span style={{ fontSize: 9, background: '#d1e7dd', color: '#0f5132', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>NEW</span>}
                    {art.isDirty && !art.isNew && <span style={{ fontSize: 9, background: '#fff3cd', color: '#856404', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>EDITED</span>}
                </div>
                <button
                    type="button"
                    className="pcw-remove-btn"
                    onClick={() => onDelete(art.tempId)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                >
                    <X size={11} /> Remove
                </button>
            </div>

            {!collapsed && (
                <div className="pcw-field-grid" style={{ marginTop: 8 }}>
                    <div className="pcw-field span-full">
                        <label className="pcw-label">Article Title <span className="req">*</span></label>
                        <input
                            className="pcw-input"
                            value={art.title ?? ''}
                            onChange={e => onChange(art.tempId, 'title', e.target.value)}
                            placeholder="Full paper title"
                        />
                    </div>
                    <div className="pcw-field span-full">
                        <label className="pcw-label">Authors <span className="req">*</span></label>
                        <input
                            className="pcw-input"
                            value={art.authorsRaw}
                            onChange={e => onChange(art.tempId, 'authorsRaw', e.target.value)}
                            placeholder="Comma-separated — e.g. John Doe, Jane Smith"
                        />
                    </div>
                    <div className="pcw-field">
                        <label className="pcw-label">Year</label>
                        <input
                            className="pcw-input"
                            type="number"
                            value={art.year ?? ''}
                            onChange={e => onChange(art.tempId, 'year', e.target.value)}
                            placeholder="e.g. 2024"
                            min={1900} max={2100}
                        />
                    </div>
                    <div className="pcw-field">
                        <label className="pcw-label">Pages</label>
                        <input
                            className="pcw-input"
                            value={art.pages ?? ''}
                            onChange={e => onChange(art.tempId, 'pages', e.target.value)}
                            placeholder="e.g. 45-52"
                        />
                    </div>
                    <div className="pcw-field span-full">
                        <label className="pcw-label">DOI</label>
                        <input
                            className="pcw-input"
                            value={art.doi ?? ''}
                            onChange={e => onChange(art.tempId, 'doi', e.target.value)}
                            placeholder="e.g. 10.xxxxx/xxxxx"
                        />
                    </div>
                    <div className="pcw-field span-full">
                        <label className="pcw-label">Keywords</label>
                        <input
                            className="pcw-input"
                            value={art.keywordsRaw}
                            onChange={e => onChange(art.tempId, 'keywordsRaw', e.target.value)}
                            placeholder="Comma-separated — e.g. machine learning, IoT"
                        />
                    </div>
                    <div className="pcw-field span-full">
                        <label className="pcw-label">Abstract</label>
                        <textarea
                            className="pcw-textarea"
                            value={art.abstract ?? ''}
                            onChange={e => onChange(art.tempId, 'abstract', e.target.value)}
                            placeholder="Brief summary of the paper (optional)"
                            rows={3}
                        />
                    </div>
                    <div className="pcw-field">
                        <div className="conf-toggle-row">
                            <input
                                type="checkbox"
                                id={`art-active-${art.tempId}`}
                                checked={art.isActive ?? true}
                                onChange={e => onChange(art.tempId, 'isActive', e.target.checked)}
                            />
                            <label htmlFor={`art-active-${art.tempId}`} className="conf-toggle-label">
                                Active (visible in public listing)
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditConferenceModal;
