import React, { useState } from 'react';
import {
    X,
    ChevronDown,
    Filter,
    Clock,
    CheckCircle,
} from 'lucide-react';
import type { FilterOptions, SubmissionStatus } from '../../../types/submissionTypes';
import styles from './editorFilterPanel.module.css';

interface EditorFilterPanelProps {
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    onClose?: () => void;
    isOpen?: boolean;
}

/**
 * Editor-relevant submission statuses for filtering
 */
const EDITOR_STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
    { value: 'ABSTRACT_SUBMITTED', label: 'New Submissions' },
    { value: 'MANUSCRIPTS_PENDING', label: 'Manuscripts Pending' },
    { value: 'REVIEWER_ASSIGNMENT', label: 'Assigning Reviewers' },
    { value: 'UNDER_REVIEW', label: 'In Peer Review' },
    { value: 'EDITORIAL_REVIEW', label: 'Editorial Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'ISBN_APPLIED', label: 'Proof Editing' },
    { value: 'PUBLICATION_IN_PROGRESS', label: 'Publication in Progress' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'REJECTED', label: 'Rejected' },
];

/**
 * Priority levels for editor filtering
 */
const PRIORITY_OPTIONS = [
    { value: 'urgent', label: 'Urgent (>30 days)' },
    { value: 'high', label: 'High Priority (15-30 days)' },
    { value: 'normal', label: 'Normal (<15 days)' },
];

export const EditorFilterPanel: React.FC<EditorFilterPanelProps> = ({
    filters,
    onFilterChange,
    onClose,
    isOpen = false,
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        status: true,
        priority: true,
        reviewers: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleStatusChange = (status: SubmissionStatus) => {
        const newStatuses = filters.statuses?.includes(status)
            ? filters.statuses.filter((s: SubmissionStatus) => s !== status)
            : [...(filters.statuses || []), status];

        onFilterChange({ ...filters, statuses: newStatuses });
    };

    const handlePriorityChange = (priority: string) => {
        // This could be extended with actual priority filtering logic
        onFilterChange({ ...filters });
    };

    const handleReviewerStatusChange = (value: string) => {
        // This could be extended to filter by reviewer assignment status
        onFilterChange({ ...filters });
    };

    const handleResetFilters = () => {
        onFilterChange({
            statuses: [],
            sortBy: 'recent',
            dateRange: 'all',
            search: '',
        });
    };

    const activeFiltersCount = (filters.statuses?.length || 0) +
        (filters.search ? 1 : 0);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div className={styles.overlay} onClick={onClose} />
            )}

            <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.title}>
                        <Filter size={16} />
                        <h3>Editor Filters</h3>
                        {activeFiltersCount > 0 && (
                            <span className={styles.badge}>{activeFiltersCount}</span>
                        )}
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close filter panel"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Filter Sections */}
                <div className={styles.content}>
                    {/* Status Filter */}
                    <div className={styles.filterSection}>
                        <button
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('status')}
                        >
                            <div className={styles.sectionTitle}>
                                <CheckCircle size={14} />
                                <span>Review Status</span>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`${styles.chevron} ${expandedSections.status ? styles.expanded : ''}`}
                            />
                        </button>

                        {expandedSections.status && (
                            <div className={styles.sectionContent}>
                                {EDITOR_STATUS_OPTIONS.map(option => (
                                    <label key={option.value} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={filters.statuses?.includes(option.value) || false}
                                            onChange={() => handleStatusChange(option.value)}
                                            className={styles.checkbox}
                                        />
                                        <span className={styles.checkboxText}>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Priority Filter */}
                    <div className={styles.filterSection}>
                        <button
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('priority')}
                        >
                            <div className={styles.sectionTitle}>
                                <Clock size={14} />
                                <span>Priority</span>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`${styles.chevron} ${expandedSections.priority ? styles.expanded : ''}`}
                            />
                        </button>

                        {expandedSections.priority && (
                            <div className={styles.sectionContent}>
                                {PRIORITY_OPTIONS.map(option => (
                                    <label key={option.value} className={styles.radioLabel}>
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={option.value}
                                            onChange={() => handlePriorityChange(option.value)}
                                            className={styles.radio}
                                        />
                                        <span className={styles.radioText}>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reviewer Status Filter */}
                    <div className={styles.filterSection}>
                        <button
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('reviewers')}
                        >
                            <div className={styles.sectionTitle}>
                                <span>Reviewer Status</span>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`${styles.chevron} ${expandedSections.reviewers ? styles.expanded : ''}`}
                            />
                        </button>

                        {expandedSections.reviewers && (
                            <div className={styles.sectionContent}>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="reviewers"
                                        value="all"
                                        defaultChecked
                                        onChange={() => handleReviewerStatusChange('all')}
                                        className={styles.radio}
                                    />
                                    <span className={styles.radioText}>All</span>
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="reviewers"
                                        value="assigned"
                                        onChange={() => handleReviewerStatusChange('assigned')}
                                        className={styles.radio}
                                    />
                                    <span className={styles.radioText}>Reviewers Assigned</span>
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="reviewers"
                                        value="unassigned"
                                        onChange={() => handleReviewerStatusChange('unassigned')}
                                        className={styles.radio}
                                    />
                                    <span className={styles.radioText}>No Reviewers Yet</span>
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="reviewers"
                                        value="completed"
                                        onChange={() => handleReviewerStatusChange('completed')}
                                        className={styles.radio}
                                    />
                                    <span className={styles.radioText}>Reviews Complete</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={styles.footer}>
                    {activeFiltersCount > 0 && (
                        <button
                            className={styles.resetButton}
                            onClick={handleResetFilters}
                        >
                            Reset Filters
                        </button>
                    )}
                    <button
                        className={styles.applyButton}
                        onClick={onClose}
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );
};

export default EditorFilterPanel;