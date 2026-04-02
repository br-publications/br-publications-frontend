// Author Text Book Dashboard Component
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthorTextBookCard from '../cards/authorTextBookCard';
import TextBookDetailView from '../common/TextBookDetailView';
import {
    type TextBookSubmission,
    TextBookStatus,
    type TextBookFilters,
    type TextBookStats
} from '../types/textBookTypes';
import * as textBookService from '../../../services/textBookService';

type TabType = 'all' | 'new' | 'underReview' | 'approved' | 'rejected' | 'published';

const TAB_STATUS_MAP: Record<TabType, TextBookStatus[] | undefined> = {
    all: undefined,
    new: [TextBookStatus.INITIAL_SUBMITTED],
    underReview: [
        TextBookStatus.PROPOSAL_UNDER_REVIEW,
        TextBookStatus.REVISION_REQUESTED,
        TextBookStatus.REVISION_SUBMITTED,
        TextBookStatus.PROPOSAL_ACCEPTED
    ],
    approved: [
        TextBookStatus.SUBMISSION_ACCEPTED,
        TextBookStatus.ISBN_APPLIED,
        TextBookStatus.ISBN_RECEIVED,
        TextBookStatus.AWAITING_DELIVERY_DETAILS,
        TextBookStatus.DELIVERY_ADDRESS_RECEIVED,
        TextBookStatus.PUBLICATION_IN_PROGRESS
    ],
    rejected: [
        TextBookStatus.PROPOSAL_REJECTED,
        TextBookStatus.SUBMISSION_REJECTED
    ],
    published: [TextBookStatus.PUBLISHED]
};

export default function AuthorTextBookDashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [submissions, setSubmissions] = useState<TextBookSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<TextBookSubmission | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const [stats, setStats] = useState<TextBookStats | null>(null);

    // Fetch submissions and stats
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSubmissions();
        }, searchQuery ? 500 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [activeTab, currentPage, searchQuery]);

    useEffect(() => {
        fetchStats();
    }, [activeTab]);

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
    }, [searchParams]); // Only run when params change

    // Sync selectedSubmission when submissions list updates
    useEffect(() => {
        if (selectedSubmission) {
            const updated = submissions.find(s => s.id === selectedSubmission.id);
            if (updated) {
                setSelectedSubmission(updated);
            }
        }
    }, [submissions]);


    const fetchStats = async () => {
        try {
            const data = await textBookService.getSubmissionStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const filters: TextBookFilters = {
                status: TAB_STATUS_MAP[activeTab]?.join(','),
                search: searchQuery || undefined,
                page: currentPage,
                limit
            };

            const response = await textBookService.getMySubmissions(filters);
            setSubmissions(response.submissions);
            setTotalPages(response.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Use submissions directly (server-side filtered)
    const displaySubmissions = submissions;

    // Get tab counts
    const getTabCount = (tab: TabType): number => {
        if (!stats) return 0;

        // For 'all' tab, use the overall total from backend
        if (tab === 'all') return stats.aggregated.all || 0;

        // For other tabs, calculate count by summing up relevant statuses
        const statuses = TAB_STATUS_MAP[tab];
        if (!statuses) return 0;

        return statuses.reduce((sum, status) => {
            const count = stats.byStatus[status] || 0;
            return sum + count;
        }, 0);
    };

    const handleViewDetails = (submission: TextBookSubmission) => {
        setSelectedSubmission(submission);
        setSearchParams({ submissionId: submission.id.toString() });
    };

    const handleRefresh = async () => {
        await fetchSubmissions();
        await fetchStats();
        if (selectedSubmission) {
            try {
                const fresh = await textBookService.getSubmissionById(selectedSubmission.id);
                setSelectedSubmission(fresh);
            } catch (err) {
                console.error('Failed to refresh details:', err);
            }
        }
    };


    const handleNewSubmission = () => {
        navigate('/book-manuscript'); // Navigate to text book submission form
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-base font-bold text-gray-900">My Text Book Submissions</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage and track your text book submissions
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-4">
                        {(['all', 'new', 'underReview', 'approved', 'rejected', 'published'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setCurrentPage(1);
                                }}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab === 'underReview' ? 'Under review' : tab}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {getTabCount(tab)}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                {/* Search and Actions Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-3">
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                        {/* Search Input */}
                        <div className="flex-1 w-full md:max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by title, author, or ISBN..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* New Submission Button */}
                        <button
                            onClick={handleNewSubmission}
                            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Submit New Text Book
                        </button>
                    </div>
                </div>

                {/* Results Header */}
                <div className="mb-2">
                    <h2 className="text-sm font-semibold text-gray-800 capitalize">
                        {activeTab === 'all' ? 'All Submissions' :
                            activeTab === 'underReview' ? 'Under Review Submissions' :
                                `${activeTab} Submissions`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {loading ? 'Searching...' : `${displaySubmissions.length} results found on this page`}
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">Loading submissions...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && displaySubmissions.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <svg
                            className="w-16 h-16 mx-auto text-gray-300 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            {searchQuery ? 'No submissions found for your search' : 'No text book submissions yet'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Start by submitting your first text book'}
                        </p>
                    </div>
                )}

                {/* Submissions List */}
                {!loading && displaySubmissions.length > 0 && (
                    <div className="space-y-4">
                        {displaySubmissions.map((submission) => (
                            <AuthorTextBookCard
                                key={submission.id}
                                submission={submission}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2 sm:px-6 rounded-lg">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                {/* Last Activity Notice */}
                {!loading && displaySubmissions.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm text-blue-900 font-medium">
                                    Last activity recorded on {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}.
                                </p>
                                <p className="text-sm text-blue-800 mt-1">
                                    You'll receive email notifications for any updates to your submissions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail View Modal */}
            {selectedSubmission && (
                <TextBookDetailView
                    submission={selectedSubmission}
                    onClose={() => {
                        setSelectedSubmission(null);
                        setSearchParams({}); // Clear param on close
                    }}
                    userRole="author"
                    onRefresh={handleRefresh}
                />
            )}
        </div>
    );
}
