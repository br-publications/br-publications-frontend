import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  Filter,
} from 'lucide-react';
import type { FilterOptions } from '../../../types/submissionTypes';
import styles from './reviewerFilterPanel.module.css';

interface ReviewerFilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const REVIEWER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Response' },
  { value: 'accepted', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Declined' },
];

const DEADLINE_OPTIONS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'urgent', label: 'Due within 7 days' },
  { value: 'normal', label: 'Normal timeline' },
];

export const ReviewerFilterPanel: React.FC<ReviewerFilterPanelProps> = ({
  filters,
  onFilterChange,
  onClose,
  isOpen = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    deadline: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleStatusChange = (status: string) => {
    const newStatuses = filters.statuses?.includes(status as any)
      ? filters.statuses.filter(s => s !== status)
      : [...(filters.statuses || []), status as any];

    onFilterChange({ ...filters, statuses: newStatuses as any });
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
            <h3>Review Filters</h3>
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
          {/* Assignment Status Filter */}
          <div className={styles.filterSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('status')}
            >
              <div className={styles.sectionTitle}>
                <span>Assignment Status</span>
              </div>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${expandedSections.status ? styles.expanded : ''}`}
              />
            </button>

            {expandedSections.status && (
              <div className={styles.sectionContent}>
                {REVIEWER_STATUS_OPTIONS.map(option => (
                  <label key={option.value} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters.statuses?.includes(option.value as any) || false}
                      onChange={() => handleStatusChange(option.value)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Deadline Filter */}
          <div className={styles.filterSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('deadline')}
            >
              <div className={styles.sectionTitle}>
                <span>Deadline Status</span>
              </div>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${expandedSections.deadline ? styles.expanded : ''}`}
              />
            </button>

            {expandedSections.deadline && (
              <div className={styles.sectionContent}>
                {DEADLINE_OPTIONS.map(option => (
                  <label key={option.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="deadline"
                      value={option.value}
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

export default ReviewerFilterPanel;