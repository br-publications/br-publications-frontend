// components/DiscussionPopup.tsx

import { useState } from 'react';
import type { Discussion } from '../../types/submissionTypes';
import { formatDateTime } from '../../utils/submissionutils';

interface DiscussionPopupProps {
  discussions: Discussion[];
  onClose: () => void;
  submissionTitle: string;
  onAddDiscussion?: (message: string) => void;
}

export default function DiscussionPopup({ 
  discussions, 
  onClose, 
  submissionTitle,
  onAddDiscussion 
}: DiscussionPopupProps) {
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && onAddDiscussion) {
      onAddDiscussion(newMessage);
      setNewMessage('');
      setReplyTo(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Discussions
              <span className="bg-blue-100 text-blue-600 text-sm px-2.5 py-0.5 rounded-full">
                {discussions.length}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{submissionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Discussions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {discussions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 mb-2">No discussions yet</p>
              <p className="text-sm text-gray-400">Start a conversation about this submission</p>
            </div>
          ) : (
            <div className="space-y-6">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="space-y-4">
                  {/* Main Discussion */}
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {discussion.author.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{discussion.author}</h4>
                          <p className="text-xs text-gray-500">{formatDateTime(discussion.date)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{discussion.message}</p>
                      
                      {/* Reply Button */}
                      <button
                        onClick={() => setReplyTo(discussion.id)}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Replies */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="ml-14 space-y-4">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">
                                {reply.author.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-medium text-gray-700 text-sm">{reply.author}</h5>
                                <p className="text-xs text-gray-500">{formatDateTime(reply.date)}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Message Form */}
        <div className="border-t border-gray-200 p-6">
          {replyTo && (
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Replying to discussion
              <button
                onClick={() => setReplyTo(null)}
                className="text-red-600 hover:text-red-700 ml-2"
              >
                Cancel
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add to the discussion..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Post Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}