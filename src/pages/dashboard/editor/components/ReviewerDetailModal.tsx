import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, AlertTriangle, FileText, Check } from 'lucide-react';
import { userService } from '../../../../services/user.service';
import toast from 'react-hot-toast';

interface ReviewerDetailModalProps {
    reviewer: any;
    isOpen: boolean;
    onClose: () => void;
}

const ReviewerDetailModal: React.FC<ReviewerDetailModalProps> = ({ reviewer, isOpen, onClose }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && reviewer) {
            fetchStats();
        } else {
            setStats(null);
        }
    }, [isOpen, reviewer]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await userService.getReviewerStats(reviewer.id);
            if (response.success) {
                setStats(response.data);
            } else {
                toast.error('Failed to load stats');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
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
                            <h2 className="text-base font-bold text-gray-900">{reviewer.fullName}</h2>
                            <p className="text-xs text-gray-500">{reviewer.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Statistics</h3>

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : stats ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard
                                icon={<FileText className="h-4 w-4 text-blue-600" />}
                                label="Total Assigned"
                                value={stats.totalAssigned}
                                color="bg-blue-50"
                            />
                            <StatCard
                                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                                label="Completed"
                                value={stats.completed}
                                color="bg-green-50"
                            />
                            <StatCard
                                icon={<Clock className="h-4 w-4 text-orange-600" />}
                                label="Pending"
                                value={stats.pending}
                                color="bg-orange-50"
                            />
                            <StatCard
                                icon={<Clock className="h-4 w-4 text-purple-600" />}
                                label="Avg Completion Time"
                                value={`${stats.avgCompletionDays || 0} days`}
                                color="bg-purple-50"
                            />
                            <StatCard
                                icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                                label="Late Submissions"
                                value={stats.lateSubmissions}
                                color="bg-red-50"
                            />
                            <StatCard
                                icon={<Check className="h-4 w-4 text-teal-600" />}
                                label="Acceptance Rate"
                                value={`${stats.acceptanceRate}%`}
                                color="bg-teal-50"
                            />
                            <StatCard
                                icon={<FileText className="h-4 w-4 text-indigo-600" />}
                                label="Book Chapters"
                                value={stats.bookChaptersAssigned || 0}
                                color="bg-indigo-50"
                            />
                            <StatCard
                                icon={<FileText className="h-4 w-4 text-pink-600" />}
                                label="Individual Chapters"
                                value={stats.individualChaptersAssigned || 0}
                                color="bg-pink-50"
                            />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-10">No statistics available</div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors text-xs"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }: any) => (
    <div className={`${color} p-3 rounded-xl border border-gray-100`}>
        <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                {icon}
            </div>
            <span className="text-[10px] font-medium text-gray-600">{label}</span>
        </div>
        <div className="text-lg font-bold text-gray-900 pl-1">{value}</div>
    </div>
);

export default ReviewerDetailModal;
