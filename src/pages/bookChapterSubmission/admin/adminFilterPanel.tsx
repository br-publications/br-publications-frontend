import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  Filter,
} from 'lucide-react';
import type { FilterOptions, SubmissionStatus } from '../../../types/submissionTypes';
import styles from './adminFilterPanel.module.css';

interface AdminFilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

/**
 * All 10 submission statuses for admin filtering
 */
const ADMIN_STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: 'ABSTRACT_SUBMITTED', label: 'New Submissions' },
  { value: 'MANUSCRIPTS_PENDING', label: 'Manuscripts Pending' },
  { value: 'REVIEWER_ASSIGNMENT', label: 'Assigning Reviewers' },
  { value: 'UNDER_REVIEW', label: 'In Peer Review' },
  { value: 'EDITORIAL_REVIEW', label: 'Editorial Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ISBN_APPLIED', label: 'ISBN Applied' },
  { value: 'PUBLICATION_IN_PROGRESS', label: 'Publication in Progress' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const AdminFilterPanel: React.FC<AdminFilterPanelProps> = ({
  filters,
  onFilterChange,
  onClose,
  isOpen = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    assignment: true,
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

  const handleAssignmentChange = (value: string) => {
    // Note: This could be extended to filter by assignedEditorId in the future
    // For now, it's just passed to parent component
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
            <Filter size={20} />
            <h3>Admin Filters</h3>
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
                <span>Status</span>
              </div>
              <ChevronDown
                size={18}
                className={`${styles.chevron} ${expandedSections.status ? styles.expanded : ''}`}
              />
            </button>

            {expandedSections.status && (
              <div className={styles.sectionContent}>
                {ADMIN_STATUS_OPTIONS.map(option => (
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

          {/* Assignment Filter */}
          <div className={styles.filterSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('assignment')}
            >
              <div className={styles.sectionTitle}>
                <span>Editor Assignment</span>
              </div>
              <ChevronDown
                size={18}
                className={`${styles.chevron} ${expandedSections.assignment ? styles.expanded : ''}`}
              />
            </button>

            {expandedSections.assignment && (
              <div className={styles.sectionContent}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="assignment"
                    value="all"
                    defaultChecked
                    onChange={() => handleAssignmentChange('all')}
                    className={styles.radio}
                  />
                  <span className={styles.radioText}>All</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="assignment"
                    value="assigned"
                    onChange={() => handleAssignmentChange('assigned')}
                    className={styles.radio}
                  />
                  <span className={styles.radioText}>Assigned to Editor</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="assignment"
                    value="unassigned"
                    onChange={() => handleAssignmentChange('unassigned')}
                    className={styles.radio}
                  />
                  <span className={styles.radioText}>Unassigned</span>
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

export default AdminFilterPanel;