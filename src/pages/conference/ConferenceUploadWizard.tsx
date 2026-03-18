import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import * as conferenceService from '../../services/conference.service';
import '../../components/submissions/individualPublishChapterWizard.css';
import './conferenceUploadWizard.css';

// ============================================================
// Types
// ============================================================

interface ConferenceUploadWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type TabType = 'details' | 'articles' | 'review';

interface TabDef {
    id: TabType;
    label: string;
    num: number;
}

const TABS: TabDef[] = [
    { id: 'details', label: 'Conference Details', num: 1 },
    { id: 'articles', label: 'Articles', num: 2 },
    { id: 'review', label: 'Review & Submit', num: 3 },
];

interface ConferenceForm {
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

interface ArticleForm {
    tempId: string;
    title: string;
    authorsRaw: string; // comma-separated input → split to string[]
    year: string;
    pages: string;
    doi: string;
    abstract: string;
    keywordsRaw: string; // comma-separated
}

const emptyConference = (): ConferenceForm => ({
    title: '',
    publisher: 'BR Publications',
    type: 'International Conference',
    code: '',
    issn: '',
    doi: '',
    publishedDate: '',
    dateRange: '',
    location: '',
    isActive: true,
});

const emptyArticle = (): ArticleForm => ({
    tempId: `art-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: '',
    authorsRaw: '',
    year: new Date().getFullYear().toString(),
    pages: '',
    doi: '',
    abstract: '',
    keywordsRaw: '',
});

const CONF_TYPES = [
    'International Conference',
    'National Conference',
    'Symposium',
    'Workshop',
    'Seminar',
];

// ============================================================
// Component
// ============================================================

const ConferenceUploadWizard: React.FC<ConferenceUploadWizardProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [touchedTabs, setTouchedTabs] = useState<Set<TabType>>(new Set(['details']));
    const [errors, setErrors] = useState('');
    const [loading, setLoading] = useState(false);

    const [conf, setConf] = useState<ConferenceForm>(emptyConference());
    const [articles, setArticles] = useState<ArticleForm[]>([emptyArticle()]);

    // ── Reset when modal opens ────────────────────────────────
    React.useEffect(() => {
        if (!isOpen) return;
        setConf(emptyConference());
        setArticles([emptyArticle()]);
        setActiveTab('details');
        setTouchedTabs(new Set(['details']));
        setErrors('');
    }, [isOpen]);

    // ── Conf field change ────────────────────────────────────
    const handleConfChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const newVal = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setConf(p => ({ ...p, [name]: newVal }));
    };

    // ── Article helpers ──────────────────────────────────────
    const addArticle = () => setArticles(p => [...p, emptyArticle()]);
    const removeArticle = (tempId: string) => {
        if (articles.length > 1) setArticles(p => p.filter(a => a.tempId !== tempId));
    };
    const updateArticle = (tempId: string, field: keyof ArticleForm, val: string) => {
        setArticles(p => p.map(a => a.tempId === tempId ? { ...a, [field]: val } : a));
    };

    // ── Validation ───────────────────────────────────────────
    const validateTab = (tab: TabType): string => {
        if (tab === 'details') {
            if (!conf.title.trim()) return 'Conference title is required.';
            if (!conf.publisher.trim()) return 'Publisher is required.';
            if (!conf.type.trim()) return 'Conference type is required.';
        }
        if (tab === 'articles') {
            if (articles.length === 0) return 'At least one article is required.';
            for (let i = 0; i < articles.length; i++) {
                const a = articles[i];
                if (!a.title.trim()) return `Article ${i + 1}: title is required.`;
                if (!a.authorsRaw.trim()) return `Article ${i + 1}: at least one author is required.`;
            }
        }
        return '';
    };

    const handleNextTab = () => {
        const order: TabType[] = ['details', 'articles', 'review'];
        const err = validateTab(activeTab);
        if (err) { setErrors(err); return; }
        setErrors('');
        const idx = order.indexOf(activeTab);
        if (idx < order.length - 1) {
            const next = order[idx + 1];
            setTouchedTabs(p => new Set(p).add(next));
            setActiveTab(next);
        }
    };

    const handlePrevTab = () => {
        const order: TabType[] = ['details', 'articles', 'review'];
        setErrors('');
        const idx = order.indexOf(activeTab);
        if (idx > 0) setActiveTab(order[idx - 1]);
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        // Full validation
        for (const tab of ['details', 'articles'] as TabType[]) {
            const e = validateTab(tab);
            if (e) { setActiveTab(tab); setErrors(e); return; }
        }

        setLoading(true);
        let createdConf: conferenceService.Conference | null = null;
        try {
            // 1. Create conference
            const confPayload: Partial<conferenceService.Conference> = {
                title: conf.title.trim(),
                publisher: conf.publisher.trim(),
                type: conf.type,
                code: conf.code.trim() || null,
                issn: conf.issn.trim() || null,
                doi: conf.doi.trim() || null,
                publishedDate: conf.publishedDate.trim() || null,
                dateRange: conf.dateRange.trim() || null,
                location: conf.location.trim() || null,
                isActive: conf.isActive,
            };
            createdConf = await conferenceService.createConference(confPayload);

            // 2. Create articles sequentially
            for (const art of articles) {
                if (!art.title.trim()) continue;
                const authors = art.authorsRaw
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
                const keywords = art.keywordsRaw
                    ? art.keywordsRaw.split(',').map(s => s.trim()).filter(Boolean)
                    : null;
                const artPayload: Partial<conferenceService.ConferenceArticle> = {
                    title: art.title.trim(),
                    authors,
                    year: art.year ? Number(art.year) : null,
                    pages: art.pages.trim() || null,
                    doi: art.doi.trim() || null,
                    abstract: art.abstract.trim() || null,
                    keywords,
                    isActive: true,
                };
                await conferenceService.createArticle(createdConf.id, artPayload);
            }

            toast.success(`🎉 Conference created with ${articles.length} article(s)!`);
            onSuccess();
            onClose();
        } catch (e: any) {
            const msg = e?.message || 'Failed to save. Please try again.';
            toast.error(msg);
            setErrors(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // ── Review data ──────────────────────────────────────────
    const reviewRows: { label: string; val: string | null }[] = [
        { label: 'Title', val: conf.title },
        { label: 'Publisher', val: conf.publisher },
        { label: 'Type', val: conf.type },
        { label: 'Code', val: conf.code || null },
        { label: 'ISSN', val: conf.issn || null },
        { label: 'DOI', val: conf.doi || null },
        { label: 'Published Date', val: conf.publishedDate || null },
        { label: 'Date Range', val: conf.dateRange || null },
        { label: 'Location', val: conf.location || null },
        { label: 'Status', val: conf.isActive ? 'Active' : 'Inactive' },
    ];

    return (
        <div className="modal-overlay">
            <div className="publish-chapter-form-wrapper conf-wizard-wrapper">
                <div className="pcw-form-container">

                    {/* Header */}
                    <div className="pcw-header">
                        <div>
                            <h2>🏛️ Upload Conference</h2>
                            <div className="pcw-header-sub">Create a new conference record with articles.</div>
                        </div>
                        <button onClick={onClose} className="pcw-close-btn">&times;</button>
                    </div>

                    {/* Tabs */}
                    <div className="form-tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => {
                                    if (touchedTabs.has(tab.id)) {
                                        setErrors('');
                                        setActiveTab(tab.id);
                                    }
                                }}
                            >
                                <span>{tab.num}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="pcw-body">
                        {errors && <div className="pcw-error-banner">⚠ {errors}</div>}

                        {/* ── TAB 1: Conference Details ── */}
                        {activeTab === 'details' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Conference Details</p>
                                <p className="pcw-step-desc">Fill in the core information about the conference proceeding.</p>

                                {/* Row 1 */}
                                <div className="pcw-section-title">
                                    <span>Basic Information <span className="req">*</span></span>
                                </div>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field span-full">
                                        <label className="pcw-label">Conference Title <span className="req">*</span></label>
                                        <input
                                            className="pcw-input"
                                            name="title"
                                            value={conf.title}
                                            onChange={handleConfChange}
                                            placeholder="e.g. International Conference on Emerging Technologies 2024"
                                        />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Publisher <span className="req">*</span></label>
                                        <input
                                            className="pcw-input"
                                            name="publisher"
                                            value={conf.publisher}
                                            onChange={handleConfChange}
                                            placeholder="e.g. BR Publications"
                                        />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Conference Type <span className="req">*</span></label>
                                        <select className="pcw-select" name="type" value={conf.type} onChange={handleConfChange}>
                                            {CONF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Conference Code / Short Name</label>
                                        <input
                                            className="pcw-input"
                                            name="code"
                                            value={conf.code}
                                            onChange={handleConfChange}
                                            placeholder="e.g. ICET-2024"
                                        />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Location</label>
                                        <input
                                            className="pcw-input"
                                            name="location"
                                            value={conf.location}
                                            onChange={handleConfChange}
                                            placeholder="e.g. New Delhi, India"
                                        />
                                    </div>
                                </div>

                                {/* Row 2 – Dates */}
                                <div className="pcw-section-title" style={{ marginTop: 12 }}>
                                    <span>Dates</span>
                                </div>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field">
                                        <label className="pcw-label">Published Date</label>
                                        <input
                                            className="pcw-input"
                                            name="publishedDate"
                                            value={conf.publishedDate}
                                            onChange={handleConfChange}
                                            placeholder="e.g. 2024 or March 2024"
                                        />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">Date Range</label>
                                        <input
                                            className="pcw-input"
                                            name="dateRange"
                                            value={conf.dateRange}
                                            onChange={handleConfChange}
                                            placeholder="e.g. 15–17 March 2024"
                                        />
                                    </div>
                                </div>

                                {/* Row 3 – Identifiers */}
                                <div className="pcw-section-title" style={{ marginTop: 12 }}>
                                    <span>Identifiers</span>
                                </div>
                                <div className="pcw-field-grid">
                                    <div className="pcw-field">
                                        <label className="pcw-label">ISSN</label>
                                        <input
                                            className="pcw-input"
                                            name="issn"
                                            value={conf.issn}
                                            onChange={handleConfChange}
                                            placeholder="e.g. 2456-1234"
                                        />
                                    </div>
                                    <div className="pcw-field">
                                        <label className="pcw-label">DOI</label>
                                        <input
                                            className="pcw-input"
                                            name="doi"
                                            value={conf.doi}
                                            onChange={handleConfChange}
                                            placeholder="e.g. 10.xxxxx/xxxxx"
                                        />
                                    </div>
                                </div>

                                {/* Row 4 – Status */}
                                <div className="pcw-section-title" style={{ marginTop: 12 }}>
                                    <span>Visibility</span>
                                </div>
                                <div className="conf-toggle-row">
                                    <input
                                        type="checkbox"
                                        id="conf-isActive"
                                        name="isActive"
                                        checked={conf.isActive}
                                        onChange={handleConfChange}
                                    />
                                    <label htmlFor="conf-isActive" className="conf-toggle-label">
                                        Publish immediately (visible to all users)
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 2: Articles ── */}
                        {activeTab === 'articles' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Articles / Papers</p>
                                <p className="pcw-step-desc">Add all papers included in this conference proceeding. Title and Authors are required for each.</p>

                                <div className="pcw-section-title">
                                    <span>Articles <span className="req">*</span></span>
                                    <button type="button" className="pcw-add-btn" onClick={addArticle}>+ Add Article</button>
                                </div>

                                <div className="conf-article-list">
                                    {articles.map((art, i) => (
                                        <div key={art.tempId} className="conf-article-row">
                                            <div className="conf-article-row-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span className="conf-article-row-num">{i + 1}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e5292' }}>
                                                        {art.title.trim() || `Article ${i + 1}`}
                                                    </span>
                                                </div>
                                                {articles.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="pcw-remove-btn"
                                                        onClick={() => removeArticle(art.tempId)}
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                )}
                                            </div>

                                            {/* Article fields grid */}
                                            <div className="pcw-field-grid">
                                                <div className="pcw-field span-full">
                                                    <label className="pcw-label">Article Title <span className="req">*</span></label>
                                                    <input
                                                        className="pcw-input"
                                                        value={art.title}
                                                        onChange={e => updateArticle(art.tempId, 'title', e.target.value)}
                                                        placeholder="Full paper title"
                                                    />
                                                </div>
                                                <div className="pcw-field span-full">
                                                    <label className="pcw-label">Authors <span className="req">*</span></label>
                                                    <input
                                                        className="pcw-input"
                                                        value={art.authorsRaw}
                                                        onChange={e => updateArticle(art.tempId, 'authorsRaw', e.target.value)}
                                                        placeholder="Comma-separated — e.g. John Doe, Jane Smith"
                                                    />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Year</label>
                                                    <input
                                                        className="pcw-input"
                                                        type="number"
                                                        value={art.year}
                                                        onChange={e => updateArticle(art.tempId, 'year', e.target.value)}
                                                        placeholder="e.g. 2024"
                                                        min={1900}
                                                        max={2100}
                                                    />
                                                </div>
                                                <div className="pcw-field">
                                                    <label className="pcw-label">Pages</label>
                                                    <input
                                                        className="pcw-input"
                                                        value={art.pages}
                                                        onChange={e => updateArticle(art.tempId, 'pages', e.target.value)}
                                                        placeholder="e.g. 45-52 or 45"
                                                    />
                                                </div>
                                                <div className="pcw-field span-full">
                                                    <label className="pcw-label">DOI</label>
                                                    <input
                                                        className="pcw-input"
                                                        value={art.doi}
                                                        onChange={e => updateArticle(art.tempId, 'doi', e.target.value)}
                                                        placeholder="e.g. 10.xxxxx/xxxxx"
                                                    />
                                                </div>
                                                <div className="pcw-field span-full">
                                                    <label className="pcw-label">Keywords</label>
                                                    <input
                                                        className="pcw-input"
                                                        value={art.keywordsRaw}
                                                        onChange={e => updateArticle(art.tempId, 'keywordsRaw', e.target.value)}
                                                        placeholder="Comma-separated — e.g. machine learning, IoT, cloud"
                                                    />
                                                </div>
                                                <div className="pcw-field span-full">
                                                    <label className="pcw-label">Abstract</label>
                                                    <textarea
                                                        className="pcw-textarea"
                                                        value={art.abstract}
                                                        onChange={e => updateArticle(art.tempId, 'abstract', e.target.value)}
                                                        placeholder="Brief summary of the paper (optional)"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 10 }}>
                                    <button type="button" className="pcw-add-btn" onClick={addArticle} style={{ marginTop: 0 }}>
                                        + Add Another Article
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 3: Review & Submit ── */}
                        {activeTab === 'review' && (
                            <div className="tab-pane active slide-in-bottom">
                                <p className="pcw-step-title">Review & Submit</p>
                                <p className="pcw-step-desc">Check all details before submitting. The conference and all articles will be saved to the database.</p>

                                {/* Conference summary */}
                                <div className="pcw-section-title">
                                    <span>Conference Summary</span>
                                </div>
                                <div className="conf-review-grid">
                                    {reviewRows.map(r => (
                                        <div key={r.label} className="conf-review-card">
                                            <div className="conf-review-card-title">{r.label}</div>
                                            <div className="conf-review-card-val">
                                                {r.val ? r.val : <em>—</em>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Articles summary */}
                                <div className="pcw-section-title" style={{ marginTop: 14 }}>
                                    <span>Articles ({articles.length})</span>
                                </div>
                                <div className="conf-review-card span-full" style={{ gridColumn: 'unset' }}>
                                    {articles.map((art, i) => (
                                        <div key={art.tempId} className="conf-review-article">
                                            <strong>{i + 1}. {art.title || '(untitled)'}</strong>
                                            <span style={{ fontSize: 10, color: '#4b5563' }}>
                                                {art.authorsRaw}
                                                {art.year ? ` · ${art.year}` : ''}
                                                {art.pages ? ` · pp. ${art.pages}` : ''}
                                                {art.doi ? ` · ${art.doi}` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer nav */}
                    <div className="pcw-footer">
                        <button
                            type="button"
                            className="pcw-btn-secondary"
                            onClick={activeTab === 'details' ? onClose : handlePrevTab}
                            disabled={loading}
                        >
                            {activeTab === 'details' ? 'Cancel' : '← Back'}
                        </button>

                        {activeTab !== 'review' ? (
                            <button type="button" className="pcw-btn-primary" onClick={handleNextTab} disabled={loading}>
                                Next →
                            </button>
                        ) : (
                            <button type="button" className="pcw-btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Saving…' : '✔ Submit Conference'}
                            </button>
                        )}
                    </div>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: '#1e5292' }}>
                            Creating conference and uploading {articles.length} article(s), please wait…
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConferenceUploadWizard;
