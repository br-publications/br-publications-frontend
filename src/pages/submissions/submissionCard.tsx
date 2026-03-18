// components/SubmissionCard.tsx

import type { Submission } from '../../types/submissionTypes';
import { getStatusDisplay, getStatusColor, formatDate } from '../../utils/submissionutils';

interface SubmissionCardProps {
  submission: Submission;
  onViewHistory: (submission: Submission) => void;
  onViewDiscussions: (submission: Submission) => void;
  onViewDetails: (submission: Submission) => void;
}

export default function SubmissionCard({
  submission,
  onViewHistory,
  onViewDiscussions,
  onViewDetails
}: SubmissionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left Section - Title and Meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 cursor-pointer line-clamp-2">
            {submission.bookTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
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
              <span>Last activity: {formatDate(submission.updatedAt)}</span>
            </div>

            {submission.mainAuthor && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{submission.mainAuthor.firstName} {submission.mainAuthor.lastName}</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {submission.isOverdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Overdue
              </span>
            )}

            {submission.isIncomplete && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Incomplete
              </span>
            )}

            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              {submission.stage}
            </span>
          </div>
        </div>

        {/* Right Section - Status and Actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          {/* Status Badge */}
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(submission.status)}`}>
            {getStatusDisplay(submission.status)}
          </span>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* History Button */}
            <button
              onClick={() => onViewHistory(submission)}
              className="group relative p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              aria-label="View History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {/* Tooltip */}
              <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                History
              </span>
            </button>

            {/* Discussion Button */}
            <button
              onClick={() => onViewDiscussions(submission)}
              className="group relative p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
              aria-label="View Discussions"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {submission.discussionCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                  {submission.discussionCount}
                </span>
              )}
              {/* Tooltip */}
              <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Discussions
              </span>
            </button>

            {/* View Button */}
            <button
              onClick={() => onViewDetails(submission)}
              className="group relative px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}