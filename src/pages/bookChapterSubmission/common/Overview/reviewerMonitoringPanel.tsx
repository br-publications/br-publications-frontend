import React, { useState } from 'react';
import { type ChapterReviewerAssignment } from '../../../../types/chapterTypes';
import { User, Calendar, CheckCircle, XCircle, Clock, AlertCircle, MessageSquare, X, FileText } from 'lucide-react';

interface ReviewerMonitoringPanelProps {
    assignments?: ChapterReviewerAssignment[];
}

// ----------------------------------------------------------------------------
// REVIEW DETAILS MODAL COMPONENT
// ----------------------------------------------------------------------------
const ReviewDetailsModal: React.FC<{
    assignment: any | null;
    onClose: () => void;
}> = ({ assignment, onClose }) => {
    if (!assignment) return null;

    const isDeclined = assignment.status === 'DECLINED' || assignment.status === 'REJECTED';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <MessageSquare size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 leading-tight">Review Details</h3>
                            <p className="text-xs text-gray-500">
                                {assignment.reviewer?.fullName || 'Reviewer'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        title="Close details"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        {/* Rejection Reason */}
                        {isDeclined && assignment.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1 flex items-center gap-1.5"><XCircle size={12} /> Rejection Reason</p>
                                <p className="text-xs text-red-800 leading-relaxed whitespace-pre-wrap">{assignment.rejectionReason}</p>
                            </div>
                        )}

                        {/* Recommendation highlight */}
                        {assignment.recommendation && (
                            <div className={`flex items-center gap-3 p-3 rounded-xl shadow-sm ${assignment.recommendation === 'ACCEPT' ? 'bg-green-50 border border-green-200' :
                                assignment.recommendation === 'REJECT' ? 'bg-red-50 border border-red-200' :
                                    'bg-amber-50 border border-amber-200'
                                }`}>
                                <div className={`p-2 rounded-full bg-white shadow-sm ${assignment.recommendation === 'ACCEPT' ? 'text-green-600' :
                                    assignment.recommendation === 'REJECT' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Final Recommendation</p>
                                    <p className="text-sm font-bold text-gray-900">{assignment.recommendation.replace('_', ' ')}</p>
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        {(assignment.detailedFeedback || assignment.comments) && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1.5 pl-1"><MessageSquare size={12} /> Reviewer Comments</p>
                                <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap shadow-sm">
                                    {assignment.detailedFeedback || assignment.comments}
                                </div>
                            </div>
                        )}

                        {/* Strengths / Weaknesses */}
                        {(assignment.strengths || assignment.weaknesses) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {assignment.strengths && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-1 pl-1">✅ Strengths</p>
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-gray-800 whitespace-pre-wrap shadow-sm h-full">{assignment.strengths}</div>
                                    </div>
                                )}
                                {assignment.weaknesses && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1 pl-1">⚠️ Weaknesses</p>
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-gray-800 whitespace-pre-wrap shadow-sm h-full">{assignment.weaknesses}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-lg font-medium transition-colors text-xs"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ReviewerMonitoringPanel: React.FC<ReviewerMonitoringPanelProps> = ({ assignments = [] }) => {
    const [selectedReviewer, setSelectedReviewer] = useState<any | null>(null);

    if (assignments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <User size={48} className="mb-3 opacity-50" />
                <p>No reviewers assigned to this chapter yet.</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACCEPTED':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle size={12} /> Accepted</span>;
            case 'REJECTED':
            case 'DECLINED':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1 w-fit"><XCircle size={12} /> Declined/Rejected</span>;
            case 'COMPLETED':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><FileText size={12} /> Completed</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
        }
    };

    const getRecBadge = (rec: string | null | undefined) => {
        if (!rec) return <span className="text-gray-400 text-xs italic">Not submitted</span>;
        const map: Record<string, { bg: string; text: string; label: string }> = {
            ACCEPT: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accept' },
            REJECT: { bg: 'bg-red-100', text: 'text-red-800', label: 'Reject' },
            MINOR_REVISION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Minor Revision' },
            MAJOR_REVISION: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Major Revision' },
        };
        const c = map[rec] || { bg: 'bg-gray-100', text: 'text-gray-800', label: rec.replace('_', ' ') };
        return <span className={`px-2 py-1 rounded text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>;
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5 shrink-0" size={16} />
                <div>
                    <h4 className="font-semibold text-blue-900 text-xs">Reviewer Monitoring</h4>
                    <p className="text-blue-700 text-xs mt-1">
                        Track the status and timeline of all assigned reviewers. This information is only visible to Admins and Editors.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px]">Reviewer</th>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px]">Status</th>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px] whitespace-nowrap">Assigned Date</th>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px] whitespace-nowrap">Response Date</th>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px] whitespace-nowrap">Deadline</th>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px] whitespace-nowrap">Submission Date</th>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px]">Recommendation</th>
                            <th className="px-3 py-2 font-medium text-gray-500 uppercase text-[10px]">Review Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {assignments.map((assignment) => {
                            const isCompleted = assignment.status === 'COMPLETED';
                            const isDeclined = assignment.status === 'DECLINED' || assignment.status === 'REJECTED';
                            const hasDetails = (isCompleted && (assignment.recommendation || assignment.comments || assignment.detailedFeedback || assignment.strengths || assignment.weaknesses)) || (isDeclined && assignment.rejectionReason);

                            return (
                                <React.Fragment key={assignment.id}>
                                    <tr className="hover:bg-gray-50/50">
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                                    {assignment.reviewer?.firstName?.charAt(0) || assignment.reviewer?.email?.charAt(0) || 'R'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-xs">
                                                        {assignment.reviewer?.firstName} {assignment.reviewer?.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">{assignment.reviewer?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            {getStatusBadge(assignment.status)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-gray-400" />
                                                {new Date(assignment.assignedDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400 pl-4">
                                                {new Date(assignment.assignedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                            {assignment.responseDate ? (
                                                <>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {new Date(assignment.responseDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 pl-4">
                                                        {new Date(assignment.responseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-gray-400" />
                                                {new Date(assignment.deadline).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                            {assignment.reviewSubmittedDate ? (
                                                <>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {new Date(assignment.reviewSubmittedDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 pl-4">
                                                        {new Date(assignment.reviewSubmittedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {getRecBadge(assignment.recommendation)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {hasDetails ? (
                                                <button
                                                    onClick={() => setSelectedReviewer(assignment)}
                                                    className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-all"
                                                >
                                                    <MessageSquare size={12} />
                                                    View Details
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-[10px] italic">-</span>
                                            )}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ReviewDetailsModal
                assignment={selectedReviewer}
                onClose={() => setSelectedReviewer(null)}
            />

            <div className="bg-gray-50 p-3 rounded-lg text-[10px] text-gray-500 flex flex-col gap-1">
                <p><strong>Note:</strong> Timestamps are displayed in your local time zone.</p>
                <p><strong>Pending:</strong> Reviewer has been invited but hasn't responded.</p>
                <p><strong>Accepted/Declined:</strong> Reviewer's response to the invitation.</p>
                <p><strong>Completed:</strong> Reviewer has submitted their peer review. Click "View" in the Review Details column to see their recommendation and comments.</p>
            </div>
        </div>
    );
};
