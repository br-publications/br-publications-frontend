// Chapter List Component
import React, { useState, useMemo } from 'react';
import { Grid, List, Filter, SortAsc } from 'lucide-react';
import { type IndividualChapter, ChapterStatus } from '../../../../types/chapterTypes';
import { sortChaptersByNumber, filterChaptersByStatus, getStatusCategory } from '../../../../utils/chapterUtils';
import ChapterCard from './chapterCard';
import styles from './chapterList.module.css';

interface ChapterListProps {
    chapters: IndividualChapter[];
    userRole: 'author' | 'editor' | 'reviewer' | 'admin';
    onChapterClick?: (chapter: IndividualChapter) => void;
    onChapterUpload?: (chapter: IndividualChapter) => void;
    onChapterAction?: (chapter: IndividualChapter, action: string) => void;
    showFilters?: boolean;
    defaultView?: 'grid' | 'list';
    className?: string;
    showUploadForRevision?: boolean;
}

export const ChapterList: React.FC<ChapterListProps> = ({
    chapters,
    userRole,
    onChapterClick,
    onChapterUpload,
    onChapterAction,
    showFilters = true,
    defaultView = 'grid',
    className = '',
    showUploadForRevision = false,
}) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
    const [filterStatus, setFilterStatus] = useState<ChapterStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<'number' | 'status'>('number');

    // Filter and sort chapters
    const filteredAndSortedChapters = useMemo(() => {
        let result = [...chapters];

        // Apply status filter
        if (filterStatus !== 'all') {
            result = filterChaptersByStatus(result, filterStatus);
        }

        // Apply sorting
        if (sortBy === 'number') {
            result = sortChaptersByNumber(result);
        } else if (sortBy === 'status') {
            result = result.sort((a, b) => {
                const categoryA = getStatusCategory(a.status);
                const categoryB = getStatusCategory(b.status);
                return categoryA.localeCompare(categoryB);
            });
        }

        return result;
    }, [chapters, filterStatus, sortBy]);

    // Get unique statuses from chapters
    const availableStatuses = useMemo(() => {
        const statuses = new Set(chapters.map(c => c.status));
        return Array.from(statuses);
    }, [chapters]);

    return (
        <div className={`${styles.container} ${className}`}>
            {/* Header with filters */}
            {showFilters && (
                <div className={styles.header}>
                    <div className={styles.filters}>
                        {/* Status Filter */}
                        <div className={styles.filterGroup}>
                            <Filter size={14} />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as ChapterStatus | 'all')}
                                className={styles.select}
                            >
                                <option value="all">All Statuses ({chapters.length})</option>
                                {availableStatuses.map(status => {
                                    const count = chapters.filter(c => c.status === status).length;
                                    return (
                                        <option key={status} value={status}>
                                            {status.replace(/_/g, ' ')} ({count})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Sort */}
                        <div className={styles.filterGroup}>
                            <SortAsc size={14} />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'number' | 'status')}
                                className={styles.select}
                            >
                                <option value="number">By Chapter Number</option>
                                <option value="status">By Status</option>
                            </select>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Chapter Count */}
            <div className={styles.countInfo}>
                Showing {filteredAndSortedChapters.length} of {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
            </div>

            {/* Chapters Grid/List */}
            {filteredAndSortedChapters.length > 0 ? (
                <div className={`${styles.chaptersContainer} ${styles[viewMode]}`}>
                    {filteredAndSortedChapters.map(chapter => (
                        <ChapterCard
                            key={chapter.id}
                            chapter={chapter}
                            userRole={userRole}
                            onClick={onChapterClick ? () => onChapterClick(chapter) : undefined}
                            onUpload={onChapterUpload ? () => onChapterUpload(chapter) : undefined}
                            onAction={onChapterAction ? (action) => onChapterAction(chapter, action) : undefined}
                            compact={viewMode === 'list'}
                            showUploadForRevision={showUploadForRevision}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p>No chapters found matching the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default ChapterList;
