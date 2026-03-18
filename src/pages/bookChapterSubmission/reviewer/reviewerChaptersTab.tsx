// Reviewer Chapters Tab Component
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import type { IndividualChapter } from '../../../types/chapterTypes';
import ChapterDetailModal from '../common/chapters/chapterDetailModal';
import { AcceptAssignmentModal, DeclineAssignmentModal, SubmitReviewModal } from './reviewerChapterModals';
import styles from './reviewerChaptersTab.module.css';

interface ChapterAssignment {
    id: number;
    chapterId: number;
    chapter: IndividualChapter;
    reviewerId: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DECLINED' | 'COMPLETED';
    assignedAt: Date;
    deadline: Date;
    respondedAt?: Date;
}

interface ReviewerChaptersTabProps {
    reviewerId: number;
    submissionId?: number;
}

export const ReviewerChaptersTab: React.FC<ReviewerChaptersTabProps> = ({
    reviewerId,
    submissionId,
}) => {
    const [assignments, setAssignments] = useState<ChapterAssignment[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<IndividualChapter | null>(null);
    const [showChapterDetail, setShowChapterDetail] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [responseType, setResponseType] = useState<'accept' | 'decline' | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<ChapterAssignment | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAssignments = async () => {
            setLoading(true);
            setError(null);
            try {
                // TODO: Implement API call to get reviewer's chapter assignments
                setAssignments([]);
            } catch (err) {
                console.error('Error loading assignments:', err);
                setError('Failed to load chapter assignments');
            } finally {
                setLoading(false);
            }
        };
        loadAssignments();
    }, [reviewerId, submissionId]);

    const handleChapterClick = (chapter: IndividualChapter) => {
        setSelectedChapter(chapter);
        setShowChapterDetail(true);
    };

    const handleAcceptAssignment = (assignment: ChapterAssignment) => {
        setSelectedAssignment(assignment);
        setResponseType('accept');
        setShowResponseModal(true);
    };

    const handleDeclineAssignment = (assignment: ChapterAssignment) => {
        setSelectedAssignment(assignment);
        setResponseType('decline');
        setShowResponseModal(true);
    };

    const handleSubmitReview = (assignment: ChapterAssignment) => {
        setSelectedAssignment(assignment);
        setSelectedChapter(assignment.chapter);
        setShowReviewModal(true);
    };

    const filteredAssignments = assignments.filter((assignment) => {
        if (filterStatus === 'all') return true;
        return assignment.status.toLowerCase() === filterStatus;
    });

    const pendingCount = assignments.filter((a) => a.status === 'PENDING').length;
    const acceptedCount = assignments.filter((a) => a.status === 'ACCEPTED').length;
    const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;

    return (
        <div className={styles.container}>
            {/* Statistics */}
            <div className={styles.statsSection}>
                <div className={styles.statCard}>
                    <Clock size={20} />
                    <div className={styles.statContent}>
                        <span className={styles.statCount}>{pendingCount}</span>
                        <span className={styles.statLabel}>Pending Response</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <CheckCircle size={20} />
                    <div className={styles.statContent}>
                        <span className={styles.statCount}>{acceptedCount}</span>
                        <span className={styles.statLabel}>Accepted</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <FileText size={20} />
                    <div className={styles.statContent}>
                        <span className={styles.statCount}>{completedCount}</span>
                        <span className={styles.statLabel}>Reviews Completed</span>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className={styles.filterSection}>
                <label>Filter by Status:</label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">All Assignments</option>
                    <option value="pending">Pending Response</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined/Rejected</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.errorMessage}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className={styles.loading}>Loading assignments...</div>
            ) : filteredAssignments.length > 0 ? (
                <div className={styles.assignmentsSection}>
                    <h3>Chapter Assignments</h3>
                    <div className={styles.assignmentsList}>
                        {filteredAssignments.map((assignment) => (
                            <div key={assignment.id} className={styles.assignmentCard}>
                                <div className={styles.assignmentHeader}>
                                    <h4 onClick={() => handleChapterClick(assignment.chapter)}>
                                        {assignment.chapter.chapterTitle}
                                    </h4>
                                    <div className={`${styles.statusBadge} ${styles[assignment.chapter.status.toLowerCase()]}`}>
                                        {assignment.chapter.status}
                                    </div>
                                </div>

                                <div className={styles.assignmentMeta}>
                                    <span>
                                        <strong>Status:</strong>{' '}
                                        <span className={`${styles.assignmentStatus} ${styles[assignment.status.toLowerCase()]}`}>
                                            {assignment.status}
                                        </span>
                                    </span>
                                    <span>
                                        <strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleDateString()}
                                    </span>
                                    {assignment.respondedAt && (
                                        <span>
                                            <strong>Responded:</strong> {new Date(assignment.respondedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.assignmentActions}>
                                    {assignment.status === 'PENDING' && (
                                        <>
                                            <button
                                                className={styles.acceptButton}
                                                onClick={() => handleAcceptAssignment(assignment)}
                                            >
                                                <CheckCircle size={14} /> Accept
                                            </button>
                                            <button
                                                className={styles.declineButton}
                                                onClick={() => handleDeclineAssignment(assignment)}
                                            >
                                                <AlertCircle size={14} /> Decline/Reject
                                            </button>
                                        </>
                                    )}

                                    {assignment.status === 'ACCEPTED' && (
                                        <button
                                            className={styles.reviewButton}
                                            onClick={() => handleSubmitReview(assignment)}
                                        >
                                            <FileText size={14} /> Submit Review
                                        </button>
                                    )}

                                    {assignment.status === 'COMPLETED' && (
                                        <span className={styles.completedBadge}>
                                            <CheckCircle size={14} /> Review Submitted
                                        </span>
                                    )}

                                    <button
                                        className={styles.viewButton}
                                        onClick={() => handleChapterClick(assignment.chapter)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <FileText size={48} />
                    <p>No chapter assignments found</p>
                    {filterStatus !== 'all' && (
                        <button onClick={() => setFilterStatus('all')} className={styles.clearFilterButton}>
                            Clear Filter
                        </button>
                    )}
                </div>
            )}

            {/* Chapter Detail Modal */}
            {showChapterDetail && selectedChapter && (
                <ChapterDetailModal
                    chapter={selectedChapter}
                    userRole="reviewer"
                    onClose={() => {
                        setShowChapterDetail(false);
                        setSelectedChapter(null);
                    }}
                    onUpdate={(updatedChapter: IndividualChapter) => {
                        // Update chapter in assignments
                        setAssignments((prev) =>
                            prev.map((a) =>
                                a.chapter.id === updatedChapter.id
                                    ? { ...a, chapter: updatedChapter }
                                    : a
                            )
                        );
                    }}
                />
            )}

            {/* Modals */}
            {showResponseModal && selectedAssignment && responseType === 'accept' && (
                <AcceptAssignmentModal
                    assignmentId={selectedAssignment.id}
                    chapter={selectedAssignment.chapter}
                    deadline={selectedAssignment.deadline}
                    onClose={() => setShowResponseModal(false)}
                    onSuccess={() => {
                        setShowResponseModal(false);
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }}
                />
            )}
            {showResponseModal && selectedAssignment && responseType === 'decline' && (
                <DeclineAssignmentModal
                    assignmentId={selectedAssignment.id}
                    chapterTitle={selectedAssignment.chapter.chapterTitle}
                    onClose={() => setShowResponseModal(false)}
                    onSuccess={() => {
                        setShowResponseModal(false);
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }}
                />
            )}
            {showReviewModal && selectedAssignment && (
                <SubmitReviewModal
                    assignmentId={selectedAssignment.id}
                    chapter={selectedAssignment.chapter}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => {
                        setShowReviewModal(false);
                        // Refresh logic would go here
                    }}
                />
            )}
        </div>
    );
};

export default ReviewerChaptersTab;
