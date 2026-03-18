import React, { useState, useRef } from 'react';
import {
  Eye,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import styles from './authorSubmissionCard.module.css';
import { statusConfig } from '../common/status/statusConfig';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface AuthorSubmissionCardProps {
  submission: BookChapterSubmission;
  onView: (submission: BookChapterSubmission, tab?: 'overview' | 'discussions' | 'workflow' | 'history') => void;
  onEdit: (submission: BookChapterSubmission) => void;
  onDelete: (id: number) => void;
}

/**
 * Author Submission Card Component
 * Displays a book chapter submission with status, author info, chapters, and quick actions
 *
 * Updated to match AdminSubmissionCard design
 */
export const AuthorSubmissionCard: React.FC<AuthorSubmissionCardProps> = ({
  submission,
  onView,
  onEdit,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(menuRef, () => setShowActions(false), buttonRef);

  const status = statusConfig[submission.status] || statusConfig.ABSTRACT_SUBMITTED;

  const mainAuthorName = `${submission.mainAuthor.firstName} ${submission.mainAuthor.lastName}`;
  const coAuthorCount = submission.coAuthors?.length || 0;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(submission);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(submission.id);
    setShowActions(false);
  };

  // Helper to generate light bg color from text color
  // Simply using opacity 10% for now via css or style
  const bgStyle = {
    backgroundColor: `${status.color}15`, // 15 = ~8-9% opacity
    color: status.color,
    border: `1px solid ${status.color}20`
  };

  return (
    <div className={styles.card}>
      <div className={styles.mainContent}>
        {/* Top Row: Title, Status, and Menu */}
        <div className={styles.headerRow}>
          <div className={styles.titleWrapper}>
            <h3 className={styles.title}>{submission.bookTitle}</h3>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statusBadge} style={bgStyle}>
              {status.icon}
              <span>{status.label}</span>
            </div>
            <button
              ref={buttonRef}
              className={styles.menuButton}
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Action Menu */}
        {showActions && (
          <div ref={menuRef} className={styles.actionMenu}>
            <button className={styles.actionMenuItem} onClick={() => { onView(submission); setShowActions(false); }}>
              <Eye size={16} /> View Details
            </button>
            {!['APPROVED', 'REJECTED', 'PUBLISHED', 'UNDER_REVIEW', 'EDITORIAL_REVIEW', 'REVIEWER_ASSIGNMENT', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS', 'MANUSCRIPTS_PENDING'].includes(submission.status) && (
              <>
                <button className={styles.actionMenuItem} onClick={handleEdit}>
                  <Edit2 size={16} /> Edit
                </button>
                <button className={`${styles.actionMenuItem} ${styles.danger}`} onClick={handleDelete}>
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Middle Row: Info Items */}
        <div className={styles.infoRow}>
          <div className={styles.authorInfo}>
            <div className={styles.authorAvatar}>
              {submission.mainAuthor.firstName[0]}{submission.mainAuthor.lastName[0]}
            </div>
            <div className={styles.authorDetails}>
              <span className={styles.authorName}>{mainAuthorName}</span>
              {coAuthorCount > 0 && <span className={styles.coAuthorCount}>+{coAuthorCount} co-authors</span>}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.metricItem}>
            <FileText size={16} className={styles.metricIcon} />
            <span>{submission.chapters?.length || 0} chapters</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.statusItem}>
            {submission.assignedEditorId ? (
              <span className={styles.assignedStatus}>
                <CheckCircle size={16} /> Editor assigned
              </span>
            ) : (
              <span className={styles.unassignedStatus}>
                <AlertCircle size={16} /> Assignment Pending
              </span>
            )}
          </div>

          <div className={styles.pushRight}>
            <button className={styles.viewButton} onClick={() => onView(submission, 'overview')}>
              <Eye size={16} /> View
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Navigation */}
      <div className={styles.quickNavRow}>
        <button className={styles.navButton} onClick={() => onView(submission, 'workflow')}>
          Timeline
        </button>
        <button className={styles.navButton} onClick={() => onView(submission, 'discussions')}>
          Discuss
        </button>
        <button className={styles.navButton} onClick={() => onView(submission, 'history')}>
          History
        </button>
      </div>
    </div>
  );
};

export default AuthorSubmissionCard;