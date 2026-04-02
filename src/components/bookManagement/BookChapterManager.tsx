import { useState, useEffect, useRef } from 'react';
import bookManagementService, { type BookChapter } from '../../services/bookManagement.service';
import type { ToastMsg, BookTitleNav } from './BookManagement';

// ─── Chapter status pill helper ───────────────────────────────────────────────
function getChapterStatusPill(ch: BookChapter): { label: string; cls: string } {
    // 1. Explicit Published/Ready flags from the book_chapters table
    if (ch.isPublished) return { label: '✓ Published', cls: 'published' };
    if (ch.isReadyForPublication) return { label: '● Ready for Pub', cls: 'ready' };

    // 2. Submission-level status field (now supported by backend)
    const sub = ((ch as any).submissionStatus as string || '').toUpperCase();

    if (sub === 'PUBLICATION_IN_PROGRESS') return { label: '● Pub In Progress', cls: 'ready' };
    if (sub === 'ISBN_APPLIED' || sub === 'IN_PROGRESS') return { label: '● In Progress', cls: 'ready' }; // Proofing stage
    if (sub === 'APPROVED' || sub === 'CHAPTER_APPROVED') return { label: '✓ Approved', cls: 'approved' };
    if (sub === 'REJECTED' || sub === 'CHAPTER_REJECTED') return { label: '✗ Rejected', cls: 'rejected' };
    if (['UNDER_REVIEW', 'EDITORIAL_REVIEW', 'REVIEWER_ASSIGNMENT', 'ABSTRACT_SUBMITTED', 'MANUSCRIPTS_PENDING'].includes(sub)) {
        return { label: '🔄 Under Review', cls: 'under-review' };
    }

    return { label: '— Draft', cls: 'draft' };
}

interface Props {
    bookTitle: BookTitleNav;
    addToast: (type: ToastMsg['type'], message: string) => void;
    onBack: () => void;
}

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

export default function BookChapterManager({ bookTitle, addToast, onBack }: Props) {
    const [chapters, setChapters] = useState<BookChapter[]>([]);
    const [loading, setLoading] = useState(true);

    /* inline add */
    const [addTitle, setAddTitle] = useState('');
    const [addSaving, setAddSaving] = useState(false);
    const addRef = useRef<HTMLInputElement>(null);

    /* inline edit (per row) */
    const [editId, setEditId] = useState<number | null>(null);
    const [editVal, setEditVal] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    /* drag-reorder */
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const [reorderSaving, setReorderSaving] = useState(false);

    /* confirm */
    const [confirm, setConfirm] = useState<{ msg: string; action: () => void } | null>(null);

    useEffect(() => { fetchChapters(); }, [bookTitle.id]);

    const fetchChapters = async () => {
        try {
            setLoading(true);
            const r = await bookManagementService.bookChapter.getChaptersByBookTitle(bookTitle.id);
            if (r.success && r.data?.chapters) {
                setChapters(r.data.chapters);
            }
        } catch (e: any) {
            addToast('error', e.message || 'Failed to load chapters');
        } finally {
            setLoading(false);
        }
    };

    /* ── Add ── */
    const handleAdd = async () => {
        const val = addTitle.trim();
        if (!val) return;
        try {
            setAddSaving(true);
            await bookManagementService.bookChapter.createBookChapter({
                bookTitleId: bookTitle.id,
                chapterTitle: val,
                chapterNumber: chapters.length + 1,
            });
            addToast('success', `Chapter "${val}" added.`);
            setAddTitle('');
            fetchChapters();
            addRef.current?.focus();
        } catch (e: any) {
            console.error('Failed to add chapter:', e);
            addToast('error', e.error || e.message || 'Failed to add chapter');
        } finally {
            setAddSaving(false);
        }
    };

    /* ── Edit ── */
    const startEdit = (ch: BookChapter) => {
        setEditId(ch.id);
        setEditVal(ch.chapterTitle);
    };

    const cancelEdit = () => { setEditId(null); setEditVal(''); };

    const saveEdit = async (ch: BookChapter) => {
        const val = editVal.trim();
        if (!val) return;
        try {
            setEditSaving(true);
            await bookManagementService.bookChapter.updateBookChapter(ch.id, { chapterTitle: val });
            addToast('success', 'Chapter updated.');
            cancelEdit();
            fetchChapters();
        } catch (e: any) {
            addToast('error', e.message || 'Update failed');
        } finally {
            setEditSaving(false);
        }
    };

    /* ── Delete ── */
    const doDelete = (ch: BookChapter) => {
        setConfirm({
            msg: `Remove chapter "${ch.chapterTitle}"? This action cannot be undone.`,
            action: async () => {
                setConfirm(null);
                try {
                    await bookManagementService.bookChapter.deleteBookChapter(ch.id);
                    addToast('success', 'Chapter removed.');
                    fetchChapters();
                } catch (e: any) {
                    addToast('error', e.message || 'Delete failed');
                }
            },
        });
    };

    /* ── Drag-and-drop reorder ── */
    const onDragStart = (idx: number) => {
        setDragIdx(idx);
        setDragOverIdx(idx);
    };

    const onDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) { setDragOverIdx(idx); return; }
        const arr = [...chapters];
        const moved = arr.splice(dragIdx, 1)[0];
        arr.splice(idx, 0, moved);
        setChapters(arr.map((c, i) => ({ ...c, chapterNumber: i + 1 })));
        setDragIdx(idx);
        setDragOverIdx(idx);
    };

    const onDragEnd = async () => {
        setDragIdx(null);
        setDragOverIdx(null);
        /* persist reorder */
        const payload = chapters.map((c, i) => ({ id: c.id, chapterNumber: i + 1 }));
        try {
            setReorderSaving(true);
            await bookManagementService.bookChapter.reorderChapters(bookTitle.id, payload);
            addToast('success', 'Chapter order saved.');
        } catch (e: any) {
            addToast('error', e.message || 'Reorder failed — please try again');
            fetchChapters(); /* revert */
        } finally {
            setReorderSaving(false);
        }
    };

    /* ── Move up / move down ── */
    const moveChapter = async (idx: number, dir: -1 | 1) => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= chapters.length) return;
        const arr = [...chapters];
        const tmp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = tmp;
        const reordered = arr.map((c, i) => ({ ...c, chapterNumber: i + 1 }));
        setChapters(reordered);
        try {
            await bookManagementService.bookChapter.reorderChapters(bookTitle.id, reordered.map((c) => ({ id: c.id, chapterNumber: c.chapterNumber })));
            addToast('success', 'Order updated.');
        } catch (e: any) {
            addToast('error', 'Reorder failed.');
            fetchChapters();
        }
    };

    return (
        <>
            {confirm && <ConfirmDialog message={confirm.msg} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}

            {/* Breadcrumb */}
            <div className="bms-breadcrumb">
                <button onClick={onBack}>Book Titles</button>
                <span className="sep">›</span>
                <span className="current">{bookTitle.title}</span>
                <span className="sep">›</span>
                <span className="current">Chapters</span>
            </div>

            {/* Section header */}
            <div className="bms-section-header">
                <div>
                    <h2>Chapter Management</h2>
                    <div className="bms-section-header-sub">{bookTitle.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {reorderSaving && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Saving order...</span>}
                    <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
                </div>
            </div>

            {/* Stats */}
            <div className="bms-stats-strip">
                <div className="bms-stat-card">
                    <div className="stat-num">{chapters.length}</div>
                    <div className="stat-label">Total Chapters</div>
                </div>
                <div className="bms-stat-card">
                    <div className="stat-num" style={{ color: '#059669' }}>{chapters.filter(c => c.isPublished).length}</div>
                    <div className="stat-label">Published</div>
                </div>
                <div className="bms-stat-card">
                    <div className="stat-num" style={{ color: '#0ea5e9' }}>
                        {chapters.filter(c => c.isReadyForPublication || c.submissionStatus === 'PUBLICATION_IN_PROGRESS' && !c.isPublished).length}
                    </div>
                    <div className="stat-label">Ready (Pending Pub)</div>
                </div>
                <div className="bms-stat-card">
                    <div className="stat-num" style={{ color: '#d97706' }}>
                        {chapters.filter(c => !c.isPublished && !c.isReadyForPublication && c.submissionStatus !== 'PUBLICATION_IN_PROGRESS').length}
                    </div>
                    <div className="stat-label">Draft / Under Review</div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bms-spinner" />
            ) : (
                <div className="bms-table-wrap" style={{ marginBottom: '0.75rem' }}>
                    <table className="bms-table">
                        <thead>
                            <tr>
                                <th style={{ width: 32 }}></th>
                                <th style={{ width: 48 }}>No.</th>
                                <th>Chapter Title</th>
                                <th style={{ width: 160 }}>Status</th>
                                <th style={{ textAlign: 'right', width: 160 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chapters.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="bms-empty">
                                            <div className="bms-empty-icon">📖</div>
                                            <p>No chapters recorded yet — add one below.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : chapters.map((ch, idx) => (
                                <tr
                                    key={ch.id}
                                    className={dragIdx === idx ? 'dragging' : dragOverIdx === idx ? 'drag-over' : ''}
                                    draggable
                                    onDragStart={() => onDragStart(idx)}
                                    onDragOver={(e) => onDragOver(e, idx)}
                                    onDragEnd={onDragEnd}
                                >
                                    {/* drag handle */}
                                    <td className="drag-col" title="Drag to reorder">⋮⋮</td>

                                    {/* number */}
                                    <td>
                                        <div className="order-badge">{ch.chapterNumber || idx + 1}</div>
                                    </td>

                                    {/* title — inline editable */}
                                    <td>
                                        {editId === ch.id ? (
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <input
                                                    className="bms-input"
                                                    style={{ fontSize: 13, padding: '0.3rem 0.55rem', flex: 1 }}
                                                    value={editVal}
                                                    autoFocus
                                                    onChange={(e) => setEditVal(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEdit(ch);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                                <button className="btn btn-navy btn-xs" onClick={() => saveEdit(ch)} disabled={editSaving}>
                                                    {editSaving ? '...' : '✓'}
                                                </button>
                                                <button className="btn btn-ghost btn-xs" onClick={cancelEdit}>✕</button>
                                            </div>
                                        ) : (
                                            <span
                                                className={ch.isPublished ? 'chapter-published-title' : ''}
                                                style={{ fontFamily: 'var(--ff-body)', fontSize: 14, color: ch.isPublished ? 'var(--text-muted, #9ca3af)' : 'var(--text-main)' }}
                                            >
                                                {ch.chapterTitle}
                                            </span>
                                        )}
                                    </td>

                                    {/* status pill */}
                                    <td>
                                        {(() => {
                                            const { label, cls } = getChapterStatusPill(ch);
                                            return <span className={`ch-status-pill ${cls}`}>{label}</span>;
                                        })()}
                                    </td>

                                    {/* actions */}
                                    <td className="actions">
                                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                                            <button className="btn-icon-sq" onClick={() => moveChapter(idx, -1)} disabled={idx === 0} title="Move up">↑</button>
                                            <button className="btn-icon-sq" onClick={() => moveChapter(idx, 1)} disabled={idx === chapters.length - 1} title="Move down">↓</button>
                                            <button className="btn-icon-sq" onClick={() => startEdit(ch)} title="Edit">✎</button>
                                            <button className="btn-icon-sq danger" onClick={() => doDelete(ch)} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Add chapter row ── */}
            <div className="bms-form-panel">
                <div className="bms-form-panel-head">
                    <h3>Add New Chapter</h3>
                </div>
                <div className="bms-form-panel-body" style={{ gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <input
                            ref={addRef}
                            className="bms-input"
                            style={{ flex: 1, minWidth: 200 }}
                            placeholder="Enter chapter title..."
                            value={addTitle}
                            onChange={(e) => setAddTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                        />
                        <button className="btn btn-navy btn-sm" onClick={handleAdd} disabled={addSaving || !addTitle.trim()}>
                            {addSaving ? 'Adding...' : '+ Add Chapter'}
                        </button>
                    </div>
                    <span className="bms-field-hint">Press Enter or click Add. Drag rows in the table above to reorder.</span>
                </div>
            </div>
        </>
    );
}