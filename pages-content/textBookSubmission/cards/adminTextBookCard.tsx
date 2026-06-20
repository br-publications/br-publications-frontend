// Admin Text Book Submission Card Component
import { type TextBookSubmission, STATUS_COLORS, STATUS_LABELS, formatDate, getDaysSinceSubmission } from '../types/textBookTypes';

interface AdminTextBookCardProps {
    submission: TextBookSubmission;
    onViewDetails: (submission: TextBookSubmission) => void;
}

export default function AdminTextBookCard({ submission, onViewDetails }: AdminTextBookCardProps) {
    const daysSince = getDaysSinceSubmission(submission.submissionDate);
    const discussionCount = submission.discussions?.length || 0;
    const authorName = `${submission.mainAuthor.firstName} ${submission.mainAuthor.lastName}`;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                {/* Left Section - Title and Meta */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1 hover:text-blue-600 cursor-pointer line-clamp-2"
                        onClick={() => onViewDetails(submission)}>
                        {submission.bookTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{authorName}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{submission.mainAuthor.email}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(submission.submissionDate)} ({daysSince}d ago)</span>
                        </div>

                        {submission.currentRevisionNumber > 0 && (
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-orange-600 font-medium">Revision {submission.currentRevisionNumber}/5</span>
                            </div>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {submission.coAuthors && submission.coAuthors.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {submission.coAuthors.length} Co-author{submission.coAuthors.length > 1 ? 's' : ''}
                            </span>
                        )}

                        {submission.isbnNumber && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                ISBN
                            </span>
                        )}

                        {submission.doiNumber && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                DOI
                            </span>
                        )}

                        {submission.publishDate && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Published {formatDate(submission.publishDate)}
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

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                        {/* Discussion Indicator */}
                        {discussionCount > 0 && (
                            <div className="relative">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {discussionCount}
                                </span>
                            </div>
                        )}

                        {/* View Button */}
                        <button
                            onClick={() => onViewDetails(submission)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Review
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
