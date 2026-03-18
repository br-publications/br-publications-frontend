import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './submissionStatusHistory.module.css';
import combinedService, { bookChapterService } from '../../../../services/bookChapterSumission.service';

export interface StatusHistory {
    id: number;
    status: string;
    changedBy: string;
    changedByRole: string;
    timestamp: Date;
    comment?: string;
}

interface SubmissionStatusHistoryProps {
    submissionId: number;
    chapterId?: number;
}

const statusDisplayNames: Record<string, string> = {
    ABSTRACT_SUBMITTED: 'Abstract Submitted',
    MANUSCRIPTS_PENDING: 'Manuscripts Pending',
    REVIEWER_ASSIGNMENT: 'Assigning Reviewers',
    UNDER_REVIEW: 'Under Peer Review',
    EDITORIAL_REVIEW: 'Editorial Review',
    APPROVED: 'Approved',
    ISBN_APPLIED: 'Proof Editing',
    PUBLICATION_IN_PROGRESS: 'Publication in Progress',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
};

const getStatusIcon = (status: string, role: string) => {
    if (role === 'system' && status.includes('PENDING')) {
        return <Clock className={styles.iconClock} size={14} />;
    }
    if (status.includes('REJECTED')) {
        return <AlertCircle className={styles.iconError} size={14} />;
    }
    if (status.includes('ACCEPTED') || status === 'APPROVED' || status === 'PUBLISHED') {
        return <CheckCircle className={styles.iconSuccess} size={14} />;
    }
    return <Clock className={styles.iconClock} size={14} />;
};

const getRoleColor = (role: string): string => {
    const normalizedRole = role.toLowerCase();
    switch (normalizedRole) {
        case 'editor':
            return '#1e5292';
        case 'reviewer':
            return '#8b5cf6';
        case 'admin':
            return '#f59e0b';
        case 'author':
            return '#10b981';
        case 'system':
        default:
            return '#6b7280';
    }
};

const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

export const SubmissionStatusHistory: React.FC<SubmissionStatusHistoryProps> = ({ submissionId, chapterId }) => {
    const [history, setHistory] = useState<StatusHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!submissionId) return;

            setIsLoading(true);
            setError(null);
            try {
                const response = chapterId
                    ? await combinedService.reviewer.getChapterHistory(chapterId)
                    : await bookChapterService.getSubmissionHistory(submissionId);

                if (response.success && response.data) {
                    // Map backend history to frontend format
                    const mappedHistory: StatusHistory[] = response.data
                        .map((item: any) => ({
                            id: item.id,
                            status: item.newStatus,
                            changedBy: item.changedByUser ? item.changedByUser.fullName : (item.user ? item.user.fullName : 'System'),
                            changedByRole: item.changedByUser ? item.changedByUser.role : (item.user ? item.user.role || 'reviewer/editor' : 'system'),
                            timestamp: item.timestamp || item.changedAt || item.createdAt,
                            comment: item.notes || item.action
                        }))
                        .filter((item: StatusHistory) => {
                            // Filter out detailed chapter creation logs to keep it short
                            // Regex looks for "[Chapter X: Y] Chapter created"
                            return !/^\[Chapter \d+(?::\s*\d+)?\] Chapter created/.test(item.comment || '');
                        });

                    // Deduplicate consecutive items with same status and timestamp (within 1 min)
                    const uniqueHistory: StatusHistory[] = [];
                    mappedHistory.forEach((item: StatusHistory) => {
                        if (uniqueHistory.length === 0) {
                            uniqueHistory.push(item);
                        } else {
                            const last = uniqueHistory[uniqueHistory.length - 1];
                            const isSameStatus = last.status === item.status;
                            const timeDiff = Math.abs(new Date(last.timestamp).getTime() - new Date(item.timestamp).getTime());

                            // If same status and very close in time (e.g. < 2 seconds), skip it (it's likely a duplicate log from the same action)
                            if (isSameStatus && timeDiff < 2000) {
                                return;
                            }
                            uniqueHistory.push(item);
                        }
                    });

                    setHistory(uniqueHistory);
                }
            } catch (err: any) {
                console.error('Failed to fetch history:', err);
                setError('Failed to load history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [submissionId]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading history...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <Clock size={16} />
                    <h3 className={styles.title}>Status History</h3>
                    <span className={styles.subtitle}>
                        {history.length} status change{history.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className={styles.timeline}>
                {history.length === 0 ? (
                    <div className={styles.empty}>
                        <Clock size={32} />
                        <p>No status history yet</p>
                    </div>
                ) : (
                    history.map((item, idx) => (
                        <div key={item.id} className={styles.timelineItem}>
                            {/* Connector Line */}
                            {idx < history.length - 1 && <div className={styles.connector} />}

                            {/* Icon Circle */}
                            <div className={styles.iconContainer}>
                                {getStatusIcon(item.status, item.changedByRole)}
                            </div>

                            {/* Content */}
                            <div className={styles.content}>
                                <div className={styles.contentHeader}>
                                    <div className={styles.statusInfo}>
                                        <h4 className={styles.statusName}>
                                            {item.comment && ['Manuscript uploaded', 'Revision uploaded', 'Full Chapter Uploaded'].includes(item.comment)
                                                ? item.comment.replace(/^\w/, (c: string) => c.toUpperCase())
                                                : statusDisplayNames[item.status] || item.status.replace(/_/g, ' ')}
                                        </h4>
                                        <p className={styles.byLine}>
                                            by{' '}
                                            <span
                                                className={styles.changedBy}
                                                style={{
                                                    color: getRoleColor(item.changedByRole),
                                                }}
                                            >
                                                {item.changedBy}
                                            </span>
                                            <span className={styles.role}>({item.changedByRole.toLowerCase()})</span>
                                        </p>
                                    </div>
                                    <div className={styles.timestamp}>
                                        {formatDate(item.timestamp)}
                                    </div>
                                </div>

                                {item.comment && (
                                    <div className={styles.comment}>
                                        <p className={styles.commentText}>{item.comment}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SubmissionStatusHistory;
