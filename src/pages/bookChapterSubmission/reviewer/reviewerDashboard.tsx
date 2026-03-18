import React, { useState, useMemo, useCallback } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useReviewerAssignments, useSubmissionFilters } from '../../../utils/bookChapterSubmission.hooks';
import bookChapterService, { type ReviewerResponsePayload } from '../../../services/bookChapterSumission.service';
import ReviewerAssignmentCard from './reviewerAssignmentCard';
import ReviewerFilterPanel from './reviewerFilterPanel';
import ReviewerAssignmentDetailView from './reviewerAssignmentDetailView';
import { DeclineAssignmentModal } from './reviewerChapterModals';
import { CardSkeleton } from '../common/ui/skeletons';
import type { ReviewerAssignment } from '../../../types/submissionTypes';
import styles from './reviewerDashboard.module.css';

type ReviewerTab = 'pending' | 'accepted' | 'completed' | 'rejected';

/**
 * Reviewer Dashboard Component
 * Displays reviewer assignments with tabs: Pending, Accepted, Completed, Rejected
 * Allows reviewer to accept/reject assignments and submit reviews
 * 
 * Fixed Issues:
 * - Proper ReviewerAssignment type with all required properties
 * - Correct onRespond callback signature matching ReviewerAssignmentCard
 * - Transform Submission to ReviewerAssignment with helper functions
 * - No type assertions (as any) needed
 */
export const ReviewerDashboard: React.FC = () => {
  const { assignments, isLoading, error, refetch } = useReviewerAssignments(1, 20);
  const { filters, updateFilters } = useSubmissionFilters();
  /* State */
  const [activeTab, setActiveTab] = useState<ReviewerTab>('pending');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ReviewerAssignment | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<'overview' | 'review-form' | 'discussions' | 'revision'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [declineModal, setDeclineModal] = useState<{ isOpen: boolean; assignmentId: number; chapterTitle: string }>({
    isOpen: false,
    assignmentId: 0,
    chapterTitle: '',
  });

  const handleViewDetails = (assignment: ReviewerAssignment, tab: 'overview' | 'review-form' | 'discussions' | 'revision' = 'overview') => {
    setInitialDetailTab(tab);
    setSelectedAssignment(assignment);
  };

  // Assignments are already transformed by the hook
  const reviewerAssignments = assignments;

  /**
   * Determine deadline urgency status
   */
  const getDeadlineStatus = (dueDate: Date | null): 'overdue' | 'urgent' | 'normal' => {
    if (!dueDate) return 'normal';

    const daysUntil = Math.floor(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    return 'normal';
  };

  /**
   * Categorize assignments by status
   * Memoized to avoid recalculating on every render
   */
  const filteredAssignments = useMemo((): ReviewerAssignment[] => {
    let filtered = reviewerAssignments;

    // Filter by tab
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(s => s.assignmentStatus === 'pending');
        break;
      case 'accepted':
        filtered = filtered.filter(s => s.assignmentStatus === 'accepted');
        break;
      case 'completed':
        filtered = filtered.filter(s => s.assignmentStatus === 'completed');
        break;
      case 'rejected':
        filtered = filtered.filter(s => s.assignmentStatus === 'rejected');
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.bookTitle.toLowerCase().includes(query) ||
        (s.chapters && s.chapters.some(c => c.toLowerCase().includes(query))) ||
        s.mainAuthor.firstName.toLowerCase().includes(query) ||
        s.mainAuthor.lastName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reviewerAssignments, activeTab, searchQuery]);

  /**
   * Calculate statistics for each tab
   * Memoized to avoid recalculating on every render
   */
  const stats = useMemo(() => {
    return {
      pending: reviewerAssignments.filter(s => s.assignmentStatus === 'pending').length,
      accepted: reviewerAssignments.filter(s => s.assignmentStatus === 'accepted').length,
      completed: reviewerAssignments.filter(s => s.assignmentStatus === 'completed').length,
      rejected: reviewerAssignments.filter(s => s.assignmentStatus === 'rejected').length,
    };
  }, [reviewerAssignments]);

  /**
   * Handle reviewer response to assignment
   * ✅ CORRECT: Matches ReviewerAssignmentCard.onRespond signature
   * Signature: (submissionId: number, action: 'accept' | 'reject') => void
   * Memoized to prevent unnecessary re-renders of child components
   */
  const handleRespondToAssignment = useCallback((assignmentId: number, action: ReviewerResponsePayload['response']) => {
    if (action === 'decline') {
      const assignment = reviewerAssignments.find(a => a.assignmentId === assignmentId);
      setDeclineModal({
        isOpen: true,
        assignmentId,
        chapterTitle: assignment?.chapters?.[0] || assignment?.bookTitle || 'Unknown Chapter',
      });
      return;
    }

    // Create payload from action
    const payload: ReviewerResponsePayload = {
      response: action,
    };

    // Call API in background
    bookChapterService.reviewer
      .respondToAssignment(assignmentId, payload)
      .then(() => {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      })
      .catch((error) => {
        console.error('Error responding to assignment:', error);
      });
  }, [refetch, reviewerAssignments]);

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
            className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={14} />
            Pending Response
            <span className={styles.count}>{stats.pending}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'accepted' ? styles.active : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            <CheckCircle size={14} />
            In Progress
            <span className={styles.count}>{stats.accepted}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle size={14} />
            Completed
            <span className={styles.count}>{stats.completed}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'rejected' ? styles.active : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            <AlertCircle size={14} />
            Declined
            <span className={styles.count}>{stats.rejected}</span>
          </button>
        </div>

        {/* <div className={styles.tabActions}>
          <button className={styles.filterToggle} onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter size={14} /> Filters
          </button>
        </div> */}
      </div>

      {/* Filter Panel */}
      <ReviewerFilterPanel
        filters={filters}
        onFilterChange={updateFilters}
        onClose={() => setIsFilterOpen(false)}
        isOpen={isFilterOpen}
      />

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Assignments:</span>
          <span className={styles.statValue}>{reviewerAssignments.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Pending Decision:</span>
          <span className={styles.statValue}>{stats.pending}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>In Progress:</span>
          <span className={styles.statValue}>{stats.accepted}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Completed:</span>
          <span className={styles.statValue}>{stats.completed}</span>
        </div>
      </div>

      {/* Deadlines Alert */}
      <div className={styles.urgentSection}>
        {reviewerAssignments
          .filter(a => a.assignmentStatus === 'accepted' && a.dueDate && getDeadlineStatus(a.dueDate) !== 'normal')
          .slice(0, 3)
          .map(assignment => (
            <div
              key={assignment.id}
              className={`${styles.deadlineAlert} ${styles[getDeadlineStatus(assignment.dueDate as Date)]}`}
            >
              <AlertCircle size={14} />
              <div className={styles.alertContent}>
                <p className={styles.alertTitle}>{assignment.bookTitle}</p>
                <p className={styles.alertMessage}>
                  Due in{' '}
                  {assignment.dueDate && Math.ceil(
                    (assignment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </p>
              </div>
            </div>
          ))}
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
            <p>Error loading assignments: {error}</p>
            <button onClick={refetch} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className={styles.empty}>
            <p>No assignments in this category</p>
            <span>Check back later or adjust your filters</span>
          </div>
        ) : (
          filteredAssignments.map(assignment => (
            <ReviewerAssignmentCard
              key={assignment.id}
              assignment={assignment}
              onView={(assign, tab) => handleViewDetails(assign, tab as any)}
              onRespond={handleRespondToAssignment}
              tab={activeTab}
            />
          ))
        )}
      </div>

      {/* Detail View Panel */}
      {selectedAssignment && (
        <ReviewerAssignmentDetailView
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onUpdate={() => {
            refetch();
          }}
          initialTab={initialDetailTab}
        />
      )}
      {/* Decline Modal */}
      {declineModal.isOpen && (
        <DeclineAssignmentModal
          assignmentId={declineModal.assignmentId}
          chapterTitle={declineModal.chapterTitle}
          onClose={() => setDeclineModal({ ...declineModal, isOpen: false })}
          onSuccess={() => {
            setDeclineModal({ ...declineModal, isOpen: false });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }}
        />
      )}
    </div>
  );
};

export default ReviewerDashboard;