import React, { useState, useEffect } from 'react';
import {
    MoreVertical,
    Mail,
    Eye,
    LogIn,
    UserX,
    UserCheck,
    Users
} from 'lucide-react';
import { userService, type User } from '../../../services/user.service';
import ReviewerDetailModal from './components/ReviewerDetailModal';
import EmailReviewerModal from './components/EmailReviewerModal';
import toast from 'react-hot-toast';

const ReviewerManagement = () => {
    const [reviewers, setReviewers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [openActionId, setOpenActionId] = useState<number | null>(null);

    // Modals state
    const [selectedReviewer, setSelectedReviewer] = useState<User | null>(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);

    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

    useEffect(() => {
        fetchReviewers();
    }, [page, statusFilter]); // Re-fetch when page or filter changes

    const fetchReviewers = async () => {
        setLoading(true);
        try {
            // Using existing getReviewers endpoint. 
            // Note: Search filtering might need to be done client-side if API doesn't support it for getReviewers specifically, 
            // or we use getAllUsers with role=REVIEWER if API supports search there.
            // Based on userController.ts, getReviewers supports page/limit but NOT search.
            // getAllUsers supports search and role. Let's try getAllUsers first as it's more flexible.

            // Using specific getReviewers endpoint which now supports search
            const response = await userService.getReviewers(page, 10, searchQuery, statusFilter);

            if (response.success && response.data) {
                setReviewers(response.data.users);
                setTotalPages(response.data.pagination.totalPages);
            } else {
                toast.error('Failed to fetch reviewers');
            }
        } catch (error) {
            console.error('Error fetching reviewers:', error);
            toast.error('Failed to fetch reviewers');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchReviewers();
    };

    const toggleActionMenu = (id: number) => {
        if (openActionId === id) {
            setOpenActionId(null);
        } else {
            setOpenActionId(id);
        }
    };

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionId !== null && !(event.target as Element).closest('.action-menu-container')) {
                setOpenActionId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openActionId]);

    const handleImpersonate = async (reviewer: User) => {
        if (!window.confirm(`Are you sure you want to login as ${reviewer.fullName}?`)) return;

        try {
            const response = await userService.impersonateUser(reviewer.id);
            if (response.success && response.data) {
                const { token, user } = response.data;
                const userData = encodeURIComponent(JSON.stringify(user));

                // Open in new tab
                const impersonateUrl = `/impersonate?token=${token}&user=${userData}`;
                window.open(impersonateUrl, '_blank');

                toast.success(`Opened ${user.fullName}'s dashboard in a new tab`);
            } else {
                toast.error(response.message || 'Failed to impersonate');
            }
        } catch (error) {
            console.error('Impersonate error:', error);
            toast.error('Failed to impersonate user');
        }
    };

    const handleToggleStatus = async (reviewer: User) => {
        const action = reviewer.isActive ? 'deactivate' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${action} ${reviewer.fullName}?`)) return;

        try {
            let response;
            if (reviewer.isActive) {
                response = await userService.deleteUser(reviewer.id); // Soft delete
            } else {
                response = await userService.reactivateUser(reviewer.id);
            }

            if (response.success) {
                toast.success(`Reviewer ${action}d successfully`);
                fetchReviewers(); // Refresh list
            } else {
                toast.error(response.message || `Failed to ${action} reviewer`);
            }
        } catch (error) {
            console.error('Status toggle error:', error);
            toast.error(`Failed to ${action} reviewer`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-base font-bold text-gray-900">Reviewer Management</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage, monitor, and assign reviewers.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search reviewers by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 h-10 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="w-full md:w-64 flex-shrink-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as 'active' | 'inactive' | 'all');
                                setPage(1);
                            }}
                            className="w-full pl-3 pr-10 h-10 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white cursor-pointer"
                        >
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                            <option value="all">All Reviewers</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full md:w-auto px-4 h-9 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Reviewers List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Reviewer</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : reviewers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users className="h-12 w-12 text-gray-300 mb-4" />
                                            <p>No reviewers found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reviewers.map((reviewer, index) => {
                                    const isLastItems = index >= reviewers.length - 2 && reviewers.length > 2;
                                    return (
                                        <tr key={reviewer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0 text-xs">
                                                        {reviewer.profilePicture ? (
                                                            <img
                                                                src={reviewer.profilePicture}
                                                                alt={reviewer.fullName}
                                                                className="h-full w-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            reviewer.fullName.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-900">{reviewer.fullName}</div>
                                                        <div className="text-[10px] text-gray-500">{reviewer.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${reviewer.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {reviewer.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                {new Date(reviewer.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                                                <div className="relative action-menu-container">
                                                    <button
                                                        onClick={() => toggleActionMenu(reviewer.id)}
                                                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>

                                                    {openActionId === reviewer.id && (
                                                        <div className={`absolute right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in duration-200 ${isLastItems ? 'bottom-full mb-2 origin-bottom-right' : 'mt-2 origin-top-right'
                                                            }`}>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReviewer(reviewer);
                                                                    setShowStatsModal(true);
                                                                    setOpenActionId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <Eye className="h-3.5 w-3.5 text-gray-500" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReviewer(reviewer);
                                                                    setShowEmailModal(true);
                                                                    setOpenActionId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <Mail className="h-3.5 w-3.5 text-gray-500" />
                                                                Email Reviewer
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleImpersonate(reviewer);
                                                                    setOpenActionId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <LogIn className="h-3.5 w-3.5 text-gray-500" />
                                                                Login as Reviewer
                                                            </button>
                                                            <div className="border-t border-gray-100 my-1"></div>
                                                            <button
                                                                onClick={() => {
                                                                    handleToggleStatus(reviewer);
                                                                    setOpenActionId(null);
                                                                }}
                                                                className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 ${reviewer.isActive
                                                                    ? 'text-red-600 hover:bg-red-50'
                                                                    : 'text-green-600 hover:bg-green-50'
                                                                    }`}
                                                            >
                                                                {reviewer.isActive ? (
                                                                    <>
                                                                        <UserX className="h-3.5 w-3.5" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="h-3.5 w-3.5" />
                                                                        Reactivate
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs font-medium"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1.5 text-gray-600 text-xs flex items-center">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs font-medium"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ReviewerDetailModal
                reviewer={selectedReviewer}
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
            />

            <EmailReviewerModal
                reviewer={selectedReviewer}
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
            />
        </div>
    );
};

export default ReviewerManagement;
