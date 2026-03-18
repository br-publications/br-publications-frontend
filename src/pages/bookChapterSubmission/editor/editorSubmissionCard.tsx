import React, { useState, useRef } from 'react';
import {
    Eye,
    FileText,
    MoreVertical,
    CheckCircle,
    AlertCircle,
    UserCheck,
    Send,
    MessageSquare
} from 'lucide-react';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import { statusConfig } from '../common/status/statusConfig';
import styles from './editorSubmissionCard.module.css';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface EditorSubmissionCardProps {
    submission: BookChapterSubmission;
    onView: (submission: BookChapterSubmission, tab?: 'overview' | 'discussions' | 'workflow' | 'history' | 'actions' | 'reviewers') => void;
    tab: 'assigned' | 'reviewing' | 'active' | 'completed';
}

/**
 * Editor Submission Card Component
 * Displays submission info with editor-specific actions
 * 
 * Updated to match AdminSubmissionCard design
 */
export const EditorSubmissionCard: React.FC<EditorSubmissionCardProps> = ({
    submission,
    onView,
}) => {
    const [showActions, setShowActions] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useClickOutside(menuRef, () => setShowActions(false), buttonRef);

    // Get status config
    const status = statusConfig[submission.status as keyof typeof statusConfig] ||
        statusConfig['ABSTRACT_SUBMITTED'];

    const mainAuthorName = `${submission.mainAuthor.firstName} ${submission.mainAuthor.lastName}`;
    const coAuthorCount = submission.coAuthors?.length || 0;
    const daysAgo = Math.floor(
        (new Date().getTime() - new Date(submission.submissionDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get discussion count
    const discussionCount = submission.discussionCount || submission.discussions?.length || 0;

    // Check if reviewers are assigned (this would come from your data model)
    const hasReviewers = submission.status === 'REVIEWER_ASSIGNMENT' ||
        submission.status === 'UNDER_REVIEW' ||
        submission.status === 'EDITORIAL_REVIEW';

    return (
        <div className={styles.card}>
            {/* Header */}
            <div className={styles.cardHeader}>
                <div className={styles.titleSection}>
                    <h3 className={styles.title}>{submission.bookTitle}</h3>
                </div>
                <div className={styles.statusBadge} style={{ borderLeftColor: status.color }}>
                    {status.icon}
                    <span>{status.label}</span>
                </div>
                <button
                    ref={buttonRef}
                    className={styles.actionButton}
                    onClick={() => setShowActions(!showActions)}
                    aria-label="More actions"
                >
                    <MoreVertical size={16} />
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
                        <Eye size={12} /> View Details
                    </button>
                    {(submission.status === 'REVIEWER_ASSIGNMENT' || submission.status === 'UNDER_REVIEW') && (
                        <button
                            className={styles.actionMenuItem}
                            onClick={() => {
                                onView(submission, 'reviewers');
                                setShowActions(false);
                            }}
                        >
                            <UserCheck size={12} /> Assign Reviewers
                        </button>
                    )}
                    <button className={styles.actionMenuItem}>
                        <Send size={12} /> Send Message
                    </button>
                </div>
            )}

            {/* Details Row */}
            <div className={styles.detailsRow}>
                {/* Author Info */}
                <div className={styles.authorInfo}>
                    <div className={styles.author}>
                        <div className={styles.authorAvatar}>
                            {submission.mainAuthor?.firstName?.[0]}{submission.mainAuthor?.lastName?.[0]}
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
                        <FileText size={12} />
                        <span>
                            {submission.chapters?.length || 0} chapter
                            {submission.chapters?.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {discussionCount > 0 && (
                        <div className={styles.infoItem}>
                            <MessageSquare size={12} />
                            <span>
                                {discussionCount} message{discussionCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Reviewer Status */}
                {hasReviewers ? (
                    <div className={styles.reviewerAssigned}>
                        <CheckCircle size={12} />
                        <span>Reviewers Assigned</span>
                    </div>
                ) : submission.status === 'REVIEWER_ASSIGNMENT' ? (
                    <div className={styles.reviewerNeeded}>
                        <AlertCircle size={12} />
                        <span>Reviewers needed</span>
                    </div>
                ) : <div />}
            </div>

            {/* Footer */}
            <div className={styles.cardFooter}>
                <span className={styles.timestamp}>
                    {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
                </span>
                <button className={styles.viewButton} onClick={() => onView(submission)}>
                    <Eye size={12} /> View
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
                    onClick={() => onView(submission, 'reviewers')}
                    title="Review Submission"
                >
                    Review
                </button>
                <button
                    className={styles.quickActionButton}
                    onClick={() => onView(submission, 'discussions')}
                    title="View Discussions"
                >
                    Discuss
                </button>
            </div>
        </div>
    );
};

export default EditorSubmissionCard;