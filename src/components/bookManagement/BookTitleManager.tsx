import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import bookManagementService, { type BookTitle } from '../../services/bookManagement.service';
import { userService, type UserServiceUser as User } from '../../services';
import type { ToastMsg, BookTitleNav } from './BookManagement';

interface Props {
    addToast: (type: ToastMsg['type'], message: string) => void;
    onManageChapters: (book: BookTitleNav) => void;
    onManageEditors: (book: BookTitleNav) => void;
}

interface ChapterDraft {
    tempId: number;
    chapterTitle: string;
    chapterNumber: number;
}

/* ── Confirm dialog ── */
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {

    return (
        <div className="bms-confirm-overlay">
            <div className="bms-confirm-box">
                <h4>Confirm Action</h4>
                <p>{message}</p>
                <div className="bms-confirm-actions">
                    <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

let tempIdSeq = 0;

export default function BookTitleManager({ addToast, onManageChapters, onManageEditors }: Props) {
    const navigate = useNavigate();
    const [bookTitles, setBookTitles] = useState<BookTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    /* form state */
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formActive, setFormActive] = useState(true);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    /* chapter drafts (only for create mode) */
    const [chapterDrafts, setChapterDrafts] = useState<ChapterDraft[]>([]);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const chapterInputRef = useRef<HTMLInputElement>(null);

    /* editor selection (only for create mode) */
    const [availableEditors, setAvailableEditors] = useState<User[]>([]);
    const [editorSearch, setEditorSearch] = useState('');
    const [selectedEditorIds, setSelectedEditorIds] = useState<number[]>([]);

    /* drag-and-drop for chapter reorder inside form */
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    /* confirm */
    const [confirm, setConfirm] = useState<{ msg: string; action: () => void } | null>(null);

    useEffect(() => { fetchTitles(); }, [search]);

    const fetchTitles = async () => {
        try {
            setLoading(true);
            const r = await bookManagementService.bookTitle.getAllBookTitles({ search: search || undefined, activeOnly: false });
            if (r.success && r.data?.bookTitles) setBookTitles(r.data.bookTitles);
        } catch (e: any) {
            addToast('error', e.message || 'Failed to load book titles');
        } finally {
            setLoading(false);
        }
    };

    const fetchEditors = async () => {
        try {
            const r = await userService.getAllUsers({ role: 'editor', page: 1, limit: 200 });
            if (r.success && r.data?.users) setAvailableEditors(r.data.users);
        } catch { /* silent */ }
    };

    /* ── Open create form ── */
    const openCreate = () => {
        setEditMode(false);
        setEditId(null);
        setFormTitle('');
        setFormActive(true);
        setFormError('');
        setChapterDrafts([]);
        setNewChapterTitle('');
        setSelectedEditorIds([]);
        setEditorSearch('');
        fetchEditors();
        setShowForm(true);
    };

    /* ── Open edit form ── */
    const openEdit = (t: BookTitle) => {
        setEditMode(true);
        setEditId(t.id);
        setFormTitle(t.title);
        setFormActive(t.isActive);
        setFormError('');
        setChapterDrafts([]);
        setNewChapterTitle('');
        setSelectedEditorIds([]);
        setShowForm(true);
    };

    /* ── Add chapter draft ── */
    const addChapterDraft = () => {
        const val = newChapterTitle.trim();
        if (!val) return;
        setChapterDrafts((p) => [...p, { tempId: ++tempIdSeq, chapterTitle: val, chapterNumber: p.length + 1 }]);
        setNewChapterTitle('');
        chapterInputRef.current?.focus();
    };

    /* ── Remove chapter draft ── */
    const removeChapterDraft = (tempId: number) => {
        setChapterDrafts((p) => p.filter((c) => c.tempId !== tempId).map((c, i) => ({ ...c, chapterNumber: i + 1 })));
    };

    /* ── Drag reorder drafts ── */
    const draftDragOver = (e: React.DragEvent, toIdx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === toIdx) return;
        const arr = [...chapterDrafts];
        const moved = arr.splice(dragIdx, 1)[0];
        arr.splice(toIdx, 0, moved);
        setChapterDrafts(arr.map((c, i) => ({ ...c, chapterNumber: i + 1 })));
        setDragIdx(toIdx);
    };

    /* ── Toggle editor ── */
    const toggleEditor = (id: number) => {
        setSelectedEditorIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    };

    /* ── Submit form ── */
    const handleSubmit = async () => {
        const title = formTitle.trim();
        if (!title) { setFormError('Book title is required.'); return; }
        setSaving(true);
        setFormError('');
        try {
            if (editMode && editId) {
                /* UPDATE */
                await bookManagementService.bookTitle.updateBookTitle(editId, { title, isActive: formActive });
                addToast('success', 'Book title updated.');
            } else {
                /* CREATE */
                const res = await bookManagementService.bookTitle.createBookTitle(title);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const resData = res.data as any;
                const newId: number = resData?.bookTitle?.id ?? resData?.id ?? null;

                /* create chapters */
                if (chapterDrafts.length > 0 && newId) {
                    for (const ch of chapterDrafts) {
                        try {
                            await bookManagementService.bookChapter.createBookChapter({
                                bookTitleId: newId,
                                chapterTitle: ch.chapterTitle,
                                chapterNumber: ch.chapterNumber,
                            });
                        } catch (err: any) {
                            console.error('Failed to create chapter draft:', err);
                            addToast('error', `Failed to create chapter "${ch.chapterTitle}": ${err.error || err.message}`);
                        }
                    }
                }

                /* assign editors */
                if (selectedEditorIds.length > 0 && newId) {
                    try {
                        await bookManagementService.bookEditor.bulkAssignEditors(newId, selectedEditorIds);
                    } catch { /* non-fatal */ }
                }

                addToast('success', `"${title}" registered successfully.`);
            }
            setShowForm(false);
            fetchTitles();
        } catch (e: any) {
            setFormError(e.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    /* ── Toggle active ── */
    const toggleActive = async (t: BookTitle) => {
        try {
            await bookManagementService.bookTitle.updateBookTitle(t.id, { isActive: !t.isActive });
            addToast('success', `"${t.title}" ${!t.isActive ? 'activated' : 'deactivated'}.`);
            fetchTitles();
        } catch (e: any) {
            console.error('Submit error:', e);
            addToast('error', e.error || e.message || 'Failed to update status');
        }
    };

    /* ── Delete ── */
    const doDelete = (t: BookTitle) => {

        setConfirm({
            msg: `PERMANENTLY DELETE "${t.title}"?\n\nThis action cannot be undone. All associated chapters and editor assignments will be removed.`,
            action: async () => {

                setConfirm(null);
                try {
                    setLoading(true);
                    const res = await bookManagementService.bookTitle.deleteBookTitle(t.id);

                    addToast('success', `"${t.title}" removed.`);
                    await fetchTitles();
                } catch (e: any) {
                    console.error('Delete failed:', e);
                    addToast('error', e.message || 'Delete failed');
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const filteredEditors = availableEditors.filter(
        (e) => e.fullName.toLowerCase().includes(editorSearch.toLowerCase()) || e.email.toLowerCase().includes(editorSearch.toLowerCase())
    );

    /* active / inactive counts */
    const activeCount = bookTitles.filter((t) => t.isActive).length;
    const inactiveCount = bookTitles.length - activeCount;

    return (
        <>
            {confirm && <ConfirmDialog message={confirm.msg} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}

            {/* ── Section header ── */}
            <div className="bms-section-header">
                <div>
                    <h2>Book Titles Register</h2>
                    <div className="bms-section-header-sub">Manage all published and pending book titles</div>
                </div>
                {!showForm && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-navy btn-sm" onClick={openCreate}>+ Register New Title</button>
                    </div>
                )}
            </div>

            {/* ── Stats strip ── */}
            <div className="bms-stats-strip">
                <div className="bms-stat-card">
                    <div className="stat-num">{bookTitles.length}</div>
                    <div className="stat-label">Total Titles</div>
                </div>
                <div className="bms-stat-card">
                    <div className="stat-num">{activeCount}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="bms-stat-card">
                    <div className="stat-num">{inactiveCount}</div>
                    <div className="stat-label">Inactive</div>
                </div>
                <div className="bms-stat-card">
                    <div className="stat-num">{bookTitles.reduce((s, t) => s + (t.chapterCount || 0), 0)}</div>
                    <div className="stat-label">Total Chapters</div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                UNIFIED CREATE / EDIT FORM
            ══════════════════════════════════════════════ */}
            {showForm && (
                <div className="bms-form-panel" style={{ marginBottom: '1.25rem' }}>
                    <div className="bms-form-panel-head">
                        <h3>{editMode ? 'Edit Book Title' : 'Register New Book Title'}</h3>
                        <button className="bms-form-panel-close" onClick={() => setShowForm(false)} title="Close">&#10005;</button>
                    </div>

                    <div className="bms-form-panel-body">
                        {/* Step indicators */}
                        {!editMode && (
                            <div className="bms-form-steps">
                                <div className="bms-step active">
                                    <div className="bms-step-num">1</div>
                                    Title Details
                                </div>
                                <span className="bms-step-arrow">›</span>
                                <div className="bms-step active">
                                    <div className="bms-step-num">2</div>
                                    Chapters
                                </div>
                                <span className="bms-step-arrow">›</span>
                                <div className="bms-step active">
                                    <div className="bms-step-num">3</div>
                                    Assign Editors
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Title details ── */}
                        <div>
                            <div className="bms-form-divider">
                                <div className="bms-form-divider-line"></div>
                                <div className="bms-form-divider-label">Title Details</div>
                                <div className="bms-form-divider-line"></div>
                            </div>
                        </div>

                        <div className="bms-field-row">
                            <div className="bms-field" style={{ flex: 2 }}>
                                <label>Book Title <span className="req">*</span></label>
                                <input
                                    className={`bms-input ${formError ? 'error' : ''}`}
                                    value={formTitle}
                                    onChange={(e) => { setFormTitle(e.target.value); setFormError(''); }}
                                    placeholder="Enter the full book title"
                                />
                                {formError && <span className="bms-field-error">{formError}</span>}
                            </div>
                            {editMode && (
                                <div className="bms-field" style={{ flex: 'none', minWidth: 120 }}>
                                    <label>Status</label>
                                    <select
                                        className="bms-input bms-select"
                                        value={formActive ? 'active' : 'inactive'}
                                        onChange={(e) => setFormActive(e.target.value === 'active')}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* ── Step 2: Chapters (create only) ── */}
                        {!editMode && (
                            <>
                                <div className="bms-form-divider">
                                    <div className="bms-form-divider-line"></div>
                                    <div className="bms-form-divider-label">Chapters ({chapterDrafts.length})</div>
                                    <div className="bms-form-divider-line"></div>
                                </div>

                                <div className="bms-chapters-builder">
                                    <div className="bms-chapters-builder-head">
                                        <span>Chapter List</span>
                                        <span className="bms-field-hint" style={{ fontStyle: 'italic', fontSize: 11 }}>
                                            Drag rows to reorder
                                        </span>
                                    </div>

                                    {chapterDrafts.map((ch, idx) => (
                                        <div
                                            key={ch.tempId}
                                            className={`bms-chapter-entry ${dragIdx === idx ? 'dragging' : ''}`}
                                            draggable
                                            onDragStart={() => setDragIdx(idx)}
                                            onDragOver={(e) => draftDragOver(e, idx)}
                                            onDragEnd={() => setDragIdx(null)}
                                        >
                                            <span className="chapter-drag">&#8942;&#8942;</span>
                                            <div className="chapter-num-badge">{ch.chapterNumber}</div>
                                            <span className="chapter-entry-name">{ch.chapterTitle}</span>
                                            <button className="btn-icon-sq danger" onClick={() => removeChapterDraft(ch.tempId)} title="Remove">&#10005;</button>
                                        </div>
                                    ))}

                                    {chapterDrafts.length === 0 && (
                                        <div style={{ padding: '0.6rem 0.75rem', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            No chapters added yet — add below
                                        </div>
                                    )}

                                    <div className="bms-chapter-add-row">
                                        <input
                                            ref={chapterInputRef}
                                            className="bms-input"
                                            placeholder="New chapter title..."
                                            value={newChapterTitle}
                                            onChange={(e) => setNewChapterTitle(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChapterDraft(); } }}
                                        />
                                        <button className="btn btn-outline btn-sm" onClick={addChapterDraft}>+ Add</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Step 3: Assign Editors (create only) ── */}
                        {!editMode && (
                            <>
                                <div className="bms-form-divider">
                                    <div className="bms-form-divider-line"></div>
                                    <div className="bms-form-divider-label">
                                        Assign Editors ({selectedEditorIds.length} selected)
                                    </div>
                                    <div className="bms-form-divider-line"></div>
                                </div>

                                <div className="bms-editors-picker">
                                    <div className="bms-editors-picker-head">
                                        <span>Available Editors</span>
                                        <input
                                            className="bms-input"
                                            style={{ maxWidth: 180, fontSize: 12, padding: '0.3rem 0.55rem' }}
                                            placeholder="Search..."
                                            value={editorSearch}
                                            onChange={(e) => setEditorSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="bms-editor-list-scroll">
                                        {filteredEditors.length === 0 ? (
                                            <div style={{ padding: '0.65rem 0.75rem', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                No editors found
                                            </div>
                                        ) : filteredEditors.map((ed) => (
                                            <div
                                                key={ed.id}
                                                className={`bms-editor-item ${selectedEditorIds.includes(ed.id) ? 'selected' : ''}`}
                                                onClick={() => toggleEditor(ed.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEditorIds.includes(ed.id)}
                                                    readOnly
                                                />
                                                <div className="bms-editor-info">
                                                    <strong>{ed.fullName}</strong>
                                                    <span>{ed.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Form actions ── */}
                        <div className="bms-form-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                            <button className="btn btn-navy btn-sm" onClick={handleSubmit} disabled={saving}>
                                {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Register Title'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="bms-toolbar">
                <div className="bms-search">
                    <span className="bms-search-icon">&#128269;</span>
                    <input
                        placeholder="Search titles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="bms-spinner" />
            ) : bookTitles.length === 0 ? (
                <div className="bms-empty">
                    <div className="bms-empty-icon">&#128218;</div>
                    <p>No book titles found in the register.</p>
                    <button className="btn btn-navy btn-sm" onClick={openCreate}>Register your first title</button>
                </div>
            ) : (
                <div className="bms-table-wrap">
                    <table className="bms-table">
                        <thead>
                            <tr>
                                <th style={{ width: 32 }}>#</th>
                                <th>Title</th>
                                <th>Chapters</th>
                                <th>Editors</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookTitles.map((t, idx) => (
                                <tr key={t.id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--ff-body)', fontSize: 14 }}>
                                            {t.title}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => onManageChapters({ id: t.id, title: t.title })}
                                            title="Manage chapters"
                                        >
                                            &#128214; {t.chapterCount || 0}
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => onManageEditors({ id: t.id, title: t.title })}
                                            title="Manage editors"
                                        >
                                            &#128100; {t.editorCount || 0}
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${t.isActive ? 'active' : 'inactive'}`}>
                                            {t.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                            <button className="btn-icon-sq" onClick={() => openEdit(t)} title="Edit title">&#9998;</button>
                                            <button className="btn-icon-sq" onClick={() => onManageChapters({ id: t.id, title: t.title })} title="Manage chapters">&#128214;</button>
                                            <button className="btn-icon-sq" onClick={() => onManageEditors({ id: t.id, title: t.title })} title="Manage editors">&#128100;</button>
                                            <button
                                                className="btn-icon-sq"
                                                onClick={() => toggleActive(t)}
                                                title={t.isActive ? 'Deactivate' : 'Activate'}
                                                style={{ fontSize: 16, color: t.isActive ? '#16a34a' : '#dc2626' }}
                                            >
                                                {t.isActive ? '●' : '●'}
                                            </button>
                                            <button className="btn-icon-sq danger" onClick={(e) => { e.stopPropagation(); doDelete(t); }} title="Delete">&#128465;</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}