import React, { useState, useRef } from 'react';
import {
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  MoreVertical,
  MessageSquare,
} from 'lucide-react';
import styles from './reviewerAssignmentCard.module.css';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface ReviewerAssignmentCardProps {
  assignment: import('../../../types/submissionTypes').ReviewerAssignment;
  onView: (assignment: import('../../../types/submissionTypes').ReviewerAssignment, tab?: 'overview' | 'review-form' | 'discussions' | 'revision') => void;
  onRespond: (id: number, response: 'accept' | 'decline') => void;
  tab: 'pending' | 'accepted' | 'completed' | 'rejected';
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: '#f59e0b', icon: <Clock size={14} />, label: 'Awaiting Response' },
  accepted: { color: '#8b5cf6', icon: <Clock size={14} />, label: 'In Progress' },
  completed: { color: '#10b981', icon: <CheckCircle size={14} />, label: 'Completed' },
  rejected: { color: '#ef4444', icon: <AlertCircle size={14} />, label: 'Declined' },
};

export const ReviewerAssignmentCard: React.FC<ReviewerAssignmentCardProps> = ({
  assignment,
  onView,
  onRespond,
}) => {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(menuRef, () => setShowActions(false), buttonRef);

  const status = statusConfig[assignment.assignmentStatus];

  const mainAuthorName = `${assignment.mainAuthor.firstName} ${assignment.mainAuthor.lastName} `;
  const daysUntilDue = assignment.dueDate
    ? Math.ceil((assignment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysAssigned = Math.floor((new Date().getTime() - assignment.assignmentDate.getTime()) / (1000 * 60 * 60 * 24));

  // Show chapter title instead of book title if available
  const displayTitle = (assignment.chapters && assignment.chapters.length > 0)
    ? assignment.chapters[0]
    : assignment.bookTitle;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{displayTitle}</h3>
        </div>
        <div className={styles.statusBadge} style={{ borderLeftColor: status.color }}>
          {status.icon}
          <span>{status.label}</span>
        </div>
        {assignment.assignmentStatus !== 'rejected' && (
          <button
            ref={buttonRef}
            className={styles.actionButton}
            onClick={() => setShowActions(!showActions)}
            aria-label="More actions"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      {/* Action Menu */}
      {showActions && (
        <div ref={menuRef} className={styles.actionMenu}>
          {assignment.assignmentStatus !== 'pending' && assignment.assignmentStatus !== 'rejected' && assignment.assignmentStatus !== 'declined' && (
            <button
              className={styles.actionMenuItem}
              onClick={() => {
                onView(assignment, 'overview');
                setShowActions(false);
              }}
            >
              <Eye size={14} /> View Details
            </button>
          )}
          {assignment.assignmentStatus === 'pending' && (
            <>
              <button
                className={styles.actionMenuItem}
                onClick={() => {
                  onRespond(assignment.assignmentId, 'accept');
                  setShowActions(false);
                }}
              >
                <CheckCircle size={14} /> Accept Assignment
              </button>
              <button
                className={`${styles.actionMenuItem} ${styles.danger} `}
                onClick={() => {
                  onRespond(assignment.assignmentId, 'decline');
                  setShowActions(false);
                }}
              >
                <AlertCircle size={14} /> Decline Assignment
              </button>
            </>
          )}
          {(assignment.assignmentStatus === 'accepted' || assignment.assignmentStatus === 'completed') && (
            <button
              className={styles.actionMenuItem}
              onClick={() => {
                onView(assignment, 'discussions');
                setShowActions(false);
              }}
              disabled={assignment.assignmentStatus === 'completed'}
              title={assignment.assignmentStatus === 'completed' ? 'Review already submitted' : undefined}
              style={assignment.assignmentStatus === 'completed' ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <MessageSquare size={14} /> View Discussions
            </button>
          )}
        </div>
      )}

      {/* Details Row */}
      <div className={styles.detailsRow}>
        {/* Author Info */}
        <div className={styles.authorInfo}>
          <div className={styles.author}>
            <div className={styles.authorAvatar}>
              {assignment.mainAuthor.firstName[0]}{assignment.mainAuthor.lastName[0]}
            </div>
            <div>
              <p className={styles.authorName}>{mainAuthorName}</p>
              {assignment.coAuthors && assignment.coAuthors.length > 0 && (
                <p className={styles.coAuthors}>
                  +{assignment.coAuthors.length} co-author{assignment.coAuthors.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chapters & Info */}
        <div className={styles.infoSection}>
          <div className={styles.infoItem}>
            <FileText size={12} />
            <span>
              {assignment.chapters?.length || 0} chapter
              {assignment.chapters?.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Time Info */}
        <div className={styles.timeInfo}>
          {daysUntilDue !== null && daysUntilDue >= 0 ? (
            <span className={`${styles.timeText} ${daysUntilDue <= 7 ? styles.urgent : ''} `}>
              {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left
            </span>
          ) : daysUntilDue !== null && daysUntilDue < 0 ? (
            <span className={`${styles.timeText} ${styles.overdue} `}>
              Overdue
            </span>
          ) : (
            <span className={styles.timeText}>
              {daysAssigned} day{daysAssigned !== 1 ? 's' : ''} ago
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span className={styles.timestamp}>
          Assigned {daysAssigned} day{daysAssigned !== 1 ? 's' : ''} ago
        </span>
        {assignment.assignmentStatus !== 'pending' && assignment.assignmentStatus !== 'rejected' && assignment.assignmentStatus !== 'declined' && (
          <button className={styles.viewButton} onClick={() => onView(assignment, 'overview')}>
            <Eye size={14} /> View
          </button>
        )}
      </div>

      {/* Quick Actions */}
      {assignment.assignmentStatus !== 'pending' && assignment.assignmentStatus !== 'rejected' && assignment.assignmentStatus !== 'declined' && (
        <div className={styles.quickActions}>
          <button
            className={styles.quickActionButton}
            onClick={() => onView(assignment, 'overview')}
            title="View Manuscript"
          >
            View
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => onView(assignment, 'review-form')}
            title={assignment.assignmentStatus === 'completed' ? 'Review already submitted' : 'Review Submission'}
            disabled={assignment.assignmentStatus === 'completed'}
            style={assignment.assignmentStatus === 'completed' ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Review
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => onView(assignment, 'discussions')}
            title={assignment.assignmentStatus === 'completed' ? 'Review already submitted' : 'View Discussions'}
            disabled={assignment.assignmentStatus === 'completed'}
            style={assignment.assignmentStatus === 'completed' ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Discuss
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewerAssignmentCard;