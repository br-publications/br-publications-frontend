// Author Text Book Submission Card Component
import { type TextBookSubmission, STATUS_COLORS, STATUS_LABELS, formatDate, getDaysSinceSubmission } from '../types/textBookTypes';

interface AuthorTextBookCardProps {
    submission: TextBookSubmission;
    onViewDetails: (submission: TextBookSubmission) => void;
}

export default function AuthorTextBookCard({ submission, onViewDetails }: AuthorTextBookCardProps) {
    const daysSince = getDaysSinceSubmission(submission.submissionDate);
    const discussionCount = submission.discussions?.length || 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
                {/* Left Section - Title and Meta */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 mb-0.5 hover:text-blue-600 cursor-pointer line-clamp-2"
                        onClick={() => onViewDetails(submission)}>
                        {submission.bookTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-1.5">
                        <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[13px]">Submitted: {formatDate(submission.submissionDate)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[13px]">{daysSince} days ago</span>
                        </div>

                        {submission.currentRevisionNumber > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-[13px] font-medium">Rev {submission.currentRevisionNumber}/5</span>
                            </div>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1">
                        {submission.isbnNumber && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-full border border-blue-100">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                ISBN: {submission.isbnNumber}
                            </span>
                        )}

                        {submission.doiNumber && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-medium rounded-full border border-purple-100">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                DOI: {submission.doiNumber}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Section - Status and Actions */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {/* Status Badge */}
                    <span
                        className="px-2 py-1 text-[12px] font-semibold rounded-full border"
                        style={{
                            backgroundColor: `${STATUS_COLORS[submission.status]}10`,
                            borderColor: STATUS_COLORS[submission.status],
                            color: STATUS_COLORS[submission.status]
                        }}
                    >
                        {STATUS_LABELS[submission.status]}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                        {/* Discussion Indicator */}
                        {discussionCount > 0 && (
                            <div className="relative">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                    {discussionCount}
                                </span>
                            </div>
                        )}

                        {/* View Button */}
                        <button
                            onClick={() => onViewDetails(submission)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            View
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
