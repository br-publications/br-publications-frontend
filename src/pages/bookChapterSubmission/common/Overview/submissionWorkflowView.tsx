import React from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import type { BookChapterSubmission } from '../../../../types/submissionTypes';
import styles from './submissionWorkflowView.module.css';

interface SubmissionWorkflowViewProps {
  submission: BookChapterSubmission;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'active' | 'pending';
  date?: string;
  details?: string;
}

/**
 * Submission Workflow View Component
 * Displays the submission workflow status with timeline visualization
 *
 * Updated for 10-status flow:
 * ABSTRACT_SUBMITTED, MANUSCRIPTS_PENDING, REVIEWER_ASSIGNMENT, UNDER_REVIEW,
 * EDITORIAL_REVIEW, APPROVED, ISBN_APPLIED, PUBLICATION_IN_PROGRESS,
 * PUBLISHED, REJECTED
 */
export const SubmissionWorkflowView: React.FC<SubmissionWorkflowViewProps> = ({ submission }) => {

  const getWorkflowSteps = (): WorkflowStep[] => {
    // Define the logical order of statuses for progress tracking
    const statusOrder = [
      'ABSTRACT_SUBMITTED',
      'MANUSCRIPTS_PENDING',
      'REVIEWER_ASSIGNMENT',
      'UNDER_REVIEW',
      'EDITORIAL_REVIEW',
      'APPROVED',
      'ISBN_APPLIED',
      'PUBLICATION_IN_PROGRESS',
      'PUBLISHED',
    ];

    const currentStatusIndex = statusOrder.indexOf(submission.status);
    const isRejected = submission.status === 'REJECTED';

    // Helper to check if a step is completed based on status index
    const isStepCompleted = (targetStatus: string) => {
      if (isRejected) {
        return true; // All prior steps considered done
      }
      const targetIndex = statusOrder.indexOf(targetStatus);
      return currentStatusIndex > targetIndex;
    };

    const isStepActive = (targetStatus: string) => {
      return submission.status === targetStatus;
    };

    const steps: WorkflowStep[] = [
      // Step 1: Submission Received
      {
        id: 'submitted',
        title: 'Submission Received',
        description: 'Abstract submitted successfully',
        icon: <CheckCircle size={14} />,
        status: 'completed',
        date: new Date(submission.submissionDate).toLocaleDateString(),
      },

      // Step 2: Submission Analysis
      {
        id: 'submission_analysis',
        title: 'Submission Analysis',
        description: 'Editor reviewing the submission',
        icon: isStepCompleted('ABSTRACT_SUBMITTED') ? <CheckCircle size={14} /> : <Clock size={14} />,
        status: isStepCompleted('ABSTRACT_SUBMITTED') ? 'completed' : (isStepActive('ABSTRACT_SUBMITTED') ? 'active' : 'pending'),
        details: isStepActive('ABSTRACT_SUBMITTED') ? 'Editor is analyzing the abstract...' : undefined,
      },

      // Step 3: Manuscript Submission
      {
        id: 'manuscripts_pending',
        title: 'Manuscript Submission',
        description: 'Upload all chapters manuscript',
        icon: isStepCompleted('MANUSCRIPTS_PENDING') ? <CheckCircle size={14} /> : <Clock size={14} />,
        status: isStepCompleted('MANUSCRIPTS_PENDING') ? 'completed' : (isStepActive('MANUSCRIPTS_PENDING') ? 'active' : 'pending'),
        details: isStepActive('MANUSCRIPTS_PENDING') ? 'Waiting for authors to upload chapters...' : undefined,
      },

      // Step 4: Reviewer Assignment
      {
        id: 'reviewer_assignment',
        title: 'Reviewer Assignment',
        description: 'Assigning peer reviewers',
        icon: isStepCompleted('REVIEWER_ASSIGNMENT') ? <CheckCircle size={14} /> : <Clock size={14} />,
        status: isStepCompleted('REVIEWER_ASSIGNMENT') ? 'completed' : (isStepActive('REVIEWER_ASSIGNMENT') ? 'active' : 'pending'),
        details: isStepActive('REVIEWER_ASSIGNMENT') ? 'Editor is assigning peer reviewers...' : undefined,
      },

      // Step 5: Peer Review
      {
        id: 'under_review',
        title: 'Peer Review',
        description: 'Expert evaluation of the manuscript',
        icon: isStepCompleted('UNDER_REVIEW') ? <CheckCircle size={14} /> : <Clock size={14} />,
        status: isStepCompleted('UNDER_REVIEW') ? 'completed' : (isStepActive('UNDER_REVIEW') ? 'active' : 'pending'),
        details: isStepActive('UNDER_REVIEW') ? 'Reviewers are evaluating the manuscripts...' : undefined,
      },

      // Step 6: Editorial Review
      {
        id: 'editorial_review',
        title: 'Editorial Review',
        description: 'Editorial decision',
        icon: isStepCompleted('EDITORIAL_REVIEW') ? <CheckCircle size={14} /> : <Clock size={14} />,
        status: isStepCompleted('EDITORIAL_REVIEW') ? 'completed' : (isStepActive('EDITORIAL_REVIEW') ? 'active' : 'pending'),
        details: isStepActive('EDITORIAL_REVIEW') ? 'Editor is making final decisions...' : undefined,
      },
    ];

    // If rejected, add rejection step and stop
    if (isRejected) {
      steps.push({
        id: 'rejected',
        title: 'Submission Rejected',
        description: 'Submission was not accepted',
        icon: <AlertCircle size={14} />,
        status: 'completed',
        details: 'Submission process ended.',
      });
      return steps;
    }

    // Step 7: Proof Editing
    steps.push({
      id: 'proof_editing',
      title: 'Proof Editing',
      description: 'Book chapter undergoing proof editing',
      icon: isStepCompleted('APPROVED') ? <CheckCircle size={14} /> : <Clock size={14} />,
      status: isStepCompleted('APPROVED') ? 'completed' : (isStepActive('APPROVED') ? 'active' : 'pending'),
      details: isStepActive('APPROVED') ? 'Approved — proof editing starting soon...' : undefined,
    });

    // Step 8: Start Publication
    steps.push({
      id: 'start_publication',
      title: 'Start Publication',
      description: 'ISBN & DOI recorded by admin — publication initiated',
      icon: isStepCompleted('ISBN_APPLIED') ? <CheckCircle size={14} /> : <Clock size={14} />,
      status: isStepCompleted('ISBN_APPLIED') ? 'completed' : (isStepActive('ISBN_APPLIED') ? 'active' : 'pending'),
      details: isStepActive('ISBN_APPLIED') ? 'Proof editing in progress — waiting for admin to enter ISBN & start publication...' : undefined,
    });

    // Step 9: Awaiting Publication
    steps.push({
      id: 'awaiting_publication',
      title: 'Awaiting Publication',
      description: 'Ready to publish, preparing materials',
      icon: isStepCompleted('PUBLICATION_IN_PROGRESS') ? <CheckCircle size={14} /> : <Clock size={14} />,
      status: isStepCompleted('PUBLICATION_IN_PROGRESS') ? 'completed' : (isStepActive('PUBLICATION_IN_PROGRESS') ? 'active' : 'pending'),
      details: isStepActive('PUBLICATION_IN_PROGRESS') ? 'Preparing publication materials...' : undefined,
    });

    // Step 10: Published
    steps.push({
      id: 'published',
      title: 'Published',
      description: 'Book chapter published',
      icon: submission.status === 'PUBLISHED' ? <CheckCircle size={14} /> : <Clock size={14} />,
      status: submission.status === 'PUBLISHED' ? 'completed' : 'pending',
    });

    return steps;
  };

  const workflowSteps = getWorkflowSteps();
  const completedCount = workflowSteps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedCount / workflowSteps.length) * 100;

  return (
    <div className={styles.container}>
      {/* Progress Summary */}
      <div className={styles.progressSummary}>
        <div className={styles.progressInfo}>
          <h3 className={styles.progressTitle}>Submission Progress</h3>
          <p className={styles.progressText}>
            {completedCount} of {workflowSteps.length} steps completed
          </p>
        </div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className={styles.progressPercent}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        {workflowSteps.map((step, index) => (
          <div key={step.id} className={styles.timelineItem}>
            {/* Connector Line */}
            {index < workflowSteps.length - 1 && (
              <div
                className={`${styles.connector} ${step.status === 'completed' ? styles.connectorCompleted : ''
                  }`}
              />
            )}

            {/* Step Circle */}
            <div
              className={`${styles.stepCircle} ${styles[`status-${step.status}`]}`}
            >
              {step.icon}
            </div>

            {/* Step Content */}
            <div className={styles.stepContent}>
              <div className={styles.stepHeader}>
                <h4 className={styles.stepTitle}>{step.title}</h4>
                {step.date && (
                  <span className={styles.stepDate}>{step.date}</span>
                )}
              </div>

              <p className={styles.stepDescription}>{step.description}</p>

              {step.details && (
                <div className={styles.stepDetails}>
                  {step.status === 'active' && (
                    <span className={styles.activeBadge}>In Progress</span>
                  )}
                  <p className={styles.detailsText}>{step.details}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.completed}`}>
            <CheckCircle size={14} />
          </div>
          <span>Completed</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.active}`}>
            <Clock size={14} />
          </div>
          <span>In Progress</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendIcon} ${styles.pending}`}>
            <ChevronRight size={14} />
          </div>
          <span>Pending</span>
        </div>
      </div>

      {/* Contextual Information Boxes */}
      {submission.status === 'ABSTRACT_SUBMITTED' && (
        <div className={`${styles.infoBox} ${styles.warningBox}`}>
          <Clock size={14} />
          <div>
            <h4>Submission Received</h4>
            <p>
              Your abstract has been received and is awaiting editor review.
              You will be notified once a decision is made.
            </p>
          </div>
        </div>
      )}

      {submission.status === 'MANUSCRIPTS_PENDING' && (
        <div className={`${styles.infoBox} ${styles.warningBox}`}>
          <Clock size={14} />
          <div>
            <h4>Ready for Manuscript Upload</h4>
            <p>
              Your abstract has been accepted. Please upload full chapter manuscripts
              to proceed with the peer review process.
            </p>
          </div>
        </div>
      )}

      {submission.status === 'UNDER_REVIEW' && (
        <div className={`${styles.infoBox} ${styles.warningBox}`}>
          <Clock size={14} />
          <div>
            <h4>Under Peer Review</h4>
            <p>
              Your manuscripts are currently being reviewed by expert peers. This
              process typically takes 4-8 weeks. You will be notified when the
              review is complete.
            </p>
          </div>
        </div>
      )}

      {submission.status === 'EDITORIAL_REVIEW' && (
        <div className={`${styles.infoBox} ${styles.warningBox}`}>
          <Clock size={14} />
          <div>
            <h4>Editorial Review</h4>
            <p>
              The editor is reviewing peer feedback and making decisions for each
              chapter. You will be notified once all chapter decisions are made.
            </p>
          </div>
        </div>
      )}

      {submission.status === 'ISBN_APPLIED' && (
        <div className={`${styles.infoBox} ${styles.warningBox}`}>
          <Clock size={14} />
          <div>
            <h4>Proof Editing in Progress</h4>
            <p>
              Proof editing is underway. Once complete, the admin will enter the
              ISBN (mandatory) and DOI (optional) to start publication.
            </p>
          </div>
        </div>
      )}

      {(submission.status === 'APPROVED' || submission.status === 'PUBLISHED' || submission.status === 'PUBLICATION_IN_PROGRESS') && (
        <div className={`${styles.infoBox} ${styles.successBox}`}>
          <CheckCircle size={14} />
          <div>
            <h4>Congratulations!</h4>
            <p>
              {submission.status === 'PUBLISHED'
                ? 'Your book chapter has been published!'
                : submission.status === 'PUBLICATION_IN_PROGRESS'
                  ? 'Your book is being prepared for publication.'
                  : 'All chapters have been approved for publication.'}
              {submission.isbn && ` ISBN: ${submission.isbn}`}
              {submission.doi && ` | DOI: ${submission.doi}`}
            </p>
          </div>
        </div>
      )}

      {submission.status === 'REJECTED' && (
        <div className={`${styles.infoBox} ${styles.errorBox}`}>
          <AlertCircle size={14} />
          <div>
            <h4>Submission Not Accepted</h4>
            <p>
              Unfortunately, your submission was not accepted at this time. You
              can contact the editor for detailed feedback and consider
              resubmitting in the future.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionWorkflowView;