import React, { useState, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  AlertCircle,
  Loader,
} from 'lucide-react';
import type { SubmissionStatus } from '../../../../types/submissionTypes';
import { bookChapterService } from '../../../../services/bookChapterSumission.service';
import AlertPopup, { type AlertType } from '../../../../components/common/alertPopup';
import styles from './discussionPanel.module.css';

export interface Discussion {
  id: number;
  submissionId: number;
  author: {
    id: number;
    name: string;
    role: 'author' | 'editor' | 'reviewer';
  };
  message: string;
  timestamp: Date;
  isEdited?: boolean;
  isInternal?: boolean;
  attachments?: Array<{
    id: number;
    name: string;
    url: string;
  }>;
}

interface DiscussionPanelProps {
  submissionId: number;
  submissionStatus: SubmissionStatus;
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
  currentUserRole?: string;
  isChapterDiscussion?: boolean; // New prop
}

const roleColors: Record<'author' | 'editor' | 'reviewer', string> = {
  author: '#3b82f6',
  editor: '#1e5292',
  reviewer: '#8b5cf6',
};

const getRoleLabel = (role: 'author' | 'editor' | 'reviewer'): string => {
  switch (role) {
    case 'author':
      return 'Author';
    case 'editor':
      return 'Editor';
    case 'reviewer':
      return 'Reviewer';
    default:
      return role;
  }
};

const formatTime = (date: Date): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
};

export const DiscussionPanel: React.FC<DiscussionPanelProps> = ({
  submissionId,
  submissionStatus,
  refreshTrigger,
  currentUserRole,
  isChapterDiscussion = false,
}) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVisibleToAuthor, setIsVisibleToAuthor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchDiscussions = async () => {
    if (!submissionId) return;

    setIsLoading(true);
    try {
      const response = isChapterDiscussion
        ? await bookChapterService.getChapterDiscussions(submissionId)
        : await bookChapterService.getDiscussions(submissionId);

      if (response.success && response.data) {
        // Transform API data to component format
        const formattedDiscussions: Discussion[] = response.data.map((d: any) => ({
          id: d.id,
          submissionId: isChapterDiscussion ? d.chapterId : d.submissionId,
          author: {
            id: d.user?.id || 0,
            name: d.user?.fullName || 'Unknown',
            role: (d.user?.role?.toLowerCase() as any) || 'author',
          },
          message: d.message,
          timestamp: new Date(d.createdAt),
          isInternal: d.isInternal,
        }));
        setDiscussions(formattedDiscussions);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setError('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [submissionId, refreshTrigger]);

  const canPostMessage =
    submissionStatus !== 'PUBLISHED' &&
    submissionStatus !== 'REJECTED' && submissionStatus !== 'APPROVED';

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const isInternal = !isVisibleToAuthor;
      const response = isChapterDiscussion
        ? await bookChapterService.postChapterDiscussion(submissionId, newMessage, isInternal)
        : await bookChapterService.postDiscussion(submissionId, newMessage, isInternal);

      if (response.success && response.data) {
        setNewMessage('');
        // Refresh discussions to include new message
        fetchDiscussions();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <MessageSquare size={14} />
          <h3 className={styles.title}>Discussion Thread</h3>
          <span className={styles.subtitle}>
            ({discussions.length} message{discussions.length !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <Loader className={styles.spinner} size={24} />
            <p>Loading discussions...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={fetchDiscussions} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : discussions.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={40} />
            <p>No discussions yet</p>
            <span>Start a discussion with the editor and reviewers</span>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {discussions.map((discussion) => (
              <div key={discussion.id} className={styles.messageItem}>
                <div className={styles.messageBubble}>
                  <div className={styles.messageHeader}>
                    <span className={styles.authorName} style={{ color: roleColors[discussion.author.role] }}>
                      {discussion.author.name}
                    </span>
                    <span
                      className={styles.role}
                      style={{
                        backgroundColor: `${roleColors[discussion.author.role]}10`,
                        color: roleColors[discussion.author.role],
                      }}
                    >
                      {getRoleLabel(discussion.author.role)}
                    </span>
                    {discussion.isInternal && (
                      <span className={styles.internalBadge}>
                        <AlertCircle size={10} />
                        Internal
                      </span>
                    )}
                    <span className={styles.timestamp}>
                      {formatTime(discussion.timestamp)}
                      {discussion.isEdited && <span className={styles.edited}>(edited)</span>}
                    </span>
                  </div>

                  <p className={styles.messageText}>{discussion.message}</p>

                  {/* Attachments */}
                  {discussion.attachments && discussion.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      {discussion.attachments.map(attachment => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          className={styles.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className={styles.attachmentIcon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {attachment.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      {canPostMessage && (
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <textarea
              className={styles.textarea}
              placeholder="Add your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSubmitting}
              maxLength={5000}
            />
            <div className={styles.inputFooter}>
              <div className={styles.leftControls}>
                {/* Visibility Toggle for Staff */}
                {(currentUserRole === 'editor' || currentUserRole === 'reviewer' || currentUserRole === 'admin') && (
                  <label className={styles.visibilityToggle}>
                    <input
                      type="checkbox"
                      checked={isVisibleToAuthor}
                      onChange={(e) => setIsVisibleToAuthor(e.target.checked)}
                    />
                    <span className={styles.toggleLabel}>Visible to Author</span>
                  </label>
                )}
                <span className={styles.charCount}>
                  {newMessage.length}/5000
                </span>
              </div>
              <button
                className={styles.sendButton}
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSubmitting}
              >
                <Send size={14} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info for non-submittable statuses */}
      {!canPostMessage && (
        <div className={styles.infoBar}>
          <AlertCircle size={14} />
          <span>
            {submissionStatus === 'PUBLISHED'
              ? 'This submission has been published. Discussions are closed.'
              : 'This submission has been rejected. Discussions are closed.'}
          </span>
        </div>
      )}

      {/* Alert Popup */}
      <AlertPopup
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </div>
  );
};

export default DiscussionPanel;