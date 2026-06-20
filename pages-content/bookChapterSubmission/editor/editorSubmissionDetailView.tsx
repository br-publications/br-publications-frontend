'use client';
import React, { useState, useEffect } from 'react';
import {
    X,
    ChevronLeft,
    FileText,
    MessageSquare,
    CheckCircle,
    Clock,
    BookOpen,
    AlertCircle,
} from 'lucide-react';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import { bookChapterService, bookChapterEditorService } from '../../../services/bookChapterSumission.service';
import bookManagementService from '../../../services/bookManagement.service';
import { normalizeSubmission } from '../../../utils/submissionUtils';
import SubmissionOverview from '../common/Overview/submissionOverview';
import DiscussionPanel from '../common/discussion/discussionPanel';
import SubmissionStatusHistory from '../common/history/submissionStatusHistory';
import SubmissionWorkflowView from '../common/Overview/submissionWorkflowView';
import EditorChaptersTab from './editorChaptersTab';
import styles from './editorSubmissionDetailView.module.css';
import PublishChapterModal from '../../../components/submissions/PublishChapterModal';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';


type EditorTab = 'overview' | 'chapters' | 'workflow' | 'history' | 'discussions' | 'actions' | 'reviewers';

interface EditorSubmissionDetailViewProps {
    submission: BookChapterSubmission;
    onClose: () => void;
    onUpdate?: (submission: BookChapterSubmission) => void;
    onMakeDecision?: (decision: 'accept' | 'reject', notes?: string) => void;
    onMakeFinalDecision?: (decision: 'approve' | 'reject', notes?: string) => void;
    initialTab?: EditorTab;
}

interface AlertConfig {
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
    confirmText?: string;
}

export const EditorSubmissionDetailView: React.FC<EditorSubmissionDetailViewProps> = ({
    submission,
    onClose,
    onUpdate,
    onMakeDecision,
    onMakeFinalDecision,
    initialTab = 'overview',
}) => {
    const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
    const [chapterTitles, setChapterTitles] = useState<Record<string, string>>({});
    const [resolvedBookTitle, setResolvedBookTitle] = useState<string | null>(null);
    const [isSubmittingIsbn, setIsSubmittingIsbn] = useState(false);
    const [isStartingPublication, setIsStartingPublication] = useState(false);
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    // Fetch full submission details on mount (ensures individualChapters are available)
    const [fullSubmission, setFullSubmission] = useState<BookChapterSubmission>(submission);

    useEffect(() => {
        let isInitialFetch = true;
        const fetchFullDetails = async () => {
            try {
                const response = await bookChapterEditorService.getSubmissionById(submission.id);
                if (response.success && response.data) {
                    // @ts-ignore
                    const fetchedSub = response.data.submission || response.data;

                    setFullSubmission((prevSub) => {
                        // If the status has changed from ABSTRACT_SUBMITTED indicating someone else made a decision
                        if (!isInitialFetch && prevSub.status === 'ABSTRACT_SUBMITTED' && fetchedSub.status !== 'ABSTRACT_SUBMITTED') {
                            window.dispatchEvent(new CustomEvent('app-alert', {
                                detail: { type: 'info', title: 'Update Detected', message: 'A decision was just made by another user. Reloading...' }
                            }));
                            setTimeout(() => window.location.reload(), 2000);
                        }
                        return normalizeSubmission(fetchedSub);
                    });

                    if (onUpdate && isInitialFetch) onUpdate(normalizeSubmission(fetchedSub));
                    isInitialFetch = false;
                }
            } catch (error) {
                console.error("Failed to fetch full submission details:", error);
            }
        };

        fetchFullDetails();
        // Poll every 10 seconds to detect decisions made by other users (Admin/Editor concurrency)
        const intervalId = setInterval(fetchFullDetails, 30000);

        return () => clearInterval(intervalId);
    }, [submission.id]);

    // Use fullSubmission for rendering to ensure we have chapters and latest status
    const currentSubmission = fullSubmission;

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);


    // Fetch chapter titles
    useEffect(() => {
        const loadChapterTitles = async () => {
            try {
                let bookId: number | null = null;
                const titleOrId = submission.bookTitle;

                // 1. Resolve Book ID & Title
                const parsedId = parseInt(titleOrId);
                if (!isNaN(parsedId) && titleOrId.trim() === parsedId.toString()) {
                    bookId = parsedId;
                    // Resolution: Fetch the title for display

                    const bookResponse = await bookManagementService.bookTitle.getAllBookTitles();
                    if (bookResponse.success && bookResponse.data?.bookTitles) {
                        const book = bookResponse.data.bookTitles.find((b: any) => b.id === bookId);
                        if (book) {

                            setResolvedBookTitle(book.title);
                        }
                    }
                } else {
                    // It's a title name, find the ID for chapter lookup
                    const response = await bookManagementService.bookTitle.getAllBookTitles();
                    if (response.success && response.data?.bookTitles) {
                        const book = response.data.bookTitles.find(b => b.title === titleOrId);
                        if (book) bookId = book.id;
                    }
                }

                // 2. Fetch Chapters if we have an ID and chapters are present
                const chapters = submission.chapters || submission.bookChapterTitles;
                if (bookId && chapters && chapters.length > 0) {
                    const chapterResp = await bookManagementService.bookChapter.getChaptersByBookTitle(bookId, false);
                    if (chapterResp.success && chapterResp.data?.chapters) {
                        const titleMap: Record<string, string> = {};
                        chapterResp.data.chapters.forEach(ch => {
                            titleMap[ch.id.toString()] = ch.chapterTitle;
                        });
                        setChapterTitles(titleMap);
                    }
                }
            } catch (err) {
                console.error("Failed to load chapter titles", err);
            }
        };

        loadChapterTitles();
    }, [submission.bookTitle, submission.chapters, submission.bookChapterTitles]);



    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={onClose} className={styles.backButton}>
                    <ChevronLeft size={20} />Back to Dashboard
                </button>
                <div className={styles.headerActions}>
                    <span className={`${styles.statusBadge} ${styles[currentSubmission.status.toLowerCase()]}`}>
                        {currentSubmission.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`} onClick={() => setActiveTab('overview')}>
                    <FileText size={14} /> Overview
                </button>
                <button className={`${styles.tab} ${activeTab === 'chapters' ? styles.activeTab : ''}`} onClick={() => setActiveTab('chapters')}>
                    <BookOpen size={14} /> Chapters
                </button>
                <button className={`${styles.tab} ${activeTab === 'workflow' ? styles.activeTab : ''}`} onClick={() => setActiveTab('workflow')}>
                    <Clock size={14} /> Workflow
                </button>
                <button className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`} onClick={() => setActiveTab('history')}>
                    <CheckCircle size={14} /> History
                </button>
                <button className={`${styles.tab} ${activeTab === 'discussions' ? styles.activeTab : ''}`} onClick={() => setActiveTab('discussions')}>
                    <MessageSquare size={14} /> Discussions
                </button>
                <button className={`${styles.tab} ${activeTab === 'actions' ? styles.activeTab : ''}`} onClick={() => setActiveTab('actions')}>
                    <CheckCircle size={14} /> Actions
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === 'overview' && (
                    <SubmissionOverview submission={currentSubmission} />
                )}

                {activeTab === 'chapters' && (
                    <EditorChaptersTab
                        submission={currentSubmission}
                        onUpdate={onUpdate}
                        userRole="editor"
                    />
                )}

                {activeTab === 'workflow' && (
                    <SubmissionWorkflowView submission={currentSubmission} />
                )}


                {activeTab === 'history' && (
                    <div style={{ marginTop: '20px' }}>
                        <SubmissionStatusHistory submissionId={currentSubmission.id} />
                    </div>
                )}

                {activeTab === 'actions' && (
                    <EditorActionsTab
                        submission={currentSubmission}
                        onMakeDecision={(decision, notes) => { if (onMakeDecision) onMakeDecision(decision, notes); }}
                        onMakeFinalDecision={(decision, notes) => { if (onMakeFinalDecision) onMakeFinalDecision(decision, notes); }}
                        onUpdate={onUpdate}
                        chapterTitles={chapterTitles}
                        resolvedBookTitle={resolvedBookTitle || currentSubmission.bookTitle}
                        isStartingPublication={isStartingPublication}
                        setIsStartingPublication={setIsStartingPublication}
                        isSubmittingIsbn={isSubmittingIsbn}
                        setIsSubmittingIsbn={setIsSubmittingIsbn}
                        setAlertConfig={setAlertConfig}
                    />
                )}

                {activeTab === 'discussions' && (
                    <DiscussionPanel
                        currentUserRole="editor"
                        submissionId={currentSubmission.id}
                        submissionStatus={currentSubmission.status}
                    />
                )}
            </div>




            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={alertConfig.onConfirm}
                showCancel={alertConfig.showCancel}
                confirmText={alertConfig.confirmText}
            />
        </div>
    );
};


const EditorActionsTab: React.FC<{
    submission: BookChapterSubmission;
    onMakeDecision: (decision: 'accept' | 'reject', notes?: string) => void;
    onMakeFinalDecision?: (decision: 'approve' | 'reject', notes?: string) => void;
    onUpdate?: (submission: BookChapterSubmission) => void;
    chapterTitles: Record<string, string>;
    resolvedBookTitle: string;
    isStartingPublication: boolean;
    setIsStartingPublication: (v: boolean) => void;
    isSubmittingIsbn: boolean;
    setIsSubmittingIsbn: (submitting: boolean) => void;
    setAlertConfig: React.Dispatch<React.SetStateAction<AlertConfig>>;
}> = ({ submission, onMakeDecision, onMakeFinalDecision, onUpdate, chapterTitles, resolvedBookTitle, isStartingPublication, setIsStartingPublication, isSubmittingIsbn, setIsSubmittingIsbn, setAlertConfig }) => {
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [finalNotes, setFinalNotes] = useState('');
    // const [reassignTarget, setReassignTarget] = useState<{ id: number; name: string } | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    // Consolidated publication data
    const [publishAllSubmissions, setPublishAllSubmissions] = useState<BookChapterSubmission[]>([]);
    const [publishAllBookChapters, setPublishAllBookChapters] = useState<{ title: string; chapterNumber: string }[]>([]);
    const isPublished = submission.status === 'PUBLISHED';

    // Readiness State
    const [allChaptersReady, setAllChaptersReady] = useState<boolean>(false);
    const [checkingReadiness, setCheckingReadiness] = useState<boolean>(true);
    const [readinessDetails, setReadinessDetails] = useState<{ total: number, ready: number }>({ total: 0, ready: 0 });

    useEffect(() => {
        const checkReadiness = async () => {
            try {
                setCheckingReadiness(true);
                // Find Book ID first
                const bookResp = await bookManagementService.bookTitle.getBookTitleByTitle(resolvedBookTitle);
                if (bookResp.success && bookResp.data?.id) {
                    const bookId = bookResp.data.id;
                    const chapterResp = await bookManagementService.bookChapter.getChaptersByBookTitle(bookId, true, true);
                    if (chapterResp.success && chapterResp.data?.chapters) {
                        const allChapters = chapterResp.data.chapters;
                        const readyOnes = allChapters.filter(ch =>
                            ch.isReadyForPublication ||
                            ch.isPublished ||
                            ch.submissionStatus === 'PUBLICATION_IN_PROGRESS'
                        );

                        setReadinessDetails({
                            total: allChapters.length,
                            ready: readyOnes.length
                        });
                        setAllChaptersReady(readyOnes.length === allChapters.length);
                    }
                }
            } catch (error) {
                console.error("Error checking chapter readiness:", error);
            } finally {
                setCheckingReadiness(false);
            }
        };

        if (resolvedBookTitle) {
            checkReadiness();
        }
    }, [resolvedBookTitle, submission.status]);


    const isAbstractPending = submission.status === 'ABSTRACT_SUBMITTED';
    const allChaptersDecided = submission.individualChapters && submission.individualChapters.length > 0 && submission.individualChapters.every(
        (ch: any) => ch.status === 'CHAPTER_APPROVED' || ch.status === 'CHAPTER_REJECTED'
    );
    const statusReady = ['EDITORIAL_REVIEW'].includes(submission.status);
    const readyForFinalDecision = (allChaptersDecided || statusReady) && !['APPROVED', 'PUBLISHED', 'REJECTED', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS'].includes(submission.status);

    const handleUploadProof = async () => {
        if (!proofFile) return;
        setIsUploadingProof(true);
        try {
            await bookChapterEditorService.submitProof(submission.id, proofFile as File);
            setAlertConfig({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'Proof document sent to author.',
            });
            setProofFile(null);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: error?.message || 'Failed to upload proof',
            });
        } finally {
            setIsUploadingProof(false);
        }
    };

    // const showReviewerStep = !isAbstractPending && !['APPROVED', 'PUBLISHED', 'REJECTED', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS'].includes(submission.status);
    // const hasDeclined = assignments.some(a => a.status === 'DECLINED' || a.status === 'REJECTED' || a.status === 'EXPIRED');
    // const needsReviewers = assignments.length < 2 || hasDeclined;

    return (
        <div className={styles.actionsTab}>
            {/* Step 1: Abstract Review */}
            <div className={`${styles.stepContainer} ${isAbstractPending ? styles.active : ''} ${!isAbstractPending && !readyForFinalDecision && !['APPROVED', 'PUBLISHED', 'REJECTED', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS'].includes(submission.status) ? styles.completedPhase : ''}`}>
                <div className={styles.stepHeader}>
                    <h4 className={styles.stepTitle}>
                        <div className={styles.stepNumber}>1</div>
                        Abstract Review
                    </h4>
                    <span className={`${styles.stepStatus} ${isAbstractPending ? styles.pending : (readyForFinalDecision || ['APPROVED', 'PUBLISHED', 'REJECTED', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS'].includes(submission.status) ? styles.completed : '')}`}>
                        {isAbstractPending ? 'Action Required' : (submission.status === 'APPROVED' ? 'Approved' : 'Completed')}
                    </span>
                </div>
                {isAbstractPending && (
                    <div className={styles.stepContent}>
                        {/* Abstract Content Display */}
                        <div className={styles.abstractDisplay}>
                            <div className={styles.abstractSection}>
                                <h5 className={styles.sectionTitle}>Book Title</h5>
                                <p className={styles.bookTitle}>{resolvedBookTitle}</p>
                            </div>

                            {((submission.individualChapters && submission.individualChapters.length > 0) || (submission.chapters && submission.chapters.length > 0) || (submission.bookChapterTitles && submission.bookChapterTitles.length > 0)) && (
                                <div className={styles.abstractSection}>
                                    <h5 className={styles.sectionTitle}>
                                        Chapter Titles ({submission.individualChapters?.length || submission.chapters?.length || submission.bookChapterTitles?.length || 0})
                                    </h5>
                                    <ul className={styles.chapterList}>
                                        {Array.isArray(submission.individualChapters) && submission.individualChapters.length > 0 ? (
                                            submission.individualChapters.map((chapter: any, index: number) => (
                                                <li key={index}>{chapter.chapterTitle}</li>
                                            ))
                                        ) : (
                                            (Array.isArray(submission.chapters) ? submission.chapters : (Array.isArray(submission.bookChapterTitles) ? submission.bookChapterTitles : []))?.map((chapterId, index) => (
                                                <li key={index}>{chapterTitles[chapterId] || chapterId}</li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div className={styles.abstractSection}>
                                <h5 className={styles.sectionTitle}>Abstract</h5>
                                <p className={styles.abstractText}>{submission.abstract}</p>
                            </div>

                            {submission.keywords && submission.keywords.length > 0 && (
                                <div className={styles.abstractSection}>
                                    <h5 className={styles.sectionTitle}>Keywords</h5>
                                    <div className={styles.keywordTags}>
                                        {Array.isArray(submission.keywords) && submission.keywords.map((keyword, index) => (
                                            <span key={index} className={styles.keywordTag}>{keyword}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.abstractSection}>
                                <h5 className={styles.sectionTitle}>Author Information</h5>
                                <div className={styles.authorInfo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                                        <p style={{ fontWeight: '600', marginBottom: '5px', color: '#111827' }}>
                                            Main Author
                                            {(submission.mainAuthor.isCorrespondingAuthor === true || String(submission.mainAuthor.isCorrespondingAuthor) === 'true') && (
                                                <span style={{ marginLeft: '8px', fontSize: '10px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>
                                                    Corresponding
                                                </span>
                                            )}
                                        </p>
                                        <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Name:</strong> {(submission.mainAuthor?.firstName || '').toString()} {(submission.mainAuthor?.lastName || '').toString()}</p>
                                        <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Institution:</strong> {(submission.mainAuthor?.instituteName || '').toString()}</p>
                                        <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Email:</strong> {(submission.mainAuthor?.email || '').toString()}</p>
                                    </div>

                                    {submission.coAuthors && submission.coAuthors.length > 0 && (
                                        <div>
                                            <p style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Co-Authors ({submission.coAuthors.length})</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                {submission.coAuthors.map((author: any, idx: number) => {
                                                    const isCorresponding = author.isCorrespondingAuthor === true || String(author.isCorrespondingAuthor) === 'true';
                                                    return (
                                                        <div key={idx} style={{ padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                                                            <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}>
                                                                <strong>Name:</strong> {author.firstName} {author.lastName}
                                                                {isCorresponding && (
                                                                    <span style={{ marginLeft: '8px', fontSize: '10px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>
                                                                        Corresponding
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Institution:</strong> {author.instituteName}</p>
                                                            <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Email:</strong> {author.email}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.abstractSection} style={{ marginTop: '15px' }}>
                                <h5 className={styles.sectionTitle}>Selected Editor</h5>
                                <p className={styles.abstractText}>{(submission as any).designatedEditor?.fullName || submission.assignedEditor?.fullName || 'Not Yet Assigned'}</p>
                            </div>
                        </div>

                        {/* Decision Area */}
                        <div className={styles.decisionArea}>
                            <h5 className={styles.decisionTitle}>Make Your Decision</h5>
                            <textarea
                                className={styles.decisionNotes}
                                placeholder="Add notes for the author (required for rejection)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                disabled={isPublished}
                            />
                            <div className={styles.decisionButtons}>
                                <button
                                    className={styles.acceptButton}
                                    onClick={() => {
                                        setAlertConfig({
                                            isOpen: true,
                                            type: 'success',
                                            title: 'Accept Abstract',
                                            message: 'Are you sure you want to accept this abstract? This action cannot be undone.',
                                            showCancel: true,
                                            confirmText: 'Accept',
                                            onConfirm: () => {
                                                onMakeDecision('accept', notes);
                                                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                                            }
                                        });
                                    }}
                                >
                                    <CheckCircle size={14} /> Accept Abstract
                                </button>
                                <button
                                    className={styles.rejectButton}
                                    onClick={() => {
                                        if (!notes || !notes.trim()) {
                                            setAlertConfig({
                                                isOpen: true,
                                                type: 'error',
                                                title: 'Notes Required',
                                                message: 'Please provide a reason for the rejection in the notes field.',
                                                showCancel: false
                                            });
                                            return;
                                        }
                                        setAlertConfig({
                                            isOpen: true,
                                            type: 'warning',
                                            title: 'Reject Abstract',
                                            message: 'Are you sure you want to reject this abstract? This action cannot be undone.',
                                            showCancel: true,
                                            confirmText: 'Reject',
                                            onConfirm: () => {
                                                onMakeDecision('reject', notes);
                                                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                                            }
                                        });
                                    }}
                                >
                                    <X size={14} /> Reject Abstract
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Step 3: Final Decision Section */}
            {(readyForFinalDecision || ['APPROVED', 'REJECTED', 'PUBLISHED', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS'].includes(submission.status)) && (
                <div className={`${styles.stepContainer} ${readyForFinalDecision ? styles.active : ''} ${!readyForFinalDecision ? styles.completedPhase : ''}`}>
                    <div className={styles.stepHeader}>
                        <h4 className={styles.stepTitle}>
                            <div className={styles.stepNumber}>2</div>
                            Final Submission Decision
                        </h4>
                        <span className={`${styles.stepStatus} ${readyForFinalDecision ? styles.pending : styles.completed}`}>
                            {readyForFinalDecision ? 'Action Required' : (submission.status === 'REJECTED' ? 'Rejected' : 'Completed')}
                        </span>
                    </div>

                    <div className={styles.stepContent}>

                        {/* Final Decision Area */}
                        {['APPROVED', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS', 'PUBLISHED', 'REJECTED'].includes(submission.status) ? (
                            <div className={styles.decisionArea}>
                                <h5 className={styles.decisionTitle}>Final Decision Recorded</h5>
                                <p>This submission has been <strong>{submission.status.replace(/_/g, ' ')}</strong>.</p>
                            </div>
                        ) : (
                            <div className={styles.decisionArea}>
                                <h5 className={styles.decisionTitle}>Take Final Action</h5>
                                <textarea
                                    className={styles.decisionNotes}
                                    placeholder="Add final notes for the author (required)..."
                                    value={finalNotes}
                                    onChange={(e) => setFinalNotes(e.target.value)}
                                    rows={4}
                                    disabled={!readyForFinalDecision || isPublished}
                                />
                                <div className={styles.decisionButtons}>
                                    <button
                                        className={styles.acceptButton}
                                        disabled={!readyForFinalDecision || isPublished}
                                        style={{ opacity: (!readyForFinalDecision || isPublished) ? 0.5 : 1 }}
                                        onClick={() => {
                                            setAlertConfig({
                                                isOpen: true,
                                                type: 'success',
                                                title: 'Approve Submission',
                                                message: 'Are you sure you want to approve this submission? This will notify the author and move it to the ISBN stage.',
                                                showCancel: true,
                                                confirmText: 'Approve',
                                                onConfirm: () => {
                                                    if (onMakeFinalDecision) {
                                                        onMakeFinalDecision('approve', finalNotes);
                                                    }
                                                    setAlertConfig(prev => ({ ...prev, isOpen: false }));
                                                }
                                            });
                                        }}
                                    >
                                        <CheckCircle size={14} /> Approve Submission
                                    </button>
                                    <button
                                        className={styles.rejectButton}
                                        disabled={!readyForFinalDecision || isPublished}
                                        style={{ opacity: (!readyForFinalDecision || isPublished) ? 0.5 : 1 }}
                                        onClick={() => {
                                            if (!finalNotes || !finalNotes.trim()) {
                                                setAlertConfig({
                                                    isOpen: true,
                                                    type: 'error',
                                                    title: 'Notes Required',
                                                    message: 'Please provide final notes for the author explaining the rejection.',
                                                    showCancel: false
                                                });
                                                return;
                                            }
                                            setAlertConfig({
                                                isOpen: true,
                                                type: 'warning',
                                                title: 'Reject Submission',
                                                message: 'Are you sure you want to reject this submission? This action cannot be undone.',
                                                showCancel: true,
                                                confirmText: 'Reject',
                                                onConfirm: () => {
                                                    if (onMakeFinalDecision) {
                                                        onMakeFinalDecision('reject', finalNotes);
                                                    }
                                                    setAlertConfig(prev => ({ ...prev, isOpen: false }));
                                                }
                                            });
                                        }}
                                    >
                                        <X size={14} /> Reject Submission
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 4: Proof Editing */}
            {(submission.status === 'APPROVED' || submission.status === 'ISBN_APPLIED' || submission.status === 'PUBLICATION_IN_PROGRESS' || submission.status === 'PUBLISHED') && (
                <div className={`${styles.stepContainer} ${['APPROVED', 'ISBN_APPLIED'].includes(submission.status) ? styles.active : ''} ${['PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status) ? styles.completedPhase : ''}`}>
                    <div className={styles.stepHeader}>
                        <h4 className={styles.stepTitle}>
                            <div className={styles.stepNumber}>3</div>
                            Proof Editing
                        </h4>
                        <span className={`${styles.stepStatus} ${['APPROVED', 'ISBN_APPLIED'].includes(submission.status) && submission.proofStatus !== 'ACCEPTED' ? styles.pending : styles.completed}`}>
                            {submission.status === 'APPROVED' ? 'Action Required' : (submission.status === 'ISBN_APPLIED' && submission.proofStatus !== 'ACCEPTED' ? 'In Progress' : 'Completed')}
                        </span>
                    </div>

                    <div className={styles.stepContent}>
                        {submission.status === 'APPROVED' ? (
                            <div className={styles.decisionArea}>
                                <h5 className={styles.decisionTitle}>Start Proof Editing</h5>
                                <p style={{ marginBottom: '10px' }}>The submission is approved. Click below to start the proof editing phase.</p>
                                <button
                                    className={styles.acceptButton}
                                    disabled={isSubmittingIsbn || isPublished}
                                    onClick={async () => {
                                        if (isSubmittingIsbn || isPublished) return;
                                        setIsSubmittingIsbn(true);
                                        try {
                                            await bookChapterEditorService.applyIsbn(submission.id, 'Starting proof editing');
                                            setAlertConfig({
                                                isOpen: true,
                                                type: 'success',
                                                title: 'Success',
                                                message: 'Proof editing phase started.',
                                            });
                                            setTimeout(() => window.location.reload(), 1000);
                                        } catch (error: any) {
                                            setAlertConfig({
                                                isOpen: true,
                                                type: 'error',
                                                title: 'Error',
                                                message: error?.message || 'Failed to start proof editing',
                                            });
                                            setIsSubmittingIsbn(false);
                                        }
                                    }}
                                >
                                    {isSubmittingIsbn ? 'Starting...' : 'Start Proof Editing'}
                                </button>
                            </div>
                        ) : (
                            <div className={styles.decisionArea}>
                                <h5 className={styles.decisionTitle}>Proof Document Status</h5>

                                {submission.proofStatus === 'ACCEPTED' ? (
                                    <div style={{ padding: '10px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', color: '#065f46', marginBottom: '10px' }}>
                                        <CheckCircle size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                        Author has accepted the proof document.
                                    </div>
                                ) : submission.proofStatus === 'SENT' ? (
                                    <div style={{ padding: '10px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '6px', color: '#92400e', marginBottom: '10px' }}>
                                        <Clock size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                        Proof sent to author. Waiting for confirmation.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {submission.proofStatus === 'REJECTED' && (
                                            <div style={{ padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '6px', color: '#991b1b', marginBottom: '5px' }}>
                                                <X size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                                <strong>Proof Rejected:</strong> {submission.authorProofNotes || 'No notes provided'}
                                            </div>
                                        )}
                                        <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '4px' }}>Upload the final proof document for author confirmation:</p>
                                        {/* Custom file input */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                id="proof-file-input"
                                                style={{ display: 'none' }}
                                                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                                disabled={isPublished}
                                            />
                                            <label
                                                htmlFor="proof-file-input"
                                                style={{
                                                    padding: '6px 14px',
                                                    backgroundColor: '#1e5292',
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    cursor: isPublished ? 'not-allowed' : 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                    transition: 'background-color 0.2s',
                                                    opacity: isPublished ? 0.6 : 1
                                                }}
                                            >
                                                Choose File
                                            </label>
                                            <span style={{
                                                fontSize: '0.82rem',
                                                color: proofFile ? '#1f2937' : '#9ca3af',
                                                fontStyle: proofFile ? 'normal' : 'italic',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {proofFile ? proofFile.name : 'No file chosen'}
                                            </span>
                                        </div>
                                        <button
                                            className={styles.acceptButton}
                                            disabled={!proofFile || isUploadingProof || isPublished}
                                            onClick={handleUploadProof}
                                        >
                                            {isUploadingProof ? 'Uploading...' : 'Send Proof to Author'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 5: Start Publication */}
            {(submission.status === 'ISBN_APPLIED' || submission.status === 'PUBLICATION_IN_PROGRESS' || submission.status === 'PUBLISHED') && (
                <div className={`${styles.stepContainer} ${submission.status === 'ISBN_APPLIED' ? styles.active : ''} ${['PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status) ? styles.completedPhase : ''}`}>
                    <div className={styles.stepHeader}>
                        <h4 className={styles.stepTitle}>
                            <div className={styles.stepNumber}>4</div>
                            Start Publication
                        </h4>
                        <span className={`${styles.stepStatus} ${submission.status === 'ISBN_APPLIED' ? (['ACCEPTED', 'REJECTED'].includes(submission.proofStatus as string) ? styles.pending : styles.completed) : styles.completed}`}>
                            {submission.status === 'ISBN_APPLIED' ? (['ACCEPTED', 'REJECTED'].includes(submission.proofStatus as string) ? 'Action Required' : 'Waiting for Proof') : 'Started'}
                        </span>
                    </div>

                    <div className={styles.stepContent}>
                        {submission.status === 'ISBN_APPLIED' ? (
                            <div className={styles.decisionArea}>
                                <h5 className={styles.decisionTitle}>Start Publication</h5>
                                <p style={{ marginBottom: '10px' }}>Proof editing is complete. Add notes and click below to start the publication phase. ISBN &amp; DOI will be entered at the time of publishing.</p>
                                <textarea
                                    className={styles.decisionNotes}
                                    placeholder="Add notes (optional)..."
                                    rows={3}
                                    id="editor-publication-notes"
                                    style={{ marginBottom: '10px' }}
                                    disabled={isPublished}
                                />
                                <button
                                    className={styles.acceptButton}
                                    style={{ backgroundColor: (['ACCEPTED', 'REJECTED'].includes(submission.proofStatus as string) && !isPublished) ? '#0ea5e9' : '#9ca3af', color: 'white' }}
                                    disabled={isStartingPublication || !['ACCEPTED', 'REJECTED'].includes(submission.proofStatus as string) || isPublished}
                                    onClick={async () => {
                                        if (isStartingPublication || !['ACCEPTED', 'REJECTED'].includes(submission.proofStatus as string) || isPublished) return;
                                        setIsStartingPublication(true);
                                        const notes = (document.getElementById('editor-publication-notes') as HTMLTextAreaElement)?.value || '';
                                        try {
                                            await bookChapterEditorService.receiveIsbn(submission.id, { notes });
                                            setAlertConfig({
                                                isOpen: true,
                                                type: 'success',
                                                title: 'Success',
                                                message: 'Publication started successfully.',
                                            });
                                            setTimeout(() => window.location.reload(), 1000);
                                        } catch (error: any) {
                                            setAlertConfig({
                                                isOpen: true,
                                                type: 'error',
                                                title: 'Error',
                                                message: error?.message || 'Failed to start publication',
                                            });
                                            setIsStartingPublication(false);
                                        }
                                    }}
                                >
                                    <FileText size={14} style={{ marginRight: '8px' }} />
                                    {['ACCEPTED', 'REJECTED'].includes(submission.proofStatus as string) ? (isStartingPublication ? 'Starting...' : 'Start Publication') : 'Waiting for Proof Acceptance'}
                                </button>
                            </div>
                        ) : (
                            <div className={styles.decisionArea}>
                                <h5 className={styles.decisionTitle}>Status</h5>
                                <p>Publication has been started. ISBN &amp; DOI will be entered at the time of publishing.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 6: Publication Section */}
            {(['PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status)) && (
                <div className={`${styles.stepContainer} ${submission.status === 'PUBLICATION_IN_PROGRESS' ? styles.active : ''} ${submission.status === 'PUBLISHED' ? styles.completedPhase : ''}`}>
                    <div className={styles.stepHeader}>
                        <h4 className={styles.stepTitle}>
                            <div className={styles.stepNumber}>5</div>
                            Publication
                        </h4>
                        <span className={`${styles.stepStatus} ${submission.status === 'PUBLISHED' ? styles.completed : styles.pending}`}>
                            {submission.status === 'PUBLISHED' ? 'Published' : 'Final Action'}
                        </span>
                    </div>
                    <div className={styles.stepContent}>
                        <div className={styles.publicationStep}>
                            {submission.status === 'PUBLISHED' && (
                                <div className={styles.publishStatus}>
                                    <CheckCircle size={20} className={styles.successIcon} />
                                    <span>This book chapter has been successfully published.</span>
                                </div>
                            )}
                            {/*{submission.status === 'PUBLICATION_IN_PROGRESS' && !(submission as any).deliveryAddress && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    padding: '12px 16px',
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #0ea5e9',
                                    borderRadius: '8px',
                                    marginBottom: '12px',
                                }}>
                                    <AlertCircle size={18} style={{ color: '#0ea5e9', flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <p style={{ fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>Author Delivery Address Pending (Optional)</p>
                                        <p style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>The author has been notified to submit their delivery address. You can still proceed with publication.</p>
                                    </div>
                                </div>
                            )}*/}
                        </div>
                        <button
                            className={`${styles.actionButton} ${submission.status === 'PUBLISHED' ? styles.secondaryButton : (allChaptersReady ? styles.primaryButton : styles.disabledButton)}`}
                            onClick={async () => {
                                if (submission.status !== 'PUBLISHED' && !allChaptersReady) {
                                    setAlertConfig({
                                        isOpen: true,
                                        type: 'warning',
                                        title: 'Chapters Not Ready',
                                        message: `Cannot publish yet. Only ${readinessDetails.ready} out of ${readinessDetails.total} chapters are marked as "Ready for Publication".`,
                                        showCancel: false
                                    });
                                    return;
                                }
                                // Fetch all submissions and chapters for consolidated publication
                                try {
                                    const bookTitleValue = submission.bookTitle || '';
                                    const subResp = await bookChapterService.getSubmissionsByBookTitle(bookTitleValue);
                                    if (subResp.success && subResp.data?.submissions) {
                                        setPublishAllSubmissions(subResp.data.submissions as BookChapterSubmission[]);
                                    } else {
                                        setPublishAllSubmissions([submission]);
                                    }

                                    const parsedId = parseInt(bookTitleValue);
                                    let bookId: number | null = null;
                                    if (!isNaN(parsedId) && bookTitleValue.trim() === parsedId.toString()) {
                                        bookId = parsedId;
                                    } else {
                                        const btResp = await bookManagementService.bookTitle.getAllBookTitles();
                                        if (btResp.success && btResp.data?.bookTitles) {
                                            const bt = btResp.data.bookTitles.find((b: any) => b.title === bookTitleValue);
                                            if (bt) bookId = bt.id;
                                        }
                                    }
                                    if (bookId) {
                                        const chapResp = await bookManagementService.bookChapter.getChaptersByBookTitle(bookId, false);
                                        if (chapResp.success && chapResp.data?.chapters) {
                                            const sorted = chapResp.data.chapters
                                                .sort((a: any, b: any) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
                                                .map((ch: any) => ({
                                                    title: ch.chapterTitle,
                                                    chapterNumber: String(ch.chapterNumber || '').padStart(2, '0'),
                                                }));
                                            setPublishAllBookChapters(sorted);
                                        }
                                    }
                                } catch (err) {
                                    console.error('Failed to aggregate submission data for publish:', err);
                                    setPublishAllSubmissions([submission]);
                                }
                                setShowPublishModal(true);
                            }}
                            disabled={isPublished || (submission.status !== 'PUBLISHED' && !allChaptersReady)}
                            style={{
                                backgroundColor: (submission.status === 'PUBLICATION_IN_PROGRESS') ? (allChaptersReady ? '#10B981' : '#9ca3af') : (isPublished ? '#9ca3af' : undefined),
                                color: (submission.status === 'PUBLICATION_IN_PROGRESS') ? 'white' : (isPublished ? 'white' : undefined),
                                cursor: (isPublished || (submission.status === 'PUBLICATION_IN_PROGRESS' && !allChaptersReady)) ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <FileText size={16} /> {submission.status === 'PUBLISHED' ? 'Edit Publication Details' : 'Publish Book Chapter'}
                        </button>
                        {submission.status === 'PUBLICATION_IN_PROGRESS' && !allChaptersReady && !checkingReadiness && (
                            <div style={{
                                backgroundColor: '#fffbeb',
                                border: '1px solid #f59e0b',
                                borderRadius: '6px',
                                padding: '10px 12px',
                                marginTop: '12px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px'
                            }}>
                                <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                                <p style={{ color: '#92400e', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                                    <strong>Gated:</strong> All {readinessDetails.total} chapters in "{resolvedBookTitle}" must be marked as "Ready for Publication" before you can proceed with final publishing.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showPublishModal && (
                <PublishChapterModal
                    isOpen={showPublishModal}
                    onClose={() => setShowPublishModal(false)}
                    submission={submission}
                    allSubmissions={publishAllSubmissions}
                    allBookChapters={publishAllBookChapters}
                    onSuccess={(updated?: BookChapterSubmission) => {
                        setShowPublishModal(false);
                        if (onUpdate && updated) onUpdate(updated);
                    }}
                />
            )}
        </div>
    );
};


export default EditorSubmissionDetailView;
