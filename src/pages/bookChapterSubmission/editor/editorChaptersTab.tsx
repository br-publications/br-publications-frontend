// Editor Chapters Tab Component
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, AlertCircle } from 'lucide-react';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import type { IndividualChapter } from '../../../types/chapterTypes';
import { ChapterStatus } from '../../../types/chapterTypes';
import chapterService from '../../../services/chapter.service';
import { bookTitleService, bookChapterService } from '../../../services/bookManagement.service';
import ChapterList from '../common/chapters/chapterList';
import ChapterDetailModal from '../common/chapters/chapterDetailModal';
import ChapterProgressBar from '../common/status/chapterProgressBar';
import { AssignReviewersModal, RequestRevisionModal, FinalDecisionModal } from './editorChapterModals';
import { getActiveReviewerCount, getNextAction, canMakeEditorDecision } from '../../../utils/chapterUtils';
import styles from './editorChaptersTab.module.css';

// Chapter Action Modal (for accept/reject abstract only)
interface ChapterActionModalProps {
    chapter: IndividualChapter;
    actionType: 'accept' | 'reject' | 'assign' | 'decision' | null;
    onClose: () => void;
    onAccept: () => void;
    onReject: (notes: string) => void;
    onSuccess: () => void;
}

const ChapterActionModal: React.FC<ChapterActionModalProps> = ({
    chapter,
    actionType,
    onClose,
    onAccept,
    onReject,
    onSuccess,
}) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (actionType === 'accept') {
                await onAccept();
            } else if (actionType === 'reject') {
                await onReject(notes);
            }
            onSuccess();
        } catch (err) {
            console.error('Action failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const getModalTitle = () => {
        switch (actionType) {
            case 'accept':
                return 'Accept Chapter Abstract';
            case 'reject':
                return 'Reject Chapter Abstract';
            default:
                return 'Chapter Action';
        }
    };

    const getModalMessage = () => {
        switch (actionType) {
            case 'accept':
                return `Accept the abstract for "${chapter.chapterTitle}"? The author will be notified to submit the full manuscript.`;
            case 'reject':
                return `Reject the abstract for "${chapter.chapterTitle}"? Please provide a reason for the author.`;
            default:
                return '';
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{getModalTitle()}</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <p>{getModalMessage()}</p>

                    {actionType === 'reject' && (
                        <textarea
                            className={styles.notesInput}
                            placeholder="Add notes for the author..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            required={actionType === 'reject'}
                        />
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
                    <button
                        className={actionType === 'reject' ? styles.rejectButton : styles.acceptButton}
                        onClick={handleSubmit}
                        disabled={loading || (actionType === 'reject' && !notes.trim())}
                    >
                        {loading ? 'Processing...' : actionType === 'accept' ? 'Accept' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface EditorChaptersTabProps {
    submission: BookChapterSubmission;
    onUpdate?: (submission: BookChapterSubmission) => void;
    readOnly?: boolean;
    userRole?: 'author' | 'editor' | 'reviewer' | 'admin';
}

export const EditorChaptersTab: React.FC<EditorChaptersTabProps> = ({
    submission,
    readOnly = false,
    userRole = 'editor',
}) => {
    const [chapters, setChapters] = useState<IndividualChapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<IndividualChapter | null>(null);
    const [showChapterDetail, setShowChapterDetail] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'accept' | 'reject' | 'assign' | 'revision' | 'decision' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadChapters = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch submitted chapters
            const response = await chapterService.getChaptersBySubmission(submission.id);
            if (response.success && response.data) {
                let loadedChapters = response.data;


                // 2. Resolve Book ID and map chapter IDs to actual titles
                const hasNumericTitles = loadedChapters.some(ch => !isNaN(Number(ch.chapterTitle)));


                if (hasNumericTitles) {


                    let bookId: number | null = null;
                    const bookTitleOrId = submission.bookTitle;

                    // Try to see if bookTitle is already an ID (numeric string)
                    const parsedBookId = parseInt(bookTitleOrId);
                    if (!isNaN(parsedBookId) && bookTitleOrId.trim() === parsedBookId.toString()) {
                        bookId = parsedBookId;

                    } else {
                        // It's a title name, find the ID

                        const booksResponse = await bookTitleService.getAllBookTitles({ activeOnly: true });
                        if (booksResponse.success && booksResponse.data?.bookTitles) {
                            const currentBook = booksResponse.data.bookTitles.find(b => b.title === bookTitleOrId);
                            if (currentBook) {
                                bookId = currentBook.id;

                            }
                        }
                    }

                    if (bookId) {
                        const chaptersResponse = await bookChapterService.getChaptersByBookTitle(bookId);


                        if (chaptersResponse.success && chaptersResponse.data?.chapters) {
                            const validAvailableChapters = chaptersResponse.data.chapters;


                            // 3. Map IDs to Titles
                            loadedChapters = loadedChapters.map(ch => {
                                const titleVal = ch.chapterTitle;
                                // Check if title is a number (ID)
                                if (!isNaN(Number(titleVal))) {
                                    const found = validAvailableChapters.find(ac => ac.id === Number(titleVal));
                                    if (found) {

                                    }
                                }
                                return ch;
                            });


                        }
                    }
                }
                setChapters(loadedChapters);
            }
        } catch (err) {
            console.error('Error loading chapters:', err);
            setError('Failed to load chapters');
        } finally {
            setLoading(false);
        }
    };

    // Load chapters on mount
    useEffect(() => {
        loadChapters();
    }, [submission.id]);

    const handleChapterClick = (chapter: IndividualChapter) => {
        setSelectedChapter(chapter);
        setShowChapterDetail(true);
    };

    const handleChapterAction = (chapter: IndividualChapter, action: string) => {

        if (readOnly) {
            console.warn('⚠️ [EditorChaptersTab] Action blocked because readOnly is true');
            return;
        }
        setSelectedChapter(chapter);

        if (action.includes('Accept')) {
            setActionType('accept');
            setShowActionModal(true);
        } else if (action.includes('Reject')) {
            setActionType('reject');
            setShowActionModal(true);
        } else if (action.includes('Assign')) {
            setActionType('assign');
            setShowActionModal(true);
        } else if (action.toLowerCase().includes('decision')) {
            setActionType('decision');
            setShowActionModal(true);
        } else if (action.includes('Revision')) {
            setActionType('revision');
            setShowActionModal(true);
        } else {
            console.warn('⚠️ Unknown action:', action);
        }
    };

    const handleAcceptAbstract = async (chapterId: number) => {
        try {
            const response = await chapterService.acceptAbstract(chapterId);
            if (response.success) {
                await loadChapters();
                setShowActionModal(false);
                setSelectedChapter(null);
            }
        } catch (err) {
            console.error('Error accepting abstract:', err);
            setError('Failed to accept abstract');
        }
    };

    const handleRejectAbstract = async (chapterId: number, notes: string) => {
        try {
            const response = await chapterService.rejectAbstract(chapterId, notes);
            if (response.success) {
                await loadChapters();
                setShowActionModal(false);
                setSelectedChapter(null);
            }
        } catch (err) {
            console.error('Error rejecting abstract:', err);
            setError('Failed to reject abstract');
        }
    };

    return (
        <div className={styles.container}>
            {/* Progress Overview */}
            {chapters.length > 0 && (
                <div className={styles.progressSection}>
                    <h3>Chapter Progress Overview</h3>
                    <ChapterProgressBar chapters={chapters} showDetails={true} />
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className={styles.errorMessage}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className={styles.loading}>Loading chapters...</div>
            ) : chapters.length > 0 ? (
                <>
                    {/* Chapter List */}
                    <div className={styles.chaptersSection}>
                        <h3>Individual Chapters</h3>
                        <ChapterList
                            chapters={chapters}
                            userRole={userRole}
                            onChapterClick={handleChapterClick}
                            onChapterAction={readOnly ? undefined : handleChapterAction}
                            showFilters={true}
                        />
                    </div>

                    {/* Quick Actions Summary */}
                    {!readOnly && (
                        <div className={styles.actionsSummary}>
                            <h4>Quick Actions Needed</h4>
                            <div className={styles.actionCards}>
                                {chapters.filter(c => c.status === ChapterStatus.ABSTRACT_SUBMITTED).length > 0 && (
                                    <div className={styles.actionCard}>
                                        <div className={styles.actionIcon}>
                                            <CheckCircle size={20} />
                                        </div>
                                        <div className={styles.actionContent}>
                                            <span className={styles.actionCount}>
                                                {chapters.filter(c => c.status === ChapterStatus.ABSTRACT_SUBMITTED).length}
                                            </span>
                                            <span className={styles.actionLabel}>Abstract(s) to Review</span>
                                        </div>
                                    </div>
                                )}

                                {chapters.filter(c => 
                                    getNextAction(c, userRole)?.includes('Assign')
                                ).length > 0 && (
                                    <div className={styles.actionCard}>
                                        <div className={styles.actionIcon}>
                                            <Users size={20} />
                                        </div>
                                        <div className={styles.actionContent}>
                                            <span className={styles.actionCount}>
                                                {chapters.filter(c => 
                                                    getNextAction(c, userRole)?.includes('Assign')
                                                ).length}
                                            </span>
                                            <span className={styles.actionLabel}>Chapter(s) Need Reviewers</span>
                                        </div>
                                    </div>
                                )}

                                {chapters.filter(c => canMakeEditorDecision(c)).length > 0 && (
                                    <div className={styles.actionCard}>
                                        <div className={styles.actionIcon}>
                                            <AlertCircle size={20} />
                                        </div>
                                        <div className={styles.actionContent}>
                                            <span className={styles.actionCount}>
                                                {chapters.filter(c => canMakeEditorDecision(c)).length}
                                            </span>
                                            <span className={styles.actionLabel}>Final Decision(s) Needed</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.emptyState}>
                    <p>No chapters found for this submission.</p>
                </div>
            )}

            {/* Chapter Detail Modal */}
            {showChapterDetail && selectedChapter && (
                <ChapterDetailModal
                    chapter={selectedChapter}
                    userRole={userRole}
                    onClose={() => {
                        setShowChapterDetail(false);
                        setSelectedChapter(null);
                    }}
                    onUpdate={(updatedChapter) => {
                        setChapters(prev =>
                            prev.map(c => c.id === updatedChapter.id ? updatedChapter : c)
                        );
                    }}
                />
            )}

            {/* Action Modals */}
            {showActionModal && selectedChapter && actionType === 'accept' && (
                <ChapterActionModal
                    chapter={selectedChapter}
                    actionType="accept"
                    onClose={() => {
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                    onAccept={() => handleAcceptAbstract(selectedChapter.id)}
                    onReject={() => { }}
                    onSuccess={() => {
                        loadChapters();
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                />
            )}

            {showActionModal && selectedChapter && actionType === 'reject' && (
                <ChapterActionModal
                    chapter={selectedChapter}
                    actionType="reject"
                    onClose={() => {
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                    onAccept={() => { }}
                    onReject={(notes) => handleRejectAbstract(selectedChapter.id, notes)}
                    onSuccess={() => {
                        loadChapters();
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                />
            )}

            {showActionModal && selectedChapter && actionType === 'assign' && (
                <AssignReviewersModal
                    chapter={selectedChapter}
                    onClose={() => {
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                    onSuccess={() => {
                        loadChapters();
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                />
            )}

            {showActionModal && selectedChapter && actionType === 'revision' && (
                <RequestRevisionModal
                    chapter={selectedChapter}
                    onClose={() => {
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                    onSuccess={() => {
                        loadChapters();
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                />
            )}

            {showActionModal && selectedChapter && actionType === 'decision' && (
                <FinalDecisionModal
                    chapter={selectedChapter}
                    onClose={() => {
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                    onSuccess={() => {
                        loadChapters();
                        setShowActionModal(false);
                        setSelectedChapter(null);
                        setActionType(null);
                    }}
                />
            )}
        </div>
    );
};

export default EditorChaptersTab;
