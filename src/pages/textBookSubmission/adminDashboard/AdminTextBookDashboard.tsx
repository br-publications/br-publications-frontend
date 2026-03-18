import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAdminTextBookSubmissions } from '../../../utils/textBookSubmission.hooks';
import AdminTextBookCard from './AdminTextBookCard';
import { CardSkeleton } from '../../bookChapterSubmission/common/ui/skeletons';
import TextBookDetailView from '../common/TextBookDetailView';
import type { TextBookSubmission, TextBookStats, TextBookStatus } from '../types/textBookTypes';
import * as textBookService from '../../../services/textBookService';
import AlertPopup from '../../../components/common/alertPopup';

const TABS = [
    { id: 'new', label: 'New', status: 'INITIAL_SUBMITTED' },
    { id: 'review', label: 'Under Review', status: 'PROPOSAL_UNDER_REVIEW,REVISION_REQUESTED,REVISION_SUBMITTED,PROPOSAL_ACCEPTED' },
    { id: 'processing', label: 'Processing', status: 'SUBMISSION_ACCEPTED,ISBN_APPLIED,ISBN_RECEIVED,AWAITING_DELIVERY_DETAILS,DELIVERY_ADDRESS_RECEIVED,PUBLICATION_IN_PROGRESS' },
    { id: 'completed', label: 'Completed', status: 'SUBMISSION_REJECTED,PROPOSAL_REJECTED,PUBLISHED,WITHDRAWN' },
    { id: 'bulk', label: 'Bulk Uploads', status: '' },
    { id: 'all', label: 'All', status: '' }
];

const AdminTextBookDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('new');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedSubmission, setSelectedSubmission] = useState<TextBookSubmission | null>(null);
    const [stats, setStats] = useState<TextBookStats | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        setAlertConfig({
            isOpen: true,
            type,
            title,
            message
        });
    };

    // Get status for current tab
    const currentTab = TABS.find(t => t.id === activeTab);
    const statusFilter = currentTab?.status;

    const { submissions, isLoading, error, refetch, pagination } = useAdminTextBookSubmissions(page, 50, {
        status: statusFilter,
        search: searchQuery,
        isBulkSubmission: currentTab?.id === 'bulk' ? true : undefined,
        showAll: currentTab?.id === 'all'
    });

    // Fetch stats
    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await textBookService.getSubmissionStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };
        fetchStats();
    }, [submissions]); // Re-fetch stats when submissions change (e.g. after an action)

    // Handle deep linking to specific submission
    useEffect(() => {
        const submissionId = searchParams.get('submissionId');
        if (submissionId && !selectedSubmission) {
            const loadSubmission = async () => {
                try {
                    const id = parseInt(submissionId);
                    if (!isNaN(id)) {
                        const data = await textBookService.getSubmissionById(id);
                        setSelectedSubmission(data);
                    }
                } catch (error) {
                    console.error('Failed to load linked submission:', error);
                }
            };
            loadSubmission();
        }
    }, [searchParams]);

    // Sync selectedSubmission when submissions list updates
    React.useEffect(() => {
        if (selectedSubmission) {
            const updated = submissions.find(s => s.id === selectedSubmission.id);
            if (updated) {
                setSelectedSubmission(updated);
            }
        }
    }, [submissions]);


    const handleViewDetails = (submission: TextBookSubmission) => {
        setSelectedSubmission(submission);
        setSearchParams({ submissionId: submission.id.toString() });
    };

    const getTabCount = (tabId: string, statusString: string): number => {
        if (!stats) return 0;
        if (tabId === 'all') return stats.aggregated.all;
        if (tabId === 'bulk') return stats.aggregated.bulk || 0;

        const statuses = statusString.split(',');
        return statuses.reduce((acc, status) => {
            return acc + (stats.byStatus[status as TextBookStatus] || 0);
        }, 0);
    };

    const handleRefresh = async () => {
        await refetch();
        if (selectedSubmission) {
            try {
                const fresh = await textBookService.getSubmissionById(selectedSubmission.id);
                setSelectedSubmission(fresh);
            } catch (err) {
                console.error('Failed to refresh details:', err);
                showAlert('error', 'Error', 'Failed to refresh submission details');
            }
        }
    };


    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-base font-bold text-gray-800">Text Book Submissions</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/dashboard/admin/textbooks/bulk-upload')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/admin/book-publishing')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Direct Publish
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => { setActiveTab(tab.id); setPage(1); }}
                    >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {getTabCount(tab.id, tab.status)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid gap-3">
                {isLoading ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : error ? (
                    <div className="text-center p-6 bg-white rounded-lg border border-red-200 text-red-600">
                        {error}
                        <button onClick={refetch} className="ml-4 underline text-sm">Retry</button>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-lg border border-gray-200 text-gray-500">
                        No submissions found in this category.
                    </div>
                ) : (
                    submissions.map(submission => (
                        <AdminTextBookCard
                            key={submission.id}
                            submission={submission}
                            onViewDetails={handleViewDetails}
                        />
                    ))
                )}
            </div>

            {/* Pagination Control */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page <span className="font-semibold text-gray-900">{pagination.currentPage}</span> of <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                    </span>
                    <button
                        disabled={pagination.currentPage === pagination.totalPages}
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Detail View Modal */}
            {selectedSubmission && (
                <TextBookDetailView
                    submission={selectedSubmission}
                    onClose={() => {
                        setSelectedSubmission(null);
                        setSearchParams({});
                    }}
                    userRole="admin"
                    onRefresh={handleRefresh}
                />
            )}

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AdminTextBookDashboard;
