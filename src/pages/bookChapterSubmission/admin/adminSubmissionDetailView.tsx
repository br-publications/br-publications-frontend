import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  BookOpen,
  User,
  AlertCircle,
} from 'lucide-react';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import { bookChapterService, bookChapterEditorService } from '../../../services/bookChapterSumission.service';
import bookManagementService from '../../../services/bookManagement.service';

import SubmissionOverview from '../common/Overview/submissionOverview';
import DiscussionPanel from '../common/discussion/discussionPanel';
import SubmissionStatusHistory from '../common/history/submissionStatusHistory';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import styles from './adminSubmissionDetailView.module.css';
import PublishChapterModal from '../../../components/submissions/PublishChapterModal';
import SubmissionWorkflowView from '../common/Overview/submissionWorkflowView';
import EditorChaptersTab from '../editor/editorChaptersTab';

interface AdminSubmissionDetailViewProps {
  submission: BookChapterSubmission;
  onClose: () => void;
  onUpdate?: (submission: BookChapterSubmission) => void;
  initialTab?: 'overview' | 'actions' | 'discussions' | 'workflow';
}

type AdminTab = 'overview' | 'chapters' | 'actions' | 'discussions' | 'workflow' | 'history';

export const AdminSubmissionDetailView: React.FC<AdminSubmissionDetailViewProps> = ({
  submission,
  onClose,
  onUpdate,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab as AdminTab);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [chapterTitles, setChapterTitles] = useState<Record<string, string>>({});
  const [resolvedBookTitle, setResolvedBookTitle] = useState<string | null>(null);
  // Consolidated publication data
  const [publishAllSubmissions, setPublishAllSubmissions] = useState<BookChapterSubmission[]>([]);
  const [publishAllBookChapters, setPublishAllBookChapters] = useState<{ title: string; chapterNumber: string }[]>([]);
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
    showCancel: false,
    confirmText: 'OK'
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as AdminTab);
    }
  }, [initialTab]);

  // Fetch full submission details on mount (Self-Healing trigger & Full Data)
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
            return fetchedSub;
          });

          if (onUpdate && isInitialFetch) onUpdate(fetchedSub);
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

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
  };

  // Fetch chapter titles
  useEffect(() => {
    const loadChapterTitles = async () => {
      try {
        let bookId: number | null = null;
        const titleOrId = currentSubmission.bookTitle;

        // 1. Resolve Book ID & Title
        const parsedId = parseInt(titleOrId);
        if (!isNaN(parsedId) && titleOrId.trim() === parsedId.toString()) {
          bookId = parsedId;
          const response = await bookManagementService.bookTitle.getAllBookTitles();
          if (response.success && response.data?.bookTitles) {
            const book = response.data.bookTitles.find((b: any) => b.id === bookId);
            if (book) setResolvedBookTitle(book.title);
          }
        } else {
          const response = await bookManagementService.bookTitle.getAllBookTitles();
          if (response.success && response.data?.bookTitles) {
            const book = response.data.bookTitles.find((b: any) => b.title === titleOrId);
            if (book) {
              bookId = book.id;
              setResolvedBookTitle(book.title);
            }
          }
        }

        // 2. Fetch Chapters if we have an ID and chapters are present
        const chapters = currentSubmission.chapters || currentSubmission.bookChapterTitles;
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
  }, [currentSubmission.bookTitle, currentSubmission.chapters, currentSubmission.bookChapterTitles]);


  // Fetch reviewers for Final Decision display
  const [reviewerAssignments, setReviewerAssignments] = useState<any[]>([]);
  useEffect(() => {
    const fetchReviewers = async () => {
      if (!currentSubmission.id) return;
      try {
        const response = await bookChapterEditorService.getSubmissionReviewers(currentSubmission.id);
        if (response.success && response.data) {
          const assignments = (response.data as any).assignments || response.data;
          setReviewerAssignments(Array.isArray(assignments) ? assignments : []);
        }
      } catch (error) {
        console.error("Error fetching reviewers for admin view", error);
      }
    };
    fetchReviewers();
  }, [currentSubmission.id]);





  const handleMakeDecision = async (decision: 'accept' | 'reject', notes?: string) => {
    if (decision === 'reject' && (!notes || !notes.trim())) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Notes Required',
        message: 'Please provide a reason for the rejection in the notes field.',
        showCancel: false
      });
      return;
    }

    setAlert({
      isOpen: true,
      type: decision === 'accept' ? 'success' : 'warning',
      title: `${decision === 'accept' ? 'Accept' : 'Reject'} Abstract`,
      message: `Are you sure you want to ${decision} this abstract? This action cannot be undone.`,
      showCancel: true,
      confirmText: decision === 'accept' ? 'Accept' : 'Reject',
      onConfirm: async () => {
        try {
          const response = await bookChapterEditorService.makeEditorDecision(currentSubmission.id, {
            decision,
            notes: notes || `Abstract ${decision}ed by Admin.`
          });

          if (response.success && onUpdate && response.data) {
            onUpdate(response.data);
            setAlert({
              isOpen: true,
              type: 'success',
              title: 'Success',
              message: `Abstract ${decision}ed successfully.`,
              showCancel: false
            });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch (error: any) {
          console.error('Error making decision:', error);

          const isConflict = error?.status === 409 || error?.message?.toLowerCase().includes('already');
          const errorMessage = error?.message || 'Failed to update submission status.';

          setAlert({
            isOpen: true,
            type: 'error',
            title: isConflict ? 'Conflict' : 'Error',
            message: errorMessage,
            showCancel: false
          });

          if (isConflict) {
            setTimeout(() => {
              window.location.reload();
            }, 2500);
          }
        }
      }
    });
  };

  const handlePublish = async () => {
    // Fetch all submissions and all chapters for the same book title before opening wizard
    try {
      const bookTitleValue = currentSubmission.bookTitle;

      // 1. Fetch all submissions for the same book title
      const subResp = await bookChapterService.getSubmissionsByBookTitle(bookTitleValue);
      if (subResp.success && subResp.data?.submissions) {
        setPublishAllSubmissions(subResp.data.submissions as BookChapterSubmission[]);
      } else {
        setPublishAllSubmissions([currentSubmission]);
      }

      // 2. Fetch all chapters from DB for the book title (to pre-fill TOC)
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
          const chapters = chapResp.data.chapters
            .sort((a: any, b: any) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
            .map((ch: any) => ({
              title: ch.chapterTitle,
              chapterNumber: String(ch.chapterNumber || '').padStart(2, '0'),
            }));
          setPublishAllBookChapters(chapters);
        }
      }
    } catch (err) {
      console.error('Failed to aggregate submission data for publish:', err);
      setPublishAllSubmissions([currentSubmission]);
    }

    setShowPublishModal(true);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onClose} className={styles.backButton}>
          <ChevronLeft size={20} />
          Back to Dashboard
        </button>
        <div className={styles.headerActions}>
          <span className={`${styles.statusBadge} ${styles[currentSubmission.status.toLowerCase()]}`}>
            {currentSubmission.status.replace('_', ' ')}
          </span>

        </div>
      </div>

      {/* Author Bar 
      <div className={styles.authorBar}>
        <div className={styles.authorProfile}>
          <div className={styles.authorAvatar}>
            <User size={24} />
          </div>
          <div>
            <h3 className={styles.authorName}>{currentSubmission.mainAuthor.firstName} {currentSubmission.mainAuthor.lastName}</h3>
            <p className={styles.authorEmail}>{currentSubmission.mainAuthor.email}</p>
          </div>
        </div>
        <div className={styles.submissionId}>ID: #{currentSubmission.id}</div>
      </div> */}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <FileText size={18} /> Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'chapters' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('chapters')}
        >
          <BookOpen size={18} /> Chapters
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'workflow' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('workflow')}
        >
          <Clock size={18} /> Workflow
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <Clock size={18} /> History
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'discussions' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('discussions')}
        >
          <MessageSquare size={18} /> Discussions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'actions' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('actions')}
        >
          <CheckCircle size={18} /> Actions
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
            readOnly={false}
            onUpdate={onUpdate}
            userRole="admin"
          />
        )}

        {activeTab === 'workflow' && (
          <SubmissionWorkflowView submission={currentSubmission} />
        )}

        {activeTab === 'history' && (
          <div className={styles.workflowContainer}>
            <SubmissionStatusHistory submissionId={currentSubmission.id} />
          </div>
        )}

        {activeTab === 'actions' && (
          <ActionsTab
            submission={currentSubmission}
            onMakeDecision={handleMakeDecision}
            onPublish={handlePublish}
            chapterTitles={chapterTitles}
            resolvedBookTitle={resolvedBookTitle || currentSubmission.bookTitle}
            reviewerAssignments={reviewerAssignments}
            setAlert={setAlert}
          />
        )}

        {activeTab === 'discussions' && (
          <DiscussionPanel
            currentUserRole="admin"
            submissionId={currentSubmission.id}
            submissionStatus={currentSubmission.status}
          />
        )}
      </div>



      {showPublishModal && (
        <PublishChapterModal
          isOpen={true}
          submission={currentSubmission}
          onClose={() => setShowPublishModal(false)}
          allSubmissions={publishAllSubmissions}
          allBookChapters={publishAllBookChapters}
          onSuccess={(updated?: BookChapterSubmission) => {
            setShowPublishModal(false);
            if (onUpdate && updated) onUpdate(updated);
          }}
        />
      )}

      {/* Alert Popup */}
      <AlertPopup
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        onConfirm={alert.onConfirm}
        showCancel={alert.showCancel}
        confirmText={alert.confirmText}
      />
    </div>
  );
};

// Actions Tab
const ActionsTab: React.FC<{
  submission: BookChapterSubmission;
  onMakeDecision: (decision: 'accept' | 'reject', notes?: string) => void;
  onPublish: () => void;
  chapterTitles: Record<string, string>;
  resolvedBookTitle: string;
  reviewerAssignments?: any[];
  setAlert: React.Dispatch<React.SetStateAction<any>>;
}> = ({ submission, onMakeDecision, onPublish, chapterTitles, resolvedBookTitle, reviewerAssignments = [], setAlert }) => {
  const [notes, setNotes] = useState('');
  const [finalNotes, setFinalNotes] = useState('');
  const [isSubmittingIsbn, setIsSubmittingIsbn] = useState(false);
  const [isStartingPublication, setIsStartingPublication] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

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

  const canMakeDecision = [
    'ABSTRACT_SUBMITTED',
  ].includes(submission.status);

  // Check for Final Decision capability
  // Logic: 
  // 1. If status is already EDITORIAL_REVIEW
  // 2. OR if all individual chapters have a decision (APPROVED/REJECTED)
  const allChaptersDecided = submission.individualChapters && submission.individualChapters.length > 0 && submission.individualChapters.every(
    (ch: any) => ch.status === 'CHAPTER_APPROVED' || ch.status === 'CHAPTER_REJECTED'
  );

  const readyForFinalDecision =
    ['EDITORIAL_REVIEW'].includes(submission.status) ||
    (allChaptersDecided === true && !['APPROVED', 'PUBLISHED', 'REJECTED'].includes(submission.status));

  const handleFinalDecision = async (decision: 'approve' | 'reject') => {
    if (decision === 'reject' && (!finalNotes || !finalNotes.trim())) {
      window.dispatchEvent(new CustomEvent('app-alert', {
        detail: {
          type: 'error',
          title: 'Notes Required',
          message: 'Please provide final notes for the author explaining the rejection.'
        }
      }));
      return;
    }

    try {
      await bookChapterEditorService.makeFinalDecision(submission.id, {
        decision,
        notes: finalNotes
      });

      window.dispatchEvent(new CustomEvent('app-alert', {
        detail: {
          type: 'success',
          title: 'Success',
          message: 'Decision recorded successfully.'
        }
      }));

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to make final decision", error);

      const isConflict = error?.status === 409 || error?.response?.status === 409 || error?.message?.includes('already taken');
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to record decision.';

      window.dispatchEvent(new CustomEvent('app-alert', {
        detail: {
          type: 'error',
          title: isConflict ? 'Conflict' : 'Error',
          message: errorMessage
        }
      }));

      if (isConflict) {
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      }
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile) return;
    setIsUploadingProof(true);
    try {
      await bookChapterEditorService.submitProof(submission.id, proofFile);
      window.dispatchEvent(new CustomEvent('app-alert', {
        detail: { type: 'success', title: 'Success', message: 'Proof document sent to author.' }
      }));
      setProofFile(null);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('app-alert', {
        detail: { type: 'error', title: 'Error', message: error?.message || 'Failed to upload proof' }
      }));
    } finally {
      setIsUploadingProof(false);
    }
  };

  return (
    <div className={styles.actionsTab}>
      {/* Step 1: Abstract Decision Action */}
      <div className={`${styles.stepContainer} ${canMakeDecision ? styles.active : ''} ${!canMakeDecision && !readyForFinalDecision ? styles.completedPhase : ''}`}>
        <div className={styles.stepHeader}>
          <h4 className={styles.stepTitle}>
            <div className={styles.stepNumber}>1</div>
            Abstract Review
          </h4>
          <span className={`${styles.stepStatus} ${canMakeDecision ? styles.pending : (readyForFinalDecision || submission.status === 'APPROVED' ? styles.completed : '')}`}>
            {canMakeDecision ? 'Action Required' : (submission.status === 'APPROVED' ? 'Approved' : 'Completed')}
          </span>
        </div>

        {canMakeDecision && (
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
                    {submission.individualChapters && submission.individualChapters.length > 0 ? (
                      submission.individualChapters.map((chapter: any, index: number) => (
                        <li key={index}>{chapter.chapterTitle}</li>
                      ))
                    ) : (
                      (submission.chapters || submission.bookChapterTitles)?.map((chapterId, index) => (
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
                    {submission.keywords.map((keyword, index) => (
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
                        <span style={{ marginLeft: '8px', fontSize: '11px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>
                          Corresponding
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Name:</strong> {submission.mainAuthor.firstName} {submission.mainAuthor.lastName}</p>
                    <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Institution:</strong> {submission.mainAuthor.instituteName}</p>
                    <p style={{ fontSize: '0.9em', color: '#4b5563', margin: '2px 0' }}><strong>Email:</strong> {submission.mainAuthor.email}</p>
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
                                  <span style={{ marginLeft: '8px', fontSize: '11px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>
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
              />
              <div className={styles.decisionButtons}>
                <button
                  className={styles.acceptButton}
                  onClick={() => onMakeDecision('accept', notes)}
                >
                  <CheckCircle size={16} /> Accept Abstract
                </button>
                <button
                  className={styles.rejectButton}
                  onClick={() => onMakeDecision('reject', notes)}
                >
                  <X size={16} /> Reject Abstract
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Final Decision Section */}
      {(readyForFinalDecision || submission.status === 'APPROVED' || submission.status === 'REJECTED' || submission.status === 'PUBLISHED' || submission.status === 'ISBN_APPLIED' || submission.status === 'PUBLICATION_IN_PROGRESS') && (
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
            {/* Reviewer Feedback Summary - UPGRADED */}
            {reviewerAssignments.length > 0 && (
              <div className={styles.reviewerFeedback}>
                <h5 className={styles.feedbackTitle} style={{ fontWeight: '600', marginBottom: '10px' }}>Reviewer Recommendations</h5>
                {reviewerAssignments.map((assignment, index) => (
                  <div key={index} className={styles.reviewerFeedbackCard}>
                    <div className={styles.reviewerHeader}>
                      <div className={styles.reviewerInfo}>
                        <User size={16} />
                        <span className={styles.reviewerName}>
                          {assignment.reviewer?.fullName || `Reviewer ${index + 1}`}
                        </span>
                      </div>
                      <span className={`${styles.recommendationBadge} ${styles[assignment.recommendation === 'APPROVE' ? 'approve' : (assignment.recommendation === 'REJECT' ? 'reject' : 'pending')]}`}>
                        {assignment.recommendation === 'APPROVE' && <CheckCircle size={14} />}
                        {assignment.recommendation === 'REJECT' && <X size={14} />}
                        {assignment.recommendation || 'Pending'}
                      </span>
                    </div>
                    <div className={styles.reviewerComments}>
                      <p className={styles.commentsLabel}>Comments</p>
                      <p className={styles.commentsText}>
                        {assignment.reviewerComments || 'No comments provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Final Decision Area */}
            {['APPROVED', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS', 'PUBLISHED', 'REJECTED'].includes(submission.status) ? (
              <div className={styles.decisionArea}>
                <h5 className={styles.decisionTitle}>Final Decision Recorded</h5>
                <p>This submission has been <strong>{submission.status.replace('_', ' ')}</strong>.</p>
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
                  disabled={!readyForFinalDecision}
                />
                <div className={styles.decisionButtons}>
                  <button
                    className={styles.acceptButton}
                    disabled={!readyForFinalDecision}
                    style={{ opacity: !readyForFinalDecision ? 0.5 : 1 }}
                    onClick={() => {
                      setAlert({
                        isOpen: true,
                        type: 'success',
                        title: 'Approve Submission',
                        message: 'Are you sure you want to approve this submission? This will notify the author and move it to the ISBN stage.',
                        showCancel: true,
                        confirmText: 'Approve',
                        onConfirm: () => handleFinalDecision('approve')
                      });
                    }}
                  >
                    <CheckCircle size={16} /> Approve Submission
                  </button>
                  <button
                    className={styles.rejectButton}
                    disabled={!readyForFinalDecision}
                    style={{ opacity: !readyForFinalDecision ? 0.5 : 1 }}
                    onClick={() => {
                      setAlert({
                        isOpen: true,
                        type: 'warning',
                        title: 'Reject Submission',
                        message: 'Are you sure you want to reject this submission? This action cannot be undone.',
                        showCancel: true,
                        confirmText: 'Reject',
                        onConfirm: () => handleFinalDecision('reject')
                      });
                    }}
                  >
                    <X size={16} /> Reject Submission
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Proof Editing */}
      {(submission.status === 'APPROVED' || submission.status === 'ISBN_APPLIED' || submission.status === 'PUBLICATION_IN_PROGRESS' || submission.status === 'PUBLISHED') && (
        <div className={`${styles.stepContainer} ${['APPROVED', 'ISBN_APPLIED'].includes(submission.status) ? styles.active : ''} ${['APPROVED', 'ISBN_APPLIED'].includes(submission.status) ? '' : styles.completedPhase}`}>
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
                  disabled={isSubmittingIsbn}
                  onClick={async () => {
                    if (isSubmittingIsbn) return;
                    setIsSubmittingIsbn(true);
                    try {
                      await bookChapterEditorService.applyIsbn(submission.id, 'Starting proof editing');
                      window.dispatchEvent(new CustomEvent('app-alert', {
                        detail: { type: 'success', title: 'Success', message: 'Proof editing phase started.' }
                      }));
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (error: any) {
                      window.dispatchEvent(new CustomEvent('app-alert', {
                        detail: { type: 'error', title: 'Error', message: error?.message || 'Failed to start proof editing' }
                      }));
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
                    <CheckCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Author has accepted the proof document.
                  </div>
                ) : submission.proofStatus === 'SENT' ? (
                  <div style={{ padding: '10px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '6px', color: '#92400e', marginBottom: '10px' }}>
                    <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Proof sent to author. Waiting for confirmation.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {submission.proofStatus === 'REJECTED' && (
                      <div style={{ padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '6px', color: '#991b1b', marginBottom: '5px' }}>
                        <X size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        <strong>Proof Rejected:</strong> {submission.authorProofNotes || 'No notes provided'}
                      </div>
                    )}
                    <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>Upload the final proof document for author confirmation:</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className={styles.fileInput}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                    />
                    <button
                      className={styles.acceptButton}
                      disabled={!proofFile || isUploadingProof}
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

      {/* Step 4: Start Publication */}
      {(submission.status === 'ISBN_APPLIED' || submission.status === 'PUBLICATION_IN_PROGRESS' || submission.status === 'PUBLISHED') && (
        <div className={`${styles.stepContainer} ${submission.status === 'ISBN_APPLIED' ? styles.active : ''} ${['PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status) ? styles.completedPhase : ''}`}>
          <div className={styles.stepHeader}>
            <h4 className={styles.stepTitle}>
              <div className={styles.stepNumber}>4</div>
              Start Publication
            </h4>
            <span className={`${styles.stepStatus} ${submission.status === 'ISBN_APPLIED' ? (['ACCEPTED', 'REJECTED'].includes(submission.proofStatus || '') ? styles.pending : styles.completed) : styles.completed}`}>
              {submission.status === 'ISBN_APPLIED' ? (['ACCEPTED', 'REJECTED'].includes(submission.proofStatus || '') ? 'Action Required' : 'Waiting for Proof') : 'Started'}
            </span>
          </div>

          <div className={styles.stepContent}>
            {submission.status === 'ISBN_APPLIED' ? (
              <div className={styles.decisionArea}>
                <h5 className={styles.decisionTitle}>Enter ISBN &amp; Start Publication</h5>
                <p style={{ marginBottom: '10px' }}>Proof editing is complete. Enter the ISBN (required) and DOI (optional) to start publication.</p>
                <textarea
                  className={styles.decisionNotes}
                  placeholder="Add notes (optional)..."
                  rows={3}
                  id="admin-publication-notes"
                  style={{ marginBottom: '10px' }}
                />
                <button
                  className={styles.acceptButton}
                  style={{ backgroundColor: ['ACCEPTED', 'REJECTED'].includes(submission.proofStatus || '') ? '#0ea5e9' : '#9ca3af', color: 'white' }}
                  disabled={isStartingPublication || !['ACCEPTED', 'REJECTED'].includes(submission.proofStatus || '')}
                  onClick={async () => {
                    if (isStartingPublication || !['ACCEPTED', 'REJECTED'].includes(submission.proofStatus || '')) return;
                    setIsStartingPublication(true);
                    const notes = (document.getElementById('admin-publication-notes') as HTMLTextAreaElement)?.value || '';
                    try {
                      await bookChapterEditorService.receiveIsbn(submission.id, { notes });
                      window.dispatchEvent(new CustomEvent('app-alert', {
                        detail: { type: 'success', title: 'Success', message: 'Publication started successfully.' }
                      }));
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (error: any) {
                      window.dispatchEvent(new CustomEvent('app-alert', {
                        detail: { type: 'error', title: 'Error', message: error?.message || 'Failed to start publication' }
                      }));
                      setIsStartingPublication(false);
                    }
                  }}
                >
                  <FileText size={16} style={{ marginRight: '8px' }} />
                  {['ACCEPTED', 'REJECTED'].includes(submission.proofStatus || '') ? (isStartingPublication ? 'Starting...' : 'Start Publication') : 'Waiting for Proof Acceptance'}
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

      {/* Step 5: Publication */}
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
              {submission.status === 'PUBLICATION_IN_PROGRESS' && !(submission as any).deliveryAddress && (
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
              )}
              <button
                className={`${styles.actionButton} ${submission.status === 'PUBLISHED' ? styles.secondaryButton : (allChaptersReady ? styles.primaryButton : styles.disabledButton)}`}
                onClick={() => {
                  if (submission.status !== 'PUBLISHED' && !allChaptersReady) {
                    window.dispatchEvent(new CustomEvent('app-alert', {
                      detail: {
                        type: 'warning',
                        title: 'Chapters Not Ready',
                        message: `Cannot publish yet. Only ${readinessDetails.ready} out of ${readinessDetails.total} chapters are marked as "Ready for Publication".`
                      }
                    }));
                    return;
                  }
                  onPublish();
                }}
                disabled={submission.status !== 'PUBLISHED' && !allChaptersReady}
                style={{
                  backgroundColor: (submission.status === 'PUBLICATION_IN_PROGRESS') ? (allChaptersReady ? '#10B981' : '#9ca3af') : undefined,
                  color: (submission.status === 'PUBLICATION_IN_PROGRESS') ? 'white' : undefined,
                  cursor: (submission.status === 'PUBLICATION_IN_PROGRESS' && !allChaptersReady) ? 'not-allowed' : 'pointer',
                }}
              >
                <FileText size={16} /> {submission.status === 'PUBLISHED' ? 'Edit Publication Details' : 'Publish Book Chapter'}
              </button>
              {submission.status === 'PUBLICATION_IN_PROGRESS' && !allChaptersReady && !checkingReadiness && (
                <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '8px' }}>
                  <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Gated: All {readinessDetails.total} chapters in "{resolvedBookTitle}" must be ready before publishing.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};




