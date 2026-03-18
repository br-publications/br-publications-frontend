import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    Edit, Trash2, Eye, EyeOff, Plus, RefreshCw,
    BookOpen, ChevronLeft, ChevronRight, Search, X, Upload
} from 'lucide-react';
import * as conferenceService from '../../../services/conference.service';
import type { Conference } from '../../../services/conference.service';
import AlertPopup from '../../../components/common/alertPopup';
import EditConferenceModal from './EditConferenceModal';
import ConferenceUploadWizard from '../ConferenceUploadWizard';

const ITEMS_PER_PAGE = 12;

const CONF_TYPES = [
    '', 'International Conference', 'National Conference', 'Symposium', 'Workshop', 'Seminar'
];

const ConferenceManager: React.FC = () => {
    const navigate = useNavigate();
    // ── Data ─────────────────────────────────────────────────
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // ── Filters ───────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // ── Modal States ──────────────────────────────────────────
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [uploadWizardOpen, setUploadWizardOpen] = useState(false);
    const [selectedConference, setSelectedConference] = useState<Conference | null>(null);

    // ── Alert ─────────────────────────────────────────────────
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        showCancel?: boolean;
        onConfirm?: () => void;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    // ── Debounce search ───────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 350);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // ── Load Data ─────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await conferenceService.getConferences({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                search: debouncedSearch || undefined,
            });
            // Client-side filter for type and status (service doesn't expose these params)
            let items = data.conferences;
            if (typeFilter) items = items.filter(c => c.type === typeFilter);
            if (statusFilter === 'active') items = items.filter(c => c.isActive);
            if (statusFilter === 'inactive') items = items.filter(c => !c.isActive);
            setConferences(items);
            setTotalPages(data.pagination.totalPages);
            setTotalItems(data.pagination.total);
        } catch (e) {
            toast.error('Failed to load conferences');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, typeFilter, statusFilter, refreshKey]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Helpers ───────────────────────────────────────────────
    const showAlert = (
        type: 'success' | 'error' | 'warning' | 'info',
        title: string,
        message: string,
        showCancel = false,
        onConfirm?: () => void
    ) => setAlertConfig({ isOpen: true, type, title, message, showCancel, onConfirm });

    const refresh = () => setRefreshKey(k => k + 1);

    // ── Actions ───────────────────────────────────────────────
    const handleToggleActive = async (conf: Conference) => {
        try {
            await conferenceService.updateConference(conf.id, { isActive: !conf.isActive });
            toast.success(`Conference is now ${!conf.isActive ? 'active (visible)' : 'inactive (hidden)'}`);
            refresh();
        } catch {
            toast.error('Failed to update visibility');
        }
    };

    const confirmDelete = async (conf: Conference) => {
        try {
            await conferenceService.deleteConference(conf.id);
            toast.success('Conference deactivated successfully');
            refresh();
        } catch {
            toast.error('Failed to delete conference');
        }
    };

    const handleDelete = (conf: Conference) => {
        showAlert('warning', 'Deactivate Conference',
            `Are you sure you want to deactivate "${conf.title}"? It will be hidden from all public pages.`,
            true, () => confirmDelete(conf));
    };

    const openEdit = (conf: Conference) => {
        setSelectedConference(conf);
        setEditModalOpen(true);
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-[14px] font-bold text-gray-900">Conference Manager</h1>
                    <p className="text-gray-500 text-[12px] mt-0.5">Manage all published conferences and their articles</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium text-[12px] flex items-center gap-1.5">
                        <BookOpen size={14} />
                        Total: {totalItems}
                    </div>
                    <button
                        onClick={refresh}
                        className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/admin/conferences/bulk-upload')}
                        className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-green-700 transition-colors"
                    >
                        <Upload size={14} />
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => setUploadWizardOpen(true)}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={14} />
                        New Conference
                    </button>
                </div>
            </div>

            {/* ── Filters bar ── */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-2 items-center">
                {/* Search */}
                <div className="flex-1 min-w-[180px] relative">
                    <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search title, publisher, location…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-7 py-1.5 border rounded-md text-[12px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Type filter */}
                <select
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                    className="border rounded-md px-2 py-1.5 text-[12px] focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Types</option>
                    {CONF_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {/* Visibility filter */}
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                    className="border rounded-md px-2 py-1.5 text-[12px] focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>

                {/* Clear filters */}
                {(searchTerm || typeFilter || statusFilter !== 'all') && (
                    <button
                        onClick={() => { setSearchTerm(''); setTypeFilter(''); setStatusFilter('all'); setCurrentPage(1); }}
                        className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1.5"
                    >
                        <X size={11} /> Clear
                    </button>
                )}
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-2.5 font-semibold text-gray-500 w-8">#</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500">Conference</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500">Type</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500 text-center">Articles</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500">Date</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500">Status</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-[12px]">
                                        Loading conferences…
                                    </td>
                                </tr>
                            ) : conferences.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-[12px]">
                                        No conferences found. Adjust filters or upload one.
                                    </td>
                                </tr>
                            ) : (
                                conferences.map((conf, idx) => (
                                    <tr key={conf.id} className="hover:bg-gray-50 transition-colors">
                                        {/* # */}
                                        <td className="px-4 py-2.5 text-gray-400 font-mono text-[10px]">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                        </td>

                                        {/* Conference info */}
                                        <td className="px-4 py-2.5 max-w-[320px]">
                                            <div className="font-semibold text-gray-900 line-clamp-2 text-[12px] leading-tight mb-0.5">
                                                {conf.title}
                                            </div>
                                            <div className="text-gray-400 text-[10px] flex flex-wrap gap-x-3 gap-y-0.5">
                                                <span>📢 {conf.publisher}</span>
                                                {conf.location && <span>📍 {conf.location}</span>}
                                                {conf.issn && <span>ISSN: {conf.issn}</span>}
                                                {conf.doi && <span className="font-mono">DOI: {conf.doi}</span>}
                                                {conf.code && <span className="font-mono bg-gray-100 px-1 rounded">{conf.code}</span>}
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 whitespace-nowrap">
                                                {conf.type || '—'}
                                            </span>
                                        </td>

                                        {/* Articles count */}
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="font-bold text-blue-700">{conf.articleCount}</span>
                                            <span className="text-gray-400 text-[10px] block">articles</span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-2.5 text-[10px] text-gray-500">
                                            {conf.publishedDate || conf.dateRange || '—'}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${conf.isActive
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                {conf.isActive ? '● Active' : '○ Inactive'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Toggle Active */}
                                                <button
                                                    onClick={() => handleToggleActive(conf)}
                                                    className={`p-1.5 rounded transition-colors ${conf.isActive
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                    title={conf.isActive ? 'Hide (Deactivate)' : 'Make Visible'}
                                                >
                                                    {conf.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEdit(conf)}
                                                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors"
                                                    title="Edit Conference & Articles"
                                                >
                                                    <Edit size={15} />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(conf)}
                                                    className="p-1.5 rounded text-red-400 hover:bg-red-50 transition-colors"
                                                    title="Deactivate Conference"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {!loading && totalPages > 1 && (
                    <div className="border-t px-4 py-3 flex items-center justify-between text-[12px]">
                        <div className="text-gray-500">
                            Page {currentPage} of {totalPages} &mdash; {totalItems} total
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="p-1.5 border rounded disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`px-2.5 py-1 border rounded text-[11px] transition-colors ${currentPage === p
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="p-1.5 border rounded disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {selectedConference && (
                <EditConferenceModal
                    conference={selectedConference}
                    isOpen={editModalOpen}
                    onClose={() => { setEditModalOpen(false); setSelectedConference(null); }}
                    onSuccess={() => { setEditModalOpen(false); setSelectedConference(null); refresh(); }}
                />
            )}

            <ConferenceUploadWizard
                isOpen={uploadWizardOpen}
                onClose={() => setUploadWizardOpen(false)}
                onSuccess={() => { setUploadWizardOpen(false); refresh(); }}
            />

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                showCancel={alertConfig.showCancel}
                onConfirm={() => {
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                    setAlertConfig(p => ({ ...p, isOpen: false }));
                }}
                onClose={() => setAlertConfig(p => ({ ...p, isOpen: false }))}
            />
        </div>
    );
};

export default ConferenceManager;
