// Reviewer Chapter Action Modals
import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { ReviewerRecommendation, type IndividualChapter } from '../../../types/chapterTypes';
import chapterService from '../../../services/chapter.service';
import styles from './reviewerChapterModals.module.css';

// Accept Assignment Modal
interface AcceptAssignmentModalProps {
    assignmentId: number;
    chapter: IndividualChapter;
    deadline: Date;
    onClose: () => void;
    onSuccess: () => void;
}

export const AcceptAssignmentModal: React.FC<AcceptAssignmentModalProps> = ({
    assignmentId,
    chapter,
    deadline,
    onClose,
    onSuccess,
}) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await chapterService.respondToAssignment(assignmentId, 'accept');

            if (response.success) {
                onSuccess();
            } else {
                setError('Failed to accept assignment');
            }
        } catch (err) {
            console.error('Error accepting assignment:', err);
            setError('Failed to accept assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Accept Review Assignment</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <p className={styles.chapterTitle}>
                        <strong>Chapter:</strong> {chapter.chapterTitle}
                    </p>

                    <div className={styles.infoBox}>
                        <AlertCircle size={14} />
                        <span>
                            By accepting this assignment, you agree to review this chapter and submit your review by{' '}
                            <strong>{new Date(deadline).toLocaleDateString()}</strong>.
                        </span>
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Optional Notes</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Add any notes or questions for the editor..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.successButton}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Accepting...' : 'Accept Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Decline Assignment Modal
interface DeclineAssignmentModalProps {
    assignmentId: number;
    chapterTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const DeclineAssignmentModal: React.FC<DeclineAssignmentModalProps> = ({
    assignmentId,
    chapterTitle,
    onClose,
    onSuccess,
}) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for declining');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await chapterService.respondToAssignment(assignmentId, 'reject', reason);

            if (response.success) {
                onSuccess();
            } else {
                setError(response.message || response.error || 'Failed to decline assignment');
            }
        } catch (err) {
            console.error('Error declining assignment:', err);
            setError('Failed to decline assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Decline Review Assignment</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <p className={styles.chapterTitle}>
                        <strong>Chapter:</strong> {chapterTitle}
                    </p>

                    <div className={styles.warningMessage}>
                        <AlertCircle size={14} />
                        <span>
                            The editor will be notified of your decline and may assign another reviewer.
                        </span>
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Reason for Declining *</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Please explain why you cannot review this chapter..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.dangerButton}
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? 'Declining...' : 'Decline Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Submit Review Modal
interface SubmitReviewModalProps {
    assignmentId: number;
    chapter: IndividualChapter;
    onClose: () => void;
    onSuccess: () => void;
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
    assignmentId,
    chapter,
    onClose,
    onSuccess,
}) => {
    const [recommendation, setRecommendation] = useState<ReviewerRecommendation | ''>('');
    const [commentsForAuthor, setCommentsForAuthor] = useState('');
    const [confidentialComments, setConfidentialComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!recommendation) {
            setError('Please select a recommendation');
            return;
        }

        if (!commentsForAuthor.trim()) {
            setError('Please provide comments for the author');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await chapterService.submitReview({
                assignmentId,
                recommendation,
                comments: commentsForAuthor,
                confidentialComments,
            });

            if (response.success) {
                onSuccess();
            } else {
                setError('Failed to submit review');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={`${styles.modal} ${styles.largeModal}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Submit Chapter Review</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <p className={styles.chapterTitle}>
                        <strong>Chapter:</strong> {chapter.chapterTitle}
                    </p>

                    {error && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Recommendation */}
                    <div className={styles.formGroup}>
                        <label>Recommendation *</label>
                        <div className={styles.recommendationButtons}>
                            <button
                                type="button"
                                className={`${styles.recommendationOption} ${recommendation === ReviewerRecommendation.ACCEPT ? styles.selected : ''}`}
                                onClick={() => setRecommendation(ReviewerRecommendation.ACCEPT)}
                            >
                                <CheckCircle size={16} />
                                <span>Accept</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.recommendationOption} ${recommendation === ReviewerRecommendation.MINOR_REVISION ? styles.selected : ''}`}
                                onClick={() => setRecommendation(ReviewerRecommendation.MINOR_REVISION)}
                            >
                                <FileText size={16} />
                                <span>Minor Revision</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.recommendationOption} ${recommendation === ReviewerRecommendation.MAJOR_REVISION ? styles.selected : ''}`}
                                onClick={() => setRecommendation(ReviewerRecommendation.MAJOR_REVISION)}
                            >
                                <AlertCircle size={16} />
                                <span>Major Revision</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.recommendationOption} ${recommendation === ReviewerRecommendation.REJECT ? styles.selected : ''}`}
                                onClick={() => setRecommendation(ReviewerRecommendation.REJECT)}
                            >
                                <XCircle size={16} />
                                <span>Reject</span>
                            </button>
                        </div>
                    </div>



                    {/* Comments for Author */}
                    <div className={styles.formGroup}>
                        <label>Comments for Author *</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Provide detailed feedback for the author..."
                            value={commentsForAuthor}
                            onChange={(e) => setCommentsForAuthor(e.target.value)}
                            rows={6}
                            disabled={loading}
                        />
                    </div>

                    {/* Confidential Comments */}
                    <div className={styles.formGroup}>
                        <label>Confidential Comments for Editor</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Add any confidential notes for the editor (not visible to author)..."
                            value={confidentialComments}
                            onChange={(e) => setConfidentialComments(e.target.value)}
                            rows={4}
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.infoBox}>
                        <AlertCircle size={14} />
                        <span>
                            Once submitted, your review will be sent to the editor and author. This action cannot be undone.
                        </span>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.primaryButton}
                        onClick={handleSubmit}
                        disabled={loading || !recommendation || !commentsForAuthor.trim()}
                    >
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};
