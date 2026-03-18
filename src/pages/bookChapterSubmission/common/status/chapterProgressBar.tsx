// Chapter Progress Bar Component
import React from 'react';
import { type IndividualChapter } from '../../../../types/chapterTypes';
import { getOverallProgress } from '../../../../utils/chapterUtils';
import styles from './chapterProgressBar.module.css';

interface ChapterProgressBarProps {
    chapters: IndividualChapter[];
    showDetails?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const ChapterProgressBar: React.FC<ChapterProgressBarProps> = ({
    chapters,
    showDetails = true,
    size = 'medium',
    className = '',
}) => {
    const progress = getOverallProgress(chapters);

    return (
        <div className={`${styles.container} ${styles[size]} ${className}`}>
            {showDetails && (
                <div className={styles.header}>
                    <span className={styles.title}>Overall Progress</span>
                    <span className={styles.percentage}>{progress.percentage}%</span>
                </div>
            )}

            <div className={styles.barContainer}>
                <div className={styles.barBackground}>
                    <div
                        className={styles.barFill}
                        style={{ width: `${progress.percentage}%` }}
                    >
                        {!showDetails && progress.percentage > 10 && (
                            <span className={styles.inlinePercentage}>{progress.percentage}%</span>
                        )}
                    </div>
                </div>
            </div>

            {showDetails && (
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{progress.approved}</span>
                        <span className={styles.statLabel}>Approved</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{progress.inProgress}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{progress.rejected}</span>
                        <span className={styles.statLabel}>Rejected</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{progress.total}</span>
                        <span className={styles.statLabel}>Total</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChapterProgressBar;
