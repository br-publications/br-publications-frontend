import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  Filter,
  Calendar,
  Tag,
  BookOpen,
} from 'lucide-react';
import type { FilterOptions, SubmissionStatus } from '../../../../types/submissionTypes';
import styles from './filterPanel.module.css';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

/**
 * All 10 submission statuses organized by phase
 * Updated to match submissionTypes.ts SubmissionStatus type exactly
 */
const STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: 'ABSTRACT_SUBMITTED', label: 'Abstract Submitted' },
  { value: 'MANUSCRIPTS_PENDING', label: 'Manuscripts Pending' },
  { value: 'REVIEWER_ASSIGNMENT', label: 'Assigning Reviewers' },
  { value: 'UNDER_REVIEW', label: 'Under Peer Review' },
  { value: 'EDITORIAL_REVIEW', label: 'Editorial Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ISBN_APPLIED', label: 'Proof Editing' },
  { value: 'PUBLICATION_IN_PROGRESS', label: 'Publication in Progress' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'REJECTED', label: 'Rejected' },
];

const SORT_OPTIONS: { value: 'recent' | 'oldest' | 'title-asc' | 'title-desc'; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
];

const DATE_RANGE_OPTIONS: { value: 'all' | '7' | '30' | '90'; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClose,
  isOpen = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    sort: true,
    dateRange: false,
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

  const handleSortChange = (sortBy: 'recent' | 'oldest' | 'title-asc' | 'title-desc') => {
    onFilterChange({ ...filters, sortBy: sortBy as FilterOptions['sortBy'] });
  };

  const handleDateRangeChange = (days: 'all' | '7' | '30' | '90') => {
    onFilterChange({ ...filters, dateRange: days as FilterOptions['dateRange'] });
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
    (filters.dateRange && filters.dateRange !== 'all' ? 1 : 0) +
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
            <h3>Filters</h3>
            {activeFiltersCount > 0 && (
              <span className={styles.badge}>{activeFiltersCount}</span>
            )}
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close filter panel"
          >
            <X size={20} />
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
                <Tag size={14} />
                <span>Status</span>
              </div>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${expandedSections.status ? styles.expanded : ''}`}
              />
            </button>

            {expandedSections.status && (
              <div className={styles.sectionContent}>
                {STATUS_OPTIONS.map(option => (
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

          {/* Sort Filter */}
          <div className={styles.filterSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('sort')}
            >
              <div className={styles.sectionTitle}>
                <BookOpen size={14} />
                <span>Sort By</span>
              </div>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${expandedSections.sort ? styles.expanded : ''}`}
              />
            </button>

            {expandedSections.sort && (
              <div className={styles.sectionContent}>
                {SORT_OPTIONS.map(option => (
                  <label key={option.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={filters.sortBy === option.value}
                      onChange={() => handleSortChange(option.value)}
                      className={styles.radio}
                    />
                    <span className={styles.radioText}>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className={styles.filterSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('dateRange')}
            >
              <div className={styles.sectionTitle}>
                <Calendar size={14} />
                <span>Date Range</span>
              </div>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${expandedSections.dateRange ? styles.expanded : ''}`}
              />
            </button>

            {expandedSections.dateRange && (
              <div className={styles.sectionContent}>
                {DATE_RANGE_OPTIONS.map(option => (
                  <label key={option.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="dateRange"
                      value={option.value}
                      checked={filters.dateRange === option.value}
                      onChange={() => handleDateRangeChange(option.value)}
                      className={styles.radio}
                    />
                    <span className={styles.radioText}>{option.label}</span>
                  </label>
                ))}
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

export default FilterPanel;