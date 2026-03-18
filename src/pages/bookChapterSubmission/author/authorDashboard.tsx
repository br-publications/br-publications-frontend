import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthorSubmissionCard from './authorSubmissionCard';
import AuthorSubmissionDetailView from './authorSubmissionDetailView';
import FilterPanel from '../common/ui/filterPanel';
import NotificationBell from '../common/ui/notificationBell';
import AlertPopup from '../../../components/common/alertPopup'; // Import AlertPopup
import bookChapterService from '../../../services/bookChapterSumission.service';
import { resolveSubmissionBookTitles } from '../../../utils/submissionUtils';
import type { BookChapterSubmission, FilterOptions, SubmissionStatus } from '../../../types/submissionTypes';
import styles from './authorDashboard.module.css';

type TabType = 'queue' | 'archives';

/**
 * Author Dashboard Component
 * Displays user's book chapter submissions with filtering, searching, and sorting
 * 
 * Fixed Issues:
 * - dateRange values must match FilterOptions interface ('all' | '7' | '30' | '90')
 * - sortBy values must match FilterOptions interface ('recent' | 'oldest' | 'title-asc' | 'title-desc')
 * - Use BookChapterSubmission type consistently
 * - Type-safe status filtering with SubmissionStatus
 * - Proper sort order handling
 */
export default function AuthorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [submissions, setSubmissions] = useState<BookChapterSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<BookChapterSubmission | null>(null);

  // Initialize filters with correct FilterOptions interface values
  const [filters, setFilters] = useState<FilterOptions>({
    statuses: [],           // Note: plural 'statuses' from FilterOptions interface
    dateRange: '30',        // ✅ CORRECT: Use '30' not '30days'
    sortBy: 'recent',       // ✅ CORRECT: Use 'recent' not 'date'
    search: '',
  });

  const [initialDetailTab, setInitialDetailTab] = useState<'overview' | 'discussions' | 'workflow' | 'history'>('overview');

  // Fetch submissions
  useEffect(() => {
    fetchSubmissions();
  }, []); // Fetch once on mount, not on tab change

  /**
   * Fetch submissions from API
   * 
   * Note: API may return status as string, but we need SubmissionStatus type
   * The type assertion ensures TypeScript compatibility while respecting runtime data
   */
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await bookChapterService.getMySubmissions({
        page: 1,
        limit: 50,
      });

      if (response.success && response.data) {
        // ✅ CORRECT: Safely type the API response
        // API returns items that may have status as string, but we type them as BookChapterSubmission
        let allSubmissions = (response.data.submissions || []) as BookChapterSubmission[];

        // Resolve book IDs to titles
        allSubmissions = await resolveSubmissionBookTitles(allSubmissions);

        // Store ALL submissions
        setSubmissions(allSubmissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter submissions based on active tab, search, and filters
   */
  // 1. First split by tab
  const queueSubmissions = submissions.filter(s => !['REJECTED', 'PUBLISHED'].includes(String(s.status)));
  const archivedSubmissions = submissions.filter(s => ['REJECTED', 'PUBLISHED'].includes(String(s.status)));

  // 2. Select current tab's submissions
  const currentTabSubmissions = activeTab === 'queue' ? queueSubmissions : archivedSubmissions;

  // 3. Apply search and filters
  const filteredSubmissions = currentTabSubmissions.filter(submission => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = submission.bookTitle.toLowerCase().includes(query);
      const matchesChapters = submission.chapters?.some(title =>
        title.toLowerCase().includes(query)
      ) || false;
      const matchesAuthor = submission.mainAuthor.firstName.toLowerCase().includes(query) ||
        submission.mainAuthor.lastName.toLowerCase().includes(query);

      if (!matchesTitle && !matchesChapters && !matchesAuthor) {
        return false;
      }
    }

    // Status filter - ✅ CORRECT: Use 'statuses' (plural) from FilterOptions
    // Compare as strings since API may return status as string
    if (filters.statuses && filters.statuses.length > 0) {
      const statusStr = String(submission.status);
      if (!filters.statuses.includes(statusStr as SubmissionStatus)) {
        return false;
      }
    }

    return true;
  });

  /**
   * Sort submissions based on sortBy and sortOrder
   * ✅ CORRECT: Use 'recent'/'oldest'/'title-asc'/'title-desc' from FilterOptions
   */
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    // Determine sort direction based on sortBy value
    // 'recent' and 'oldest' are built-in directions
    // 'title-asc' and 'title-desc' are built-in directions

    if (filters.sortBy === 'recent') {
      // Most recent first (newer dates first)
      return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
    } else if (filters.sortBy === 'oldest') {
      // Oldest first (older dates first)
      return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
    } else if (filters.sortBy === 'title-asc') {
      // Title A-Z
      return a.bookTitle.localeCompare(b.bookTitle);
    } else if (filters.sortBy === 'title-desc') {
      // Title Z-A
      return b.bookTitle.localeCompare(a.bookTitle);
    }

    return 0;
  });

  /**
   * Open submission detail view panel
   */
  const handleViewDetails = (submissionId: number, tab: 'overview' | 'discussions' | 'workflow' | 'history' | 'edit' = 'overview') => {

    const submission = submissions.find(s => s.id === submissionId);
    if (submission) {
      setSelectedSubmission(submission);
      setInitialDetailTab(tab as any);
    }
  };

  /**
   * Close detail view panel
   */
  const handleCloseDetailView = () => {
    setSelectedSubmission(null);
  };

  /**
   * Update submission after changes in detail view
   */
  const handleUpdateSubmission = async (updatedSubmission: BookChapterSubmission) => {
    // Refresh submissions list
    const fetchSubmissions = async () => {
      try {
        const response = await bookChapterService.getMySubmissions({ limit: 100 });
        if (response.success && response.data) {
          const items = response.data.items || response.data.submissions || [];
          setSubmissions(items);
          // Update the selected submission with fresh data
          const refreshed = items.find(s => s.id === updatedSubmission.id);
          if (refreshed) {
            setSelectedSubmission(refreshed);
          }
        }
      } catch (error) {
        console.error('Error refreshing submissions:', error);
      }
    };
    await fetchSubmissions();
  };

  /**
   * Handle submission deletion (Withdrawal)
   */
  /* Alert State */
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void, showCancel = false, confirmText = 'OK') => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel,
      confirmText
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  /**
   * Handle submission deletion (Withdrawal)
   */
  const handleDelete = (submissionId: number) => {
    showAlert(
      'warning',
      'Confirm Deletion',
      'Are you sure you want to delete this submission? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          closeAlert();
          const response = await bookChapterService.deleteSubmission(submissionId);
          if (response.success) {
            await fetchSubmissions();
            showAlert('success', 'Success', 'Submission deleted successfully');
          } else {
            console.error('Failed to delete submission:', response.message);
            showAlert('error', 'Deletion Failed', response.message || 'Unknown error');
          }
        } catch (error) {
          console.error('Error deleting submission:', error);
          showAlert('error', 'Error', 'An error occurred while deleting the submission.');
        } finally {
          setLoading(false);
        }
      },
      true,
      'Delete'
    );
  };

  /**
   * Navigate to new submission form
   */
  const handleNewSubmission = () => {
    navigate('/book-chapter-manuscript');
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>My Submissions</h1>
            <p className={styles.subtitle}>
              Manage and track your book chapter submissions
            </p>
          </div>
          {/* <div className={styles.headerRight}>
            <NotificationBell />
          </div> */}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <div className={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab('queue')}
            className={`${styles.tab} ${activeTab === 'queue' ? styles.tabActive : ''}`}
          >
            My Queue
            <span className={styles.tabBadge}>
              {queueSubmissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`${styles.tab} ${activeTab === 'archives' ? styles.tabActive : ''}`}
          >
            Archives
            <span className={styles.tabBadge}>
              {archivedSubmissions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Search & Actions Bar */}
        <div className={styles.searchBar}>
          <div className={styles.searchLeft}>
            {/* Filter Toggle Button
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
              aria-label="Toggle filters"
            >
              <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className={styles.filterToggleText}>Filters</span>
              {filters.statuses && filters.statuses.length > 0 && (
                <span className={styles.filterCount}>{filters.statuses.length}</span>
              )}
            </button> */}

            {/* Search Input */}
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, chapter, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={styles.searchClear}
                  aria-label="Clear search"
                >
                  <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.searchRight}>
            <button
              onClick={handleNewSubmission}
              className={styles.newSubmissionBtn}
            >
              <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Submission
            </button>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          {/* Filter Panel - Slide from left */}
          <div className={`${styles.filterPanel} ${showFilters ? styles.filterPanelVisible : ''}`}>
            <div className={styles.filterPanelOverlay} onClick={() => setShowFilters(false)} />
            <div className={styles.filterPanelContent}>
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>

          {/* Submissions List */}
          <div className={styles.submissionsList}>
            {/* Results Header */}
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                {activeTab === 'queue' ? 'Active Submissions' : 'Archived Submissions'}
              </h2>
              <p className={styles.resultsCount}>
                {sortedSubmissions.length} submission{sortedSubmissions.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>Loading submissions...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && sortedSubmissions.length === 0 && (
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className={styles.emptyTitle}>
                  {searchQuery || (filters.statuses && filters.statuses.length > 0)
                    ? 'No submissions found'
                    : activeTab === 'queue'
                      ? 'No active submissions'
                      : 'No archived submissions'}
                </h3>
                <p className={styles.emptyDescription}>
                  {searchQuery || (filters.statuses && filters.statuses.length > 0)
                    ? 'Try adjusting your search or filters'
                    : activeTab === 'queue'
                      ? 'Start by submitting your book chapter'
                      : 'Completed submissions will appear here'}
                </p>
              </div>
            )}

            {/* Submissions Grid */}
            {!loading && sortedSubmissions.length > 0 && (
              <div className={styles.submissionsGrid}>
                {sortedSubmissions.map((submission) => (
                  <AuthorSubmissionCard
                    key={submission.id}
                    submission={submission}
                    onView={(sub: BookChapterSubmission, tab?: string) => handleViewDetails(sub.id, tab as any)}
                    onEdit={(sub: BookChapterSubmission) => handleViewDetails(sub.id, 'edit')}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Last Activity Notice */}
            {!loading && sortedSubmissions.length > 0 && (
              <div className={styles.activityNotice}>
                <svg className={styles.activityIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className={styles.activityText}>
                    Last activity recorded on {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}.
                  </p>
                  <p className={styles.activitySubtext}>
                    You'll receive email notifications for any updates to your submissions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail View Panel - Slide in from right */}
      {selectedSubmission && (
        <AuthorSubmissionDetailView
          submission={selectedSubmission}
          onClose={handleCloseDetailView}
          onUpdate={handleUpdateSubmission}
          initialTab={initialDetailTab}
        />
      )}

      {/* Alert Popup */}
      <AlertPopup
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
        onConfirm={alertState.onConfirm}
        showCancel={alertState.showCancel}
        confirmText={alertState.confirmText}
      />
    </div>
  );
}