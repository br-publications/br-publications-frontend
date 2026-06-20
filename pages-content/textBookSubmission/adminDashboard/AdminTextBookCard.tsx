
// Admin Text Book Submission Card Component
import { type TextBookSubmission, STATUS_COLORS, STATUS_LABELS, formatDate, getDaysSinceSubmission } from '../types/textBookTypes';

interface AdminTextBookCardProps {
    submission: TextBookSubmission;
    onViewDetails: (submission: TextBookSubmission) => void;
}

export default function AdminTextBookCard({ submission, onViewDetails }: AdminTextBookCardProps) {
    const daysSince = getDaysSinceSubmission(submission.submissionDate);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                {/* Left Section - Title and Meta */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 mb-0.5 hover:text-blue-600 cursor-pointer line-clamp-2"
                        onClick={() => onViewDetails(submission)}>
                        {submission.bookTitle}
                    </h3>

                    {/* Author Info */}
                    <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium text-gray-700">Author:</span> {submission.mainAuthor?.firstName} {submission.mainAuthor?.lastName}
                        {submission.mainAuthor?.instituteName && <span className="text-gray-400 mx-1">|</span>}
                        {submission.mainAuthor?.instituteName}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Submitted: {formatDate(submission.submissionDate)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{daysSince} days ago</span>
                        </div>

                        {submission.currentRevisionNumber > 0 && (
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Revision {submission.currentRevisionNumber}</span>
                            </div>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {submission.isbnNumber && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                ISBN: {submission.isbnNumber}
                            </span>
                        )}

                        {submission.doiNumber && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                DOI: {submission.doiNumber}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Section - Status and Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Status Badge */}
                    <span
                        className="px-3 py-1.5 text-sm font-medium rounded-full border"
                        style={{
                            backgroundColor: `${STATUS_COLORS[submission.status]}20`,
                            borderColor: STATUS_COLORS[submission.status],
                            color: STATUS_COLORS[submission.status]
                        }}
                    >
                        {STATUS_LABELS[submission.status]}
                    </span>

                    {/* View Button */}
                    <button
                        onClick={() => onViewDetails(submission)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
}
