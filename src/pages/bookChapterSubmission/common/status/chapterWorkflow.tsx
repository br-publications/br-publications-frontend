import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { IndividualChapter } from '../../../../types/chapterTypes';
import styles from '../Overview/submissionWorkflowView.module.css';

interface ChapterWorkflowProps {
    chapter: IndividualChapter;
}

interface WorkflowStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    status: 'completed' | 'active' | 'pending';
    details?: string;
}

/**
 * Chapter Workflow Component
 * Displays the workflow for an individual chapter
 * 
 * Steps:
 * 1. Manuscript Submitted
 * 2. Reviewer Assignment
 * 3. Peer Review (includes revisions)
 * 4. Peer Review Decision
 * 5. Editor Decision
 */
export const ChapterWorkflow: React.FC<ChapterWorkflowProps> = ({ chapter }) => {
    const getWorkflowSteps = (): WorkflowStep[] => {
        const steps: WorkflowStep[] = [];

        // Step 1: Manuscript Submitted
        const hasManuscript = chapter.manuscriptFileId !== null;
        steps.push({
            id: 'manuscript_submitted',
            title: 'Manuscript Submitted',
            description: 'Chapter manuscript uploaded',
            icon: hasManuscript ? <CheckCircle size={14} /> : <Clock size={14} />,
            status: hasManuscript ? 'completed' : 'active',
            details: hasManuscript ? 'Manuscript received' : 'Waiting for manuscript upload...',
        });

        // Step 2: Reviewer Assignment
        const hasReviewers = chapter.assignedReviewers && chapter.assignedReviewers.length > 0;
        const isAssigningReviewers = hasManuscript && !hasReviewers;
        // If we have reviewers, it's at least active. It's completed if we've moved PAST assignment
        // Moving past assignment means we are in 'UNDER_REVIEW' or later
        const isPastAssignment = ['UNDER_REVIEW', 'REVISION_REQUESTED', 'ADDITIONAL_REVISION_REQUESTED', 'REVISION_SUBMITTED', 'EDITORIAL_REVIEW', 'CHAPTER_APPROVED', 'CHAPTER_REJECTED'].includes(chapter.status);

        steps.push({
            id: 'reviewer_assignment',
            title: 'Reviewer Assignment',
            description: 'Assigning peer reviewers',
            icon: isPastAssignment ? <CheckCircle size={14} /> : <Clock size={14} />,
            status: isPastAssignment ? 'completed' : (hasReviewers ? 'active' : (isAssigningReviewers ? 'active' : 'pending')),
            details: hasReviewers
                ? (isPastAssignment ? 'Reviewers assigned' : 'Reviewers invited / pending acceptance')
                : (isAssigningReviewers ? 'Waiting for reviewer assignment...' : undefined),
        });

        // Step 3: Peer Review (includes revisions)
        const isUnderReview = ['UNDER_REVIEW', 'REVISION_REQUESTED', 'REVISION_SUBMITTED'].includes(chapter.status);
        const isReviewCompleted = ['EDITORIAL_REVIEW', 'CHAPTER_APPROVED', 'CHAPTER_REJECTED'].includes(chapter.status);

        let peerReviewDetails = '';
        const currentRev = chapter.currentRevisionNumber || chapter.revisionCount || 1;

        if (chapter.status === 'REVISION_REQUESTED') {
            peerReviewDetails = `Revision ${currentRev} requested`;
        } else if (chapter.status === 'REVISION_SUBMITTED') {
            peerReviewDetails = `Revision ${currentRev} submitted, under review`;
        } else if (chapter.status === 'UNDER_REVIEW') {
            peerReviewDetails = 'Reviewers evaluating manuscript';
        }

        steps.push({
            id: 'peer_review',
            title: 'Peer Review',
            description: 'Expert evaluation of the manuscript',
            icon: isReviewCompleted ? <CheckCircle size={14} /> : <Clock size={14} />,
            status: isReviewCompleted ? 'completed' : (isUnderReview ? 'active' : 'pending'),
            details: peerReviewDetails || undefined,
        });

        // Step 4: Editorial Review
        const isEditorialReviewActive = chapter.status === 'EDITORIAL_REVIEW';
        const isEditorialReviewCompleted = ['CHAPTER_APPROVED', 'CHAPTER_REJECTED'].includes(chapter.status);

        steps.push({
            id: 'editorial_review',
            title: 'Editorial Review',
            description: 'Editor making chapter decision',
            icon: isEditorialReviewCompleted ? <CheckCircle size={14} /> : <Clock size={14} />,
            status: isEditorialReviewCompleted ? 'completed' : (isEditorialReviewActive ? 'active' : 'pending'),
            details: isEditorialReviewCompleted ? 'Review completed' : (isEditorialReviewActive ? 'Reviewer feedback under evaluation...' : undefined),
        });

        // Step 5: Editor Decision
        const hasEditorDecision = !!chapter.editorDecision && (chapter.editorDecision === 'APPROVED' || chapter.editorDecision === 'REJECTED');
        const isFinalDecisionPhase = chapter.status === 'EDITORIAL_REVIEW';

        steps.push({
            id: 'editor_decision',
            title: 'Editor Decision',
            description: 'Editor making final decision',
            icon: hasEditorDecision
                ? (chapter.editorDecision === 'APPROVED' ? <CheckCircle size={14} /> : <AlertCircle size={14} />)
                : <Clock size={14} />,
            status: hasEditorDecision ? 'completed' : 'pending',
            details: hasEditorDecision
                ? (chapter.editorDecision === 'APPROVED' ? 'Chapter Approved' : 'Chapter Rejected')
                : (isFinalDecisionPhase ? 'Decision pending...' : undefined),
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
                    <h3 className={styles.progressTitle}>Chapter Progress</h3>
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



            {/* Decision Info */}
            {chapter.editorDecision && (
                <div className={`${styles.infoBox} ${chapter.editorDecision === 'APPROVED' ? styles.successBox : styles.errorBox}`}>
                    {chapter.editorDecision === 'APPROVED' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    <div>
                        <h4>{chapter.editorDecision === 'APPROVED' ? 'Chapter Approved' : 'Chapter Rejected'}</h4>
                        <p>
                            {chapter.editorDecisionNotes ||
                                (chapter.editorDecision === 'APPROVED'
                                    ? 'This chapter has been approved for publication.'
                                    : 'This chapter was not accepted.')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChapterWorkflow;
