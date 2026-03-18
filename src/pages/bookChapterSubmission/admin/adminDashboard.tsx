import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useAdminAllSubmissions, useSubmissionFilters } from '../../../utils/bookChapterSubmission.hooks';
import bookChapterService from '../../../services/bookChapterSumission.service';
import { useNotifications } from '../../../utils/bookChapterSubmission.hooks';
import AdminSubmissionCard from './adminSubmissionCard';
import { AdminFilterPanel } from './adminFilterPanel';
import { AdminSubmissionDetailView } from './adminSubmissionDetailView';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import { CardSkeleton } from '../common/ui/skeletons';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import styles from './adminDashboard.module.css';

type AdminTab = 'new' | 'unassigned' | 'active' | 'archived';

/**
 * Admin Dashboard Component
 * Displays submissions with tabs: New, Unassigned, Active, Archived
 * Allows admin to assign editors, manage submissions, and view details
 */
export const AdminDashboard: React.FC = () => {
  /* State */
  const [activeTab, setActiveTab] = useState<AdminTab>('new');
  const { filters, updateFilters } = useSubmissionFilters();

  // Map frontend tab to backend tab
  const backendTab = activeTab === 'archived' ? 'completed' : activeTab;

  // Use new hook signature with tab param
  const { submissions, isLoading, error, refetch, counts } = useAdminAllSubmissions(1, 50, { tab: backendTab });
  const { addNotification } = useNotifications();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BookChapterSubmission | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<'overview' | 'discussions' | 'actions' | 'workflow'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: AlertType;
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

  const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void, showCancel = false, confirmText = 'OK') => {
    setAlert({
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
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const handleViewDetails = (submission: BookChapterSubmission, tab: 'overview' | 'discussions' | 'workflow' | 'history' | 'actions' = 'overview') => {
    // Map legacy/extra tabs to valid detail view tabs
    let validTab: 'overview' | 'discussions' | 'actions' | 'workflow' = 'overview';

    switch (tab) {
      case 'history':
        validTab = 'overview';
        break;
      case 'workflow':
        validTab = 'workflow';
        break;
      case 'discussions':
        validTab = 'discussions';
        break;
      case 'actions':
        validTab = 'actions';
        break;
      default:
        validTab = 'overview';
    }

    setInitialDetailTab(validTab);
    setSelectedSubmission(submission);
  };

  // Keep selectedSubmission in sync with submissions list
  React.useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find(s => s.id === selectedSubmission.id);
      if (updated && (updated.status !== selectedSubmission.status || updated.updatedAt !== selectedSubmission.updatedAt)) {
        setSelectedSubmission(updated);
      }
    }
  }, [submissions, selectedSubmission]);

  // Background polling for live data updates
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      refetch(true); // silent fetch
    }, 45000); // 45 seconds

    return () => clearInterval(intervalId);
  }, [refetch]);

  /**
   * Filter submissions (Server side handles status, here we might filter by search if needed locally,
   * but ideally search should also be server side. For now, we'll keep search local if hook doesn't support it yet
   * or rely on hook refetching if we passed search to it.
   */
  const getSubmissionsByTab = (): BookChapterSubmission[] => {
    let filtered = submissions;

    // Client-side filtering removed as backend now handles date and status logic per tab

    // Apply search filter locally for now (can be moved to server later)
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mainAuthor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mainAuthor.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredSubmissions = getSubmissionsByTab();

  // Use backend counts with fallbacks
  // Note: Backend returns 'completed', frontend uses 'archived'
  const stats = {
    new: counts?.new || 0,
    active: counts?.active || 0,
    archived: counts?.completed || 0,
    unassigned: (counts as any)?.unassigned || 0, // Type assertion until hook types fully propagate
  };

  // handleAssignEditor removed as it was unused content

  /**
   * Handle archiving (soft deleting) a submission
   */
  const handleArchive = async (submission: BookChapterSubmission) => {
    showAlert(
      'warning',
      'Confirm Archive',
      `Are you sure you want to archive "${submission.bookTitle}"? This will move it to Rejected/Archived status.`,
      async () => {
        try {
          closeAlert();
          await bookChapterService.deleteSubmission(submission.id);
          addNotification('success', 'Submission Archived', 'The submission has been moved to archives.');
          // Refetch to update list
          refetch();
        } catch (err) {
          console.error('Failed to archive submission:', err);
          addNotification('error', 'Error', 'Failed to archive submission. Please try again.');
          showAlert('error', 'Error', 'Failed to archive submission');
        }
      },
      true,
      'Archive'
    );
  };



  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by title, author, chapter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Tabs Row */}
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'new' ? styles.active : ''}`}
            onClick={() => setActiveTab('new')}
          >
            New Submissions
            <span className={styles.count}>{stats.new}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'unassigned' ? styles.active : ''}`}
            onClick={() => setActiveTab('unassigned')}
          >
            Unassigned
            <span className={styles.count}>{stats.unassigned}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            <span className={styles.count}>{stats.active}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'archived' ? styles.active : ''}`}
            onClick={() => setActiveTab('archived')}
          >
            Archived
            <span className={styles.count}>{stats.archived}</span>
          </button>
        </div>
        {/* 
        <div className={styles.tabActions}>
          <button
            className={styles.filterToggle}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={16} /> Filters
          </button>
        </div> */}
      </div>

      {/* Filter Panel */}
      <AdminFilterPanel
        filters={filters}
        onFilterChange={updateFilters}
        onClose={() => setIsFilterOpen(false)}
        isOpen={isFilterOpen}
      />

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total in {activeTab}:</span>
          <span className={styles.statValue}>{filteredSubmissions.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Showing:</span>
          <span className={styles.statValue}>
            {filteredSubmissions.slice(0, 20).length} of {filteredSubmissions.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : error ? (
          <div className={styles.error}>
            <p>Error loading submissions: {error}</p>
            <button onClick={() => refetch(false)} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className={styles.empty}>
            <p>No submissions found</p>
            <span>Try adjusting your filters or check back later</span>
          </div>
        ) : (
          filteredSubmissions.map(submission => (
            <AdminSubmissionCard
              key={submission.id}
              submission={submission}
              onView={(sub, tab) => handleViewDetails(sub, tab as any)}
              onArchive={handleArchive}
              tab={activeTab}
            />
          ))
        )}
      </div>

      {/* Detail View Panel */}
      {selectedSubmission && (
        <AdminSubmissionDetailView
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={() => {
            // Update submission in list
            refetch();
          }}
          initialTab={initialDetailTab}
        />
      )}

      {/* Alert Popup */}
      <AlertPopup
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
        showCancel={alert.showCancel}
        confirmText={alert.confirmText}
      />
    </div>
  );
};

export default AdminDashboard;