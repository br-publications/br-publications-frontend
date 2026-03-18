// Chapter Status Badge Component
import React from 'react';
import { ChapterStatus } from '../../../../types/chapterTypes';
import { getChapterStatusColor, getChapterStatusLabel } from '../../../../utils/chapterUtils';
import styles from './chapterStatusBadge.module.css';

interface ChapterStatusBadgeProps {
    status: ChapterStatus;
    showIcon?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const ChapterStatusBadge: React.FC<ChapterStatusBadgeProps> = ({
    status,
    showIcon = false,
    size = 'medium',
    className = '',
}) => {
    const color = getChapterStatusColor(status);
    const label = getChapterStatusLabel(status);

    const getIcon = () => {
        if (!showIcon) return null;

        switch (status) {
            case ChapterStatus.CHAPTER_APPROVED:
                return '✓';
            case ChapterStatus.CHAPTER_REJECTED:
                return '✗';
            case ChapterStatus.UNDER_REVIEW:
            case ChapterStatus.EDITORIAL_REVIEW:
                return '👁';
            case ChapterStatus.REVISION_REQUESTED:
            case ChapterStatus.ADDITIONAL_REVISION_REQUESTED:
                return '↻';
            case ChapterStatus.MANUSCRIPTS_PENDING:
                return '⏳';
            default:
                return '•';
        }
    };

    return (
        <span
            className={`${styles.badge} ${styles[size]} ${className}`}
            style={{ backgroundColor: color }}
            title={label}
        >
            {showIcon && <span className={styles.icon}>{getIcon()}</span>}
            <span className={styles.label}>{label}</span>
        </span>
    );
};

export default ChapterStatusBadge;
