import { useState, useEffect } from 'react';
import bookManagementService from '../../services/bookManagement.service';
import { userService, type UserServiceUser as User } from '../../services';
import type { ToastMsg, BookTitleNav } from './BookManagement';

interface Props {
    bookTitle: BookTitleNav;
    addToast: (type: ToastMsg['type'], message: string) => void;
    onBack: () => void;
}

interface AssignedEditor {
    id: number;
    assignedAt: string;
    isPrimary: boolean;
    editor?: {
        id: number;
        fullName: string;
        email: string;
    };
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

export default function EditorAssignmentManager({ bookTitle, addToast, onBack }: Props) {
    const [assigned, setAssigned] = useState<AssignedEditor[]>([]);
    const [available, setAvailable] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    /* assign panel */
    const [showAssign, setShowAssign] = useState(false);
    const [assignSearch, setAssignSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [assignSaving, setAssignSaving] = useState(false);

    /* assigned table search */
    const [tableSearch, setTableSearch] = useState('');

    /* confirm */
    const [confirm, setConfirm] = useState<{ msg: string; action: () => void } | null>(null);

    useEffect(() => {
        fetchAssigned();
        fetchAvailable();
    }, [bookTitle.id]);

    const fetchAssigned = async () => {
        try {
            setLoading(true);
            const r = await bookManagementService.bookEditor.getEditorsByBookTitle(bookTitle.id);
            if (r.success && r.data?.editors) setAssigned(r.data.editors);
        } catch (e: any) {
            addToast('error', e.message || 'Failed to load editors');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailable = async () => {
        try {
            const r = await userService.getAllUsers({ role: 'editor', page: 1, limit: 200 });
            if (r.success && r.data?.users) setAvailable(r.data.users);
        } catch { /* silent */ }
    };

    /* ── Assign ── */
    const handleAssign = async () => {
        if (selectedIds.length === 0) return;
        try {
            setAssignSaving(true);
            const r = await bookManagementService.bookEditor.bulkAssignEditors(bookTitle.id, selectedIds);
            const ok = r.data?.successful?.length || 0;
            const bad = r.data?.failed?.length || 0;
            if (ok > 0) addToast('success', `${ok} editor${ok > 1 ? 's' : ''} assigned.`);
            if (bad > 0) addToast('warn', `${bad} assignment${bad > 1 ? 's' : ''} failed.`);
            setShowAssign(false);
            setSelectedIds([]);
            setAssignSearch('');
            fetchAssigned();
        } catch (e: any) {
            addToast('error', e.message || 'Assignment failed');
        } finally {
            setAssignSaving(false);
        }
    };

    /* ── Remove ── */
    const doRemove = (ae: AssignedEditor) => {
        const name = ae.editor?.fullName || 'this editor';
        setConfirm({
            msg: `Rescind the assignment of "${name}" from this title?`,
            action: async () => {
                setConfirm(null);
                try {
                    await bookManagementService.bookEditor.removeEditorAssignment(ae.id);
                    addToast('success', `${name} removed from assignment.`);
                    fetchAssigned();
                } catch (e: any) {
                    addToast('error', e.message || 'Remove failed');
                }
            },
        });
    };

    /* ── Bulk remove ── */
    const [bulkSelected, setBulkSelected] = useState<number[]>([]);

    const toggleBulk = (id: number) => {
        setBulkSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    };

    const handleBulkRemove = () => {
        if (bulkSelected.length === 0) return;
        setConfirm({
            msg: `Rescind assignments for ${bulkSelected.length} selected editor(s)?`,
            action: async () => {
                setConfirm(null);
                let removed = 0;
                for (const assignId of bulkSelected) {
                    try {
                        await bookManagementService.bookEditor.removeEditorAssignment(assignId);
                        removed++;
                    } catch { /* continue */ }
                }
                addToast('success', `${removed} assignment(s) removed.`);
                setBulkSelected([]);
                fetchAssigned();
            },
        });
    };

    const handleSetPrimary = async (ae: AssignedEditor) => {
        try {
            await bookManagementService.bookEditor.setPrimaryEditor(bookTitle.id, ae.editor!.id);
            addToast('success', `${ae.editor?.fullName} set as primary editor.`);
            fetchAssigned();
        } catch (e: any) {
            addToast('error', e.message || 'Failed to set primary editor');
        }
    };

    const assignedEditorIds = assigned.map((ae) => ae.editor?.id);
    const unassigned = available.filter(
        (e) => !assignedEditorIds.includes(e.id) &&
            (e.fullName.toLowerCase().includes(assignSearch.toLowerCase()) ||
                e.email.toLowerCase().includes(assignSearch.toLowerCase()))
    );

    const filteredAssigned = assigned.filter(
        (ae) =>
            !tableSearch ||
            ae.editor?.fullName?.toLowerCase().includes(tableSearch.toLowerCase()) ||
            ae.editor?.email?.toLowerCase().includes(tableSearch.toLowerCase())
    );

    const allBulkSelected = filteredAssigned.length > 0 && filteredAssigned.every((ae) => bulkSelected.includes(ae.id));

    const toggleAllBulk = () => {
        if (allBulkSelected) {
            setBulkSelected([]);
        } else {
            setBulkSelected(filteredAssigned.map((ae) => ae.id));
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
                <span className="current">Editors</span>
            </div>

            {/* Section header */}
            <div className="bms-section-header">
                <div>
                    <h2>Editor Assignments</h2>
                    <div className="bms-section-header-sub">{bookTitle.title}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {bulkSelected.length > 0 && (
                        <button className="btn btn-danger btn-sm" onClick={handleBulkRemove}>
                            Remove Selected ({bulkSelected.length})
                        </button>
                    )}
                    <button className="btn btn-navy btn-sm" onClick={() => setShowAssign((p) => !p)}>
                        {showAssign ? 'Cancel' : '+ Assign Editors'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
                </div>
            </div>

            {/* Stats */}
            <div className="bms-stats-strip">
                <div className="bms-stat-card">
                    <div className="stat-num">{assigned.length}</div>
                    <div className="stat-label">Assigned</div>
                </div>
                <div className="bms-stat-card">
                    <div className="stat-num">{available.length - assigned.length}</div>
                    <div className="stat-label">Available</div>
                </div>
            </div>

            {/* ── Assign panel ── */}
            {showAssign && (
                <div className="bms-form-panel" style={{ marginBottom: '1rem' }}>
                    <div className="bms-form-panel-head">
                        <h3>Assign Editors to "{bookTitle.title}"</h3>
                        <button className="bms-form-panel-close" onClick={() => { setShowAssign(false); setSelectedIds([]); setAssignSearch(''); }}>✕</button>
                    </div>
                    <div className="bms-form-panel-body" style={{ gap: '0.75rem' }}>
                        <div className="bms-editors-picker">
                            <div className="bms-editors-picker-head">
                                <span>
                                    Available Editors
                                    {selectedIds.length > 0 && <span style={{ marginLeft: 6, color: 'var(--navy)', fontSize: 11 }}>({selectedIds.length} selected)</span>}
                                </span>
                                <input
                                    className="bms-input"
                                    style={{ maxWidth: 180, fontSize: 12, padding: '0.3rem 0.55rem' }}
                                    placeholder="Search..."
                                    value={assignSearch}
                                    onChange={(e) => setAssignSearch(e.target.value)}
                                />
                            </div>
                            <div className="bms-editor-list-scroll">
                                {unassigned.length === 0 ? (
                                    <div style={{ padding: '0.65rem 0.75rem', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        All available editors are already assigned.
                                    </div>
                                ) : unassigned.map((ed) => (
                                    <div
                                        key={ed.id}
                                        className={`bms-editor-item ${selectedIds.includes(ed.id) ? 'selected' : ''}`}
                                        onClick={() => setSelectedIds((p) => p.includes(ed.id) ? p.filter((x) => x !== ed.id) : [...p, ed.id])}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(ed.id)}
                                            onChange={() => { }}
                                        />
                                        <div className="bms-editor-info">
                                            <strong>{ed.fullName}</strong>
                                            <span>{ed.email}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bms-form-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => { setShowAssign(false); setSelectedIds([]); }}>Cancel</button>
                            <button
                                className="btn btn-navy btn-sm"
                                onClick={handleAssign}
                                disabled={selectedIds.length === 0 || assignSaving}
                            >
                                {assignSaving ? 'Assigning...' : `Assign (${selectedIds.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="bms-toolbar">
                <div className="bms-search">
                    <span className="bms-search-icon">🔍</span>
                    <input
                        placeholder="Search assigned editors..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="bms-spinner" />
            ) : (
                <div className="bms-table-wrap">
                    <table className="bms-table">
                        <thead>
                            <tr>
                                <th style={{ width: 32 }}>
                                    <input
                                        type="checkbox"
                                        checked={allBulkSelected}
                                        onChange={toggleAllBulk}
                                        style={{ accentColor: 'white', width: 14, height: 14, cursor: 'pointer' }}
                                    />
                                </th>
                                <th>#</th>
                                <th>Primary</th>
                                <th>Editor Name</th>
                                <th>Email</th>
                                <th>Date Assigned</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssigned.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="bms-empty">
                                            <div className="bms-empty-icon">👤</div>
                                            <p>No editors assigned to this title yet.</p>
                                            <button className="btn btn-navy btn-sm" onClick={() => setShowAssign(true)}>Assign first editor</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAssigned.map((ae, idx) => (
                                <tr key={ae.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={bulkSelected.includes(ae.id)}
                                            onChange={() => toggleBulk(ae.id)}
                                            style={{ accentColor: 'var(--navy)', width: 14, height: 14, cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                                    <td>
                                        {ae.isPrimary ? (
                                            <span className="badge-primary">Primary</span>
                                        ) : (
                                            <button 
                                                className="btn btn-ghost btn-xs" 
                                                onClick={() => handleSetPrimary(ae)}
                                                style={{ fontSize: 10, padding: '0.1rem 0.4rem' }}
                                            >
                                                Make Primary
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: 'var(--navy)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 700, flexShrink: 0,
                                                fontFamily: 'var(--ff-body)'
                                            }}>
                                                {ae.editor?.fullName?.charAt(0) || '?'}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--ff-body)' }}>
                                                {ae.editor?.fullName || '—'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-sub)', fontFamily: 'var(--ff-body)' }}>
                                        {ae.editor?.email || '—'}
                                    </td>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--ff-body)', fontStyle: 'italic' }}>
                                        {new Date(ae.assignedAt).toLocaleDateString('en-GB', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    <td className="actions">
                                        <button
                                            className="btn-icon-sq danger"
                                            onClick={() => doRemove(ae)}
                                            title="Rescind assignment"
                                        >
                                            🗑️
                                        </button>
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