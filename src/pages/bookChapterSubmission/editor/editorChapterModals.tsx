// Editor Chapter Action Modals
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, AlertCircle } from 'lucide-react';
import type { IndividualChapter } from '../../../types/chapterTypes';
import chapterService from '../../../services/chapter.service';
import { userService, type User as UserServiceUser } from '../../../services/user.service';
import styles from './editorChapterModals.module.css';

// Assign Reviewers Modal
interface AssignReviewersModalProps {
    chapter: IndividualChapter;
    onClose: () => void;
    onSuccess: () => void;
}

export const AssignReviewersModal: React.FC<AssignReviewersModalProps> = ({
    chapter,
    onClose,
    onSuccess,
}) => {
    const [reviewer1Id, setReviewer1Id] = useState('');
    const [reviewer2Id, setReviewer2Id] = useState('');
    const [reviewers, setReviewers] = useState<UserServiceUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadReviewers();
    }, []);

    const loadReviewers = async () => {
        try {
            const response = await userService.getReviewers();
            if (response.success && response.data) {
                setReviewers(response.data.users || []);
            }
        } catch (err) {
            console.error('Error loading reviewers:', err);
            setError('Failed to load reviewers');
        }
    };

    // Compute how many slots need to be filled
    const existingAssignments = chapter.reviewerAssignments || [];
    const activeAssignments = existingAssignments.filter(a => a.status !== 'DECLINED' && a.status !== 'REJECTED');
    const assignedReviewerIds = new Set(existingAssignments.map(a => a.reviewerId));
    const slotsNeeded = Math.max(0, 2 - activeAssignments.length);
    const isReplacementMode = activeAssignments.length > 0 && slotsNeeded === 1;

    const handleSubmit = async () => {
        const newReviewerIds: number[] = [];

        if (slotsNeeded >= 1) {
            if (!reviewer1Id) {
                setError(slotsNeeded === 1 ? 'Please select a replacement reviewer' : 'Please select Reviewer 1');
                return;
            }
            newReviewerIds.push(parseInt(reviewer1Id));
        }

        if (slotsNeeded >= 2) {
            if (!reviewer2Id) {
                setError('Please select Reviewer 2');
                return;
            }
            if (reviewer1Id === reviewer2Id) {
                setError('Please select different reviewers');
                return;
            }
            newReviewerIds.push(parseInt(reviewer2Id));
        }

        setLoading(true);
        setError(null);

        try {
            const response = await chapterService.assignReviewers({
                chapterId: chapter.id,
                reviewerIds: newReviewerIds,
            });

            if (response.success) {
                onSuccess();
            } else {
                setError('Failed to assign reviewers');
            }
        } catch (err) {
            console.error('Error assigning reviewers:', err);
            setError('Failed to assign reviewers');
        } finally {
            setLoading(false);
        }
    };

    // Filter out already-assigned reviewers (including declined/rejected) from dropdown options
    const availableReviewers = reviewers.filter(r => !assignedReviewerIds.has(r.id));

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{isReplacementMode ? 'Assign Replacement Reviewer' : 'Assign Reviewers to Chapter'}</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <p className={styles.chapterTitle}>
                        <strong>Chapter:</strong> {chapter.chapterTitle}
                    </p>

                    {isReplacementMode && (
                        <div className={styles.infoBox} style={{ marginBottom: '12px' }}>
                            <AlertCircle size={14} />
                            <span>A reviewer declined or was rejected. Please assign a replacement reviewer.</span>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Slot 1 - always shown when slots are needed */}
                    {slotsNeeded >= 1 && (
                        <div className={styles.formGroup}>
                            <label>{isReplacementMode ? 'Replacement Reviewer' : 'Reviewer 1'}</label>
                            <select
                                value={reviewer1Id}
                                onChange={(e) => setReviewer1Id(e.target.value)}
                                className={styles.select}
                                disabled={loading}
                            >
                                <option value="">{isReplacementMode ? 'Select Replacement Reviewer' : 'Select Reviewer 1'}</option>
                                {availableReviewers.map((r) => (
                                    <option
                                        key={r.id}
                                        value={r.id.toString()}
                                        disabled={slotsNeeded >= 2 && r.id.toString() === reviewer2Id}
                                    >
                                        {r.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Slot 2 - only shown when 2 slots needed */}
                    {slotsNeeded >= 2 && (
                        <div className={styles.formGroup}>
                            <label>Reviewer 2</label>
                            <select
                                value={reviewer2Id}
                                onChange={(e) => setReviewer2Id(e.target.value)}
                                className={styles.select}
                                disabled={loading}
                            >
                                <option value="">Select Reviewer 2</option>
                                {availableReviewers.map((r) => (
                                    <option
                                        key={r.id}
                                        value={r.id.toString()}
                                        disabled={r.id.toString() === reviewer1Id}
                                    >
                                        {r.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.infoBox}>
                        <Users size={14} />
                        <span>
                            {isReplacementMode
                                ? 'The replacement reviewer will be notified and has 30 days to complete their review.'
                                : 'Both reviewers will be notified and have 30 days to complete their review.'}
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
                        disabled={loading || !reviewer1Id || (slotsNeeded >= 2 && !reviewer2Id)}
                    >
                        {loading ? 'Assigning...' : isReplacementMode ? 'Assign Replacement' : 'Assign Reviewers'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Request Revision Modal
interface RequestRevisionModalProps {
    chapter: IndividualChapter;
    onClose: () => void;
    onSuccess: () => void;
}

export const RequestRevisionModal: React.FC<RequestRevisionModalProps> = ({
    chapter,
    onClose,
    onSuccess,
}) => {
    const [comments, setComments] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Set default deadline to 14 days from now
    useEffect(() => {
        const defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 14);
        setDeadline(defaultDeadline.toISOString().split('T')[0]);
    }, []);

    const handleSubmit = async () => {
        if (!comments.trim()) {
            setError('Please provide revision comments');
            return;
        }

        if (!deadline) {
            setError('Please set a deadline');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await chapterService.requestRevision({
                chapterId: chapter.id,
                reviewerComments: comments,
            });

            if (response.success) {
                onSuccess();
            } else {
                setError('Failed to request revision');
            }
        } catch (err) {
            console.error('Error requesting revision:', err);
            setError('Failed to request revision');
        } finally {
            setLoading(false);
        }
    };

    const revisionCount = chapter.revisionCount || 0;
    const maxRevisions = 3;
    const canRequestRevision = revisionCount < maxRevisions;

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Request Chapter Revision</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <p className={styles.chapterTitle}>
                        <strong>Chapter:</strong> {chapter.chapterTitle}
                    </p>

                    {!canRequestRevision ? (
                        <div className={styles.warningMessage}>
                            <AlertCircle size={14} />
                            <span>Maximum revision limit ({maxRevisions}) reached for this chapter.</span>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className={styles.errorMessage}>
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className={styles.revisionInfo}>
                                <span>Revision {revisionCount + 1} of {maxRevisions}</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Revision Comments *</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Explain what needs to be revised and why..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={6}
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Deadline *</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.infoBox}>
                                <AlertCircle size={14} />
                                <span>The author will be notified and asked to submit a revised manuscript.</span>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    {canRequestRevision && (
                        <button
                            className={styles.warningButton}
                            onClick={handleSubmit}
                            disabled={loading || !comments.trim() || !deadline}
                        >
                            {loading ? 'Requesting...' : 'Request Revision'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Final Decision Modal
interface FinalDecisionModalProps {
    chapter: IndividualChapter;
    onClose: () => void;
    onSuccess: () => void;
}

export const FinalDecisionModal: React.FC<FinalDecisionModalProps> = ({
    chapter,
    onClose,
    onSuccess,
}) => {
    const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!decision) {
            setError('Please select a decision');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await chapterService.makeEditorDecision({
                chapterId: chapter.id,
                decision,
                notes,
            });

            if (response.success) {
                onSuccess();
            } else {
                setError('Failed to submit decision');
            }
        } catch (err) {
            console.error('Error submitting decision:', err);
            setError('Failed to submit decision');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Make Final Decision</h3>
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
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.decisionButtons}>
                        <button
                            className={`${styles.decisionOption} ${decision === 'APPROVED' ? styles.selected : ''}`}
                            onClick={() => setDecision('APPROVED')}
                            disabled={loading}
                        >
                            <CheckCircle size={20} />
                            <span>Approve Chapter</span>
                        </button>
                        <button
                            className={`${styles.decisionOption} ${decision === 'REJECTED' ? styles.selected : ''}`}
                            onClick={() => setDecision('REJECTED')}
                            disabled={loading}
                        >
                            <XCircle size={20} />
                            <span>Reject Chapter</span>
                        </button>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Decision Notes {decision === 'REJECTED' && '*'}</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Add notes for the author..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.infoBox}>
                        <AlertCircle size={14} />
                        <span>
                            {decision === 'APPROVED'
                                ? 'The author will be notified of the approval. This chapter will count toward publishing eligibility.'
                                : decision === 'REJECTED'
                                    ? 'The author will be notified of the rejection. This chapter will not be published.'
                                    : 'Select your final decision for this chapter.'}
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
                        className={decision === 'APPROVED' ? styles.successButton : styles.dangerButton}
                        onClick={handleSubmit}
                        disabled={loading || !decision || (decision === 'REJECTED' && !notes.trim())}
                    >
                        {loading ? 'Submitting...' : decision === 'APPROVED' ? 'Approve Chapter' : 'Reject Chapter'}
                    </button>
                </div>
            </div>
        </div>
    );
};
