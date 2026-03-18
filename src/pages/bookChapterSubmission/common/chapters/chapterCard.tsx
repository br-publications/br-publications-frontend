// Chapter Card Component
import React from 'react';
import { FileText, Upload, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { type IndividualChapter, ChapterStatus } from '../../../../types/chapterTypes';
import {
    formatChapterTitle,
    getChapterProgressPercentage,
    getNextAction,
    canUploadManuscript,
    formatManuscriptFileName,
    formatFileSize,
    getFileIconColor
} from '../../../../utils/chapterUtils';
import ChapterStatusBadge from '../status/chapterStatusBadge';
import styles from './chapterCard.module.css';

interface ChapterCardProps {
    chapter: IndividualChapter;
    userRole: 'author' | 'editor' | 'reviewer' | 'admin';
    onClick?: () => void;
    onUpload?: () => void;
    onAction?: (action: string) => void;
    showActions?: boolean;
    compact?: boolean;
    className?: string;
    showUploadForRevision?: boolean;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
    chapter,
    userRole,
    onClick,
    onUpload,
    onAction,
    showActions = true,
    compact = false,
    className = '',
    showUploadForRevision = false,
}) => {
    const progress = getChapterProgressPercentage(chapter);
    const nextAction = getNextAction(chapter, userRole);
    const canUpload = canUploadManuscript(chapter) || (showUploadForRevision && chapter.status === ChapterStatus.REVISION_REQUESTED);

    const getStatusIcon = () => {
        switch (chapter.status) {
            case ChapterStatus.CHAPTER_APPROVED:
                return <CheckCircle size={18} className={styles.iconApproved} />;
            case ChapterStatus.CHAPTER_REJECTED:
                return <XCircle size={18} className={styles.iconRejected} />;
            case ChapterStatus.UNDER_REVIEW:
                return <Clock size={18} className={styles.iconInProgress} />;
            default:
                return <FileText size={18} className={styles.iconDefault} />;
        }
    };

    return (
        <div
            className={`${styles.card} ${compact ? styles.compact : ''} ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    {getStatusIcon()}
                    <div className={styles.titleText}>
                        <h3 className={styles.title}>{formatChapterTitle(chapter)}</h3>
                        {!compact && chapter.manuscriptFile && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                <span className={styles.subtitle} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FileText
                                        size={12}
                                        style={{ color: getFileIconColor(chapter.manuscriptFile.fileName) }}
                                    />
                                    {formatManuscriptFileName(chapter)}
                                </span>
                                <span className={styles.subtitle} style={{ fontSize: '10px', color: '#6b7280', marginLeft: '16px' }}>
                                    {formatFileSize(chapter.manuscriptFile.fileSize)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <ChapterStatusBadge status={chapter.status} size="small" />
            </div>

            {/* Progress Bar */}
            {!compact && (
                <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className={styles.progressText}>{progress}%</span>
                </div>
            )}

            {/* Info Section */}
            {!compact && (
                <div className={styles.infoSection}>
                    {chapter.assignedReviewers && chapter.assignedReviewers.length > 0 && (
                        <div className={styles.infoItem}>
                            <Users size={14} />
                            <span>{chapter.assignedReviewers.length} Reviewer{chapter.assignedReviewers.length > 1 ? 's' : ''}</span>
                        </div>
                    )}
                    {chapter.revisionCount > 0 && (
                        <div className={styles.infoItem}>
                            <Upload size={14} />
                            <span>Revision {chapter.revisionCount}/3</span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            {showActions && nextAction && (
                <div className={styles.actionsSection}>
                    {canUpload && onUpload && (
                        <button
                            className={styles.primaryButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpload();
                            }}
                        >
                            <Upload size={14} />
                            {nextAction}
                        </button>
                    )}
                    {!canUpload && onAction && (
                        <button
                            className={styles.secondaryButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction(nextAction);
                            }}
                        >
                            {nextAction}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChapterCard;
