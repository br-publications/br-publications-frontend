import React, { useState } from 'react';
import {
  ChevronLeft,
  FileText,
  MessageSquare,
  Star,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';

import DiscussionPanel from '../common/discussion/discussionPanel';

import SubmissionStatusHistory from '../common/history/submissionStatusHistory';
import ChapterWorkflow from '../common/status/chapterWorkflow';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import ReviewerOverview from './reviewerOverview';
import styles from './reviewerAssignmentDetailView.module.css';
import combinedService from '../../../services/bookChapterSumission.service';

interface ReviewerAssignmentDetailViewProps {
  assignment: import('../../../types/submissionTypes').ReviewerAssignment;
  onClose: () => void;
  onUpdate?: (assignment: any) => void;
  initialTab?: 'overview' | 'review-form' | 'discussions' | 'revision';
}

type ReviewerTab = 'overview' | 'review-form' | 'discussions' | 'revision' | 'history' | 'workflow';

export const ReviewerAssignmentDetailView: React.FC<ReviewerAssignmentDetailViewProps> = ({
  assignment,
  onClose,
  onUpdate,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<ReviewerTab>(() => {
    // If the assignment is completed, we must not start on a disabled tab
    if (assignment.reviewStatus === 'completed' && ['review-form', 'discussions', 'revision'].includes(initialTab)) {
      return 'overview';
    }
    return initialTab as ReviewerTab;
  });

  // Force tab to overview if the status updates to completed while one of the disabled tabs is open
  React.useEffect(() => {
    const isCompleted = assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed';
    if (isCompleted && ['review-form', 'discussions', 'revision'].includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [assignment.reviewStatus, assignment.assignmentStatus, activeTab]);

  // Map recommendation from backend format if needed
  const mapRecommendation = (rec: string | null) => {
    if (!rec) return 'minor_revision';
    switch (rec) {
      case 'ACCEPT': return 'accept';
      case 'REJECT': return 'reject';
      case 'MAJOR_REVISION': return 'major_revision';
      case 'MINOR_REVISION': return 'minor_revision';
      default: return 'minor_revision';
    }
  };

  const [reviewForm, setReviewForm] = useState({
    recommendation: mapRecommendation(assignment.recommendation),
    summary: '',
    strengths: '',
    weaknesses: '',
    detailedComments: assignment.comments || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);



  // Revision Request State
  const [revisionNotes, setRevisionNotes] = useState('');

  // Alert State
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const daysUntilDue = assignment.dueDate
    ? Math.ceil((assignment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;










  const handleSubmitReview = async () => {
    if (!reviewForm.recommendation || !reviewForm.detailedComments) {
      setAlert({ isOpen: true, type: 'warning', title: 'Validation Error', message: 'Please fill in all required fields: Recommendation and Detailed Comments.' });
      return;
    }

    setIsSubmitting(true);
    try {
      let recommendation: 'ACCEPT' | 'REJECT' | 'MAJOR_REVISION' | 'MINOR_REVISION';
      switch (reviewForm.recommendation) {
        case 'accept':
          recommendation = 'ACCEPT';
          break;
        case 'reject':
          recommendation = 'REJECT';
          break;
        case 'minor_revision':
          recommendation = 'MINOR_REVISION';
          break;
        case 'major_revision':
          recommendation = 'MAJOR_REVISION';
          break;
        default:
          setAlert({ isOpen: true, type: 'warning', title: 'Validation Error', message: 'Please select a valid recommendation.' });
          setIsSubmitting(false);
          return;
      }

      await combinedService.reviewer.completeReview(assignment.assignmentId, {
        recommendation,
        reviewerComments: reviewForm.detailedComments,
        confidentialNotes: reviewForm.summary // Mapping summary to confidential notes for now, or add field
      });

      // Show success message
      setAlert({ isOpen: true, type: 'success', title: 'Success', message: 'Review submitted successfully!' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error submitting review:', error);
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to submit review.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      setAlert({ isOpen: true, type: 'warning', title: 'Missing Notes', message: 'Please provide some notes for the revision request.' });
      return;
    }

    // Identify Chapter ID: Prefer the chapter ID from individualChapters list if available
    const chapterId = assignment.individualChapters?.[0]?.id;

    if (!chapterId) {
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'Could not identify chapter context for revision.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // NOTE: requestRevision expects Chapter ID, not Assignment ID
      await combinedService.reviewer.requestRevision(chapterId, { comments: revisionNotes });
      // The original code had `response.success` but combinedService.reviewer.requestRevision doesn't return it.
      // Assuming a successful call means success.
      setAlert({ isOpen: true, type: 'success', title: 'Success', message: 'Revision requested successfully.' });

      // Update local data to reflect changes immediately
      if (onUpdate && assignment.individualChapters && assignment.individualChapters.length > 0) {
        const currentChapter = assignment.individualChapters[0];
        const updatedChapter = {
          ...currentChapter,
          status: 'REVISION_REQUESTED',
          // We optimistically update revision count if it wasn't already in requested state
          // logic mirrors backend: if already requested, count stays same. If not, +1.
          revisionCount: currentChapter.status === 'REVISION_REQUESTED'
            ? currentChapter.revisionCount
            : (currentChapter.revisionCount || 0) + 1,

          // Optimistically add revision request so UI updates immediately
          revisions: [
            ...((currentChapter as any).revisions || []),
            {
              id: -Date.now(), // Temp ID
              requestedBy: assignment.reviewerId,
              status: 'PENDING',
              revisionNumber: currentChapter.status === 'REVISION_REQUESTED'
                ? currentChapter.revisionCount
                : (currentChapter.revisionCount || 0) + 1
            }
          ]
        };

        onUpdate({
          ...assignment,
          individualChapters: [updatedChapter],
          // Also update overall status if needed, though chapter status is key for this view
          status: 'REVISION_REQUESTED'
        });
      }

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error requesting revision:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to request revision. Please try again.';
      setAlert({ isOpen: true, type: 'error', title: 'Error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={onClose} aria-label="Go back">
            <ChevronLeft size={20} />
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{assignment.bookTitle}</h1>
            <p className={styles.submittedInfo}>
              {daysUntilDue !== null
                ? `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
                : 'Deadline not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Author & Deadline Info Bar */}
      <div className={styles.infoBar}>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Submitted by</p>
          <p className={styles.infoValue}>
            {assignment.mainAuthor.firstName} {assignment.mainAuthor.lastName}
          </p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Due Date</p>
          <p className={`${styles.infoValue} ${daysUntilDue !== null && daysUntilDue <= 7 ? styles.urgent : ''}`}>
            {assignment.dueDate ? assignment.dueDate.toLocaleDateString() : 'Pending Acceptance'}
          </p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Status</p>
          <p className={styles.infoValue}>
            {(() => {
              if (assignment.reviewStatus === 'completed') return '✅ Review Completed';
              const chapterStatus = assignment.individualChapters?.[0]?.status;
              if (chapterStatus === 'REVISION_REQUESTED') return '⚠️ Revision Requested';
              if (chapterStatus === 'ADDITIONAL_REVISION_REQUESTED') return '⚠️ Additional Revision Requested';
              if (chapterStatus === 'REVISION_SUBMITTED') return '📄 Revised Version Submitted';
              if (assignment.reviewStatus === 'not_started') return 'Not Started';
              return 'In Progress';
            })()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FileText size={16} /> Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'workflow' ? styles.active : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          <Clock size={16} /> Workflow
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={16} /> History
        </button>

        {/* Discussions — disabled ONLY after completion */}
        <button
          className={`${styles.tab} ${activeTab === 'discussions' ? styles.active : ''}`}
          onClick={() => setActiveTab('discussions')}
          disabled={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed'}
          title={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed' ? 'Review already submitted' : undefined}
          style={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed' ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
        >
          <MessageSquare size={16} /> Discussions
        </button>

        {/* Valid Revisions — disabled ONLY after completion */}
        <button
          className={`${styles.tab} ${activeTab === 'revision' ? styles.active : ''}`}
          onClick={() => setActiveTab('revision')}
          disabled={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed'}
          title={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed' ? 'Review already submitted' : undefined}
          style={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed' ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
        >
          <RefreshCw size={16} /> Request Revisions
        </button>

        {/* Review Form — disabled ONLY after completion */}
        <button
          className={`${styles.tab} ${activeTab === 'review-form' ? styles.active : ''}`}
          onClick={() => setActiveTab('review-form')}
          disabled={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed'}
          title={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed' ? 'Review already submitted' : undefined}
          style={assignment.reviewStatus === 'completed' || assignment.assignmentStatus === 'completed' ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
        >
          <Star size={16} /> Final Review Form
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'workflow' && (
          assignment.individualChapters && assignment.individualChapters.length > 0 ? (
            <ChapterWorkflow chapter={assignment.individualChapters[0]} />
          ) : (
            <div className={styles.emptyState}>
              <p>No chapter data available for workflow display.</p>
            </div>
          )
        )}
        {activeTab === 'overview' && (
          <ReviewerOverview assignment={assignment} />
        )}
        {activeTab === 'review-form' && assignment.reviewStatus !== 'completed' && assignment.assignmentStatus !== 'completed' && (
          <ReviewFormTab
            reviewForm={reviewForm}
            onFormChange={setReviewForm}
            onSubmit={handleSubmitReview}
            isSubmitting={isSubmitting}
          />
        )}
        {activeTab === 'discussions' && assignment.reviewStatus !== 'completed' && assignment.assignmentStatus !== 'completed' && (
          <DiscussionPanel
            currentUserRole="reviewer"
            submissionId={assignment.individualChapters?.[0]?.id || assignment.id}
            submissionStatus={assignment.individualChapters?.[0]?.status || assignment.status}
            isChapterDiscussion={!!assignment.individualChapters?.[0]}
          />
        )}
        {activeTab === 'history' && (
          <div style={{ marginTop: '20px' }}>
            <SubmissionStatusHistory
              submissionId={assignment.id}
              chapterId={assignment.individualChapters?.[0]?.id}
            />
          </div>
        )}
        {activeTab === 'revision' && assignment.reviewStatus !== 'completed' && assignment.assignmentStatus !== 'completed' && (
          <RevisionTab
            assignment={assignment}
            revisionNotes={revisionNotes}
            onNotesChange={setRevisionNotes}
            onSubmit={handleRequestRevision}
            isSubmitting={isSubmitting}
          />
        )}
      </div>



      {/* Alert Popup */}
      <AlertPopup
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, isOpen: false });
          if (alert.message?.includes('revision was already raised please wait for the author response')) {
            window.location.reload();
          }
        }}
      />
    </div>
  );
};



// Review Form Tab
const ReviewFormTab: React.FC<{
  reviewForm: any;
  onFormChange: (form: any) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}> = ({ reviewForm, onFormChange, onSubmit, isSubmitting }) => {
  return (
    <div className={styles.tabContent}>


      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recommendation</h3>
        <div className={styles.formGroup}>
          <select
            value={reviewForm.recommendation}
            onChange={(e) => onFormChange({ ...reviewForm, recommendation: e.target.value })}
            className={styles.select}
          >
            <option value="" disabled>Select Recommendation</option>
            <option value="accept">Accept</option>
            <option value="minor_revision">Accept with Minor Revisions</option>
            <option value="major_revision">Major Revisions Required</option>
            <option value="reject">Reject</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Detailed Comments</h3>
        <div className={styles.formGroup}>
          <textarea
            placeholder="Provide detailed feedback and suggestions for improvement..."
            value={reviewForm.detailedComments}
            onChange={(e) => onFormChange({ ...reviewForm, detailedComments: e.target.value })}
            className={styles.textarea}
            rows={6}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.formActions}>
          <button
            className={styles.submitBtn}
            onClick={onSubmit}
            disabled={isSubmitting || !reviewForm.recommendation || !reviewForm.detailedComments}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};


const RevisionTab: React.FC<{
  assignment: import('../../../types/submissionTypes').ReviewerAssignment;
  revisionNotes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}> = ({ assignment, revisionNotes, onNotesChange, onSubmit, isSubmitting }) => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const chapter = assignment.individualChapters?.[0];
  const maxRevisions = 3;
  // Use CHAPTER revision count, fallback to assignment if needed (but chapter is primary)
  // Ensure we show at least "Round 1" even if count is 0
  const rawRevisionCount = chapter?.revisionCount || 0;
  const currentRevisions = rawRevisionCount === 0 ? 1 : rawRevisionCount;

  // Use CHAPTER status
  const currentStatus = chapter?.status || assignment.status;

  // Check for pending revision request by THIS reviewer
  const revisions = (chapter as any)?.revisions || [];
  const hasPendingRevisionRequest = revisions.some((r: any) =>
    r.requestedBy === assignment.reviewerId && r.status === 'PENDING'
  );

  const isRevisionPending = currentStatus === 'REVISION_REQUESTED' || currentStatus === 'ADDITIONAL_REVISION_REQUESTED';

  // Can request revision only when:
  // - Under active review (UNDER_REVIEW or REVIEWER_ASSIGNMENT) for first request
  // - OR after author has submitted a revised version (REVISION_SUBMITTED) for subsequent requests
  // Reviewer 2 must WAIT for author to submit (REVISION_SUBMITTED) before requesting another revision
  const canRequestRevision =
    currentRevisions < maxRevisions &&
    !hasPendingRevisionRequest &&
    assignment.reviewStatus !== 'completed' &&
    ['UNDER_REVIEW', 'REVIEWER_ASSIGNMENT', 'REVISION_SUBMITTED'].includes(currentStatus);

  return (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Request Revision</h3>

        <div className={styles.infoGrid} style={{ marginBottom: '20px' }}>
          <div className={styles.infoItem}>
            <label>Current Revisions</label>
            <p>{currentRevisions} / {maxRevisions}</p>
          </div>
          <div className={styles.infoItem}>
            <label>Status</label>
            <p style={{
              color: canRequestRevision ? '#10b981' : '#ef4444',
              fontWeight: 500
            }}>
              {canRequestRevision
                ? (currentStatus === 'REVISION_REQUESTED' ? 'Revision Requested (Add your input)' :
                  currentStatus === 'REVISION_SUBMITTED' ? 'New Revision Available (Request Changes?)' : 'Revision Available')
                : (hasPendingRevisionRequest ? 'Request Pending' : 'Unavailable')}
            </p>
          </div>
        </div>

        {!canRequestRevision ? (
          <div className={styles.alertBox} style={{
            backgroundColor: '#fffbeb',
            color: '#92400e',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #fcd34d',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertCircle size={16} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                {hasPendingRevisionRequest ? 'Your Request Is Pending' :
                  isRevisionPending ? 'Waiting for Revised Submission' :
                    currentRevisions >= maxRevisions ? 'Limit Reached' : 'Action Unavailable'}
              </h4>
              <p style={{ margin: 0, fontSize: '14px' }}>
                {hasPendingRevisionRequest
                  ? 'You have already submitted a revision request for this round. Please wait for the author to submit their revised version.'
                  : isRevisionPending
                    ? 'A revision has been requested. You must wait for the author to submit their revised version before you can request further changes.'
                    : currentRevisions >= maxRevisions
                      ? 'The maximum number of revisions (3) has been reached for this chapter.'
                      : 'You cannot request a revision in the current status.'}
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>
              Why is a revision needed? (This will be sent to the author)
            </label>
            <textarea
              placeholder="Describe the specific changes required..."
              value={revisionNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              className={styles.textarea}
              rows={6}
            />
            <div className={styles.formActions} style={{ marginTop: '16px' }}>
              <button
                className={styles.submitBtn}
                onClick={onSubmit}
                disabled={isSubmitting || !revisionNotes.trim()}
                style={{ backgroundColor: '#f59e0b' }} // Orange/Warning color needed for revision
              >
                {isSubmitting ? 'Sending Request...' : 'Request Revision'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerAssignmentDetailView;