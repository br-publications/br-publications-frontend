import React, { useState, useRef } from 'react';
import {
  Eye,
  FileText,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import { statusConfig } from '../common/status/statusConfig';
import styles from './adminSubmissionCard.module.css';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface AdminSubmissionCardProps {
  submission: BookChapterSubmission;
  onView: (submission: BookChapterSubmission, tab?: 'overview' | 'discussions' | 'workflow' | 'history' | 'actions') => void;
  onArchive: (submission: BookChapterSubmission) => void;
  // onAssignEditor removed as it was unused
  tab: 'new' | 'unassigned' | 'active' | 'archived';
}

/**
 * Admin Submission Card Component
 * Displays submission info with admin-specific actions
 * 
 * Updated Features:
 * - All 17 statuses supported via statusConfig
 * - Proper discussionCount from statusConfig or discussions array
 * - Type-safe status configuration
 */
export const AdminSubmissionCard: React.FC<AdminSubmissionCardProps> = ({
  submission,
  onView,
  onArchive,
  tab,
}) => {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(menuRef, () => setShowActions(false), buttonRef);

  // Get status config - use statusConfig from shared config file
  // Falls back to ABSTRACT_SUBMITTED if status not found (shouldn't happen)
  const status = statusConfig[submission.status as keyof typeof statusConfig] ||
    statusConfig['ABSTRACT_SUBMITTED'];

  const mainAuthorName = `${submission.mainAuthor.firstName} ${submission.mainAuthor.lastName}`;
  const coAuthorCount = submission.coAuthors?.length || 0;
  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(submission.submissionDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // ✅ CORRECT: Get discussion count from either discussionCount or discussions array
  const discussionCount = submission.discussionCount || submission.discussions?.length || 0;

  // Use book title directly from submission
  const bookTitle = submission.bookTitle;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{bookTitle}</h3>
          <div className={styles.statusBadge} style={{ borderLeftColor: status.color }}>
            {status.icon}
            <span>{status.label}</span>
          </div>
        </div>
        <button
          ref={buttonRef}
          className={styles.actionButton}
          onClick={() => setShowActions(!showActions)}
          aria-label="More actions"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Action Menu */}
      {showActions && (
        <div ref={menuRef} className={styles.actionMenu}>
          <button
            className={styles.actionMenuItem}
            onClick={() => {
              onView(submission);
              setShowActions(false);
            }}
          >
            <Eye size={16} /> View Details
          </button>
          {tab === 'unassigned' && (
            <button
              className={styles.actionMenuItem}
              onClick={() => setShowActions(false)}
            >
              <Edit2 size={16} /> Assign Editor
            </button>
          )}
          <button
            className={`${styles.actionMenuItem} ${styles.danger}`}
            onClick={() => {
              onArchive(submission);
              setShowActions(false);
            }}
          >
            <Trash2 size={16} /> Archive
          </button>
        </div>
      )}

      {/* Details Row */}
      <div className={styles.detailsRow}>
        {/* Author Info */}
        <div className={styles.authorInfo}>
          <div className={styles.author}>
            <div className={styles.authorAvatar}>
              {submission.mainAuthor.firstName[0]}{submission.mainAuthor.lastName[0]}
            </div>
            <div>
              <p className={styles.authorName}>{mainAuthorName}</p>
              {coAuthorCount > 0 && (
                <p className={styles.coAuthors}>
                  +{coAuthorCount} co-author{coAuthorCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chapters & Info */}
        <div className={styles.infoSection}>
          <div className={styles.infoItem}>
            <FileText size={14} />
            <span>
              {submission.chapters?.length || 0} chapter
              {submission.chapters?.length !== 1 ? 's' : ''}
            </span>
          </div>
          {discussionCount > 0 && (
            <div className={styles.infoItem}>
              <MessageSquare size={14} />
              <span>
                {discussionCount} message{discussionCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Editor Assignment Status */}
        {submission.assignedEditor ? (
          <div className={styles.editorAssigned}>
            <CheckCircle size={14} />
            <span>Editor: {submission.assignedEditor.fullName}</span>
          </div>
        ) : (
          <div className={styles.editorUnassigned}>
            <AlertCircle size={14} />
            <span>Awaiting Editor Assignment</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span className={styles.timestamp}>
          {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
        </span>
        <button className={styles.viewButton} onClick={() => onView(submission)}>
          <Eye size={16} /> View
        </button>
      </div>

      {/* Quick Actions Row */}
      <div className={styles.quickActions}>
        <button
          className={styles.quickActionButton}
          onClick={() => onView(submission)}
          title="View Details"
        >
          View
        </button>
        <button
          className={styles.quickActionButton}
          onClick={() => onView(submission, 'discussions')}
          title="View Discussions"
        >
          Discuss
        </button>
        <button
          className={styles.quickActionButton}
          onClick={() => onView(submission, 'workflow')}
          title="View Workflow"
        >
          Workflow
        </button>
      </div>
    </div>
  );
};

export default AdminSubmissionCard;