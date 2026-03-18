import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  FileText,
  MessageSquare,
  Clock,
  Edit2,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import type { BookChapterSubmission } from '../../../types/submissionTypes';
import type { IndividualChapter } from '../../../types/chapterTypes';
import SubmissionOverview from '../common/Overview/submissionOverview';
import FileUploadModal from '../common/files/fileUploadModal';
import DiscussionPanel from '../common/discussion/discussionPanel';
import SubmissionWorkflowView from '../common/Overview/submissionWorkflowView';
import SubmissionStatusHistory from '../common/history/submissionStatusHistory';
import ChapterList from '../common/chapters/chapterList';
import ChapterDetailModal from '../common/chapters/chapterDetailModal';
import ChapterProgressBar from '../common/status/chapterProgressBar';
import styles from './authorSubmissionDetailView.module.css';
import { bookChapterService } from '../../../services/bookChapterSumission.service';
import chapterService from '../../../services/chapter.service';
import DeliveryAddressForm from '../../components/common/deliveryAddressForm';
import { DESIGNATIONS } from '../../../types/bookChapterManuscriptTypes';
import { ChevronDown, ChevronUp, Save, Plus, Trash2 } from 'lucide-react';
import PhoneNumberInput from '../../../components/common/PhoneNumberInput';
import bookManagementService from '../../../services/bookManagement.service';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';

// ... existing code ...


interface AuthorSubmissionDetailViewProps {
  submission: BookChapterSubmission;
  onClose: () => void;
  onUpdate?: (submission: BookChapterSubmission) => void;
  initialTab?: 'overview' | 'chapters' | 'discussions' | 'workflow' | 'history' | 'edit' | 'upload';
}

type TabType = 'overview' | 'chapters' | 'upload' | 'discussions' | 'workflow' | 'history' | 'edit' | 'actions';

export const AuthorSubmissionDetailView: React.FC<AuthorSubmissionDetailViewProps> = ({
  submission,
  onClose,
  onUpdate,
  initialTab = 'overview', // Default to overview
}) => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(tabParam || initialTab as TabType);
  const [localSubmission, setLocalSubmission] = useState<BookChapterSubmission>(submission);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeliveryAddressForm, setShowDeliveryAddressForm] = useState(false);
  const [chapters, setChapters] = useState<IndividualChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
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

  useEffect(() => {
    const handleAppAlert = (e: any) => {
      setAlert({
        isOpen: true,
        type: e.detail.type,
        title: e.detail.title,
        message: e.detail.message
      });
    };

    window.addEventListener('app-alert', handleAppAlert);
    return () => window.removeEventListener('app-alert', handleAppAlert);
  }, []);

  const [selectedChapter, setSelectedChapter] = useState<IndividualChapter | null>(null);
  const [showChapterDetail, setShowChapterDetail] = useState(false);

  // Update local submission when prop changes
  // Update local submission when prop changes and clear chapter cache
  useEffect(() => {
    setLocalSubmission(submission);
    // Clear chapters cache when submission changes to force reload
    setChapters([]);
  }, [submission]);

  // Load chapters when chapters tab is accessed
  useEffect(() => {
    if (activeTab === 'chapters') {
      loadChapters();
    }
  }, [activeTab]);

  const loadChapters = async () => {
    setLoadingChapters(true);
    try {
      let loadedChapters: IndividualChapter[] = [];
      const responseChapters = await chapterService.getChaptersBySubmission(localSubmission.id);

      if (responseChapters.success && responseChapters.data) {
        loadedChapters = responseChapters.data;


        // 2. If chapterTitle is numeric(ID), try to map them to actual titles
        const hasNumericTitles = loadedChapters.some((ch: any) => !isNaN(Number(ch.chapterTitle)));


        if (hasNumericTitles) {


          let bookId: number | null = null;
          const bookTitleOrId = localSubmission.bookTitle;

          // Try to see if bookTitle is already an ID (numeric string)
          const parsedBookId = parseInt(bookTitleOrId);
          if (!isNaN(parsedBookId) && bookTitleOrId.trim() === parsedBookId.toString()) {
            bookId = parsedBookId;

          } else {
            // It's a title name, find the ID

            const booksResponse = await bookManagementService.bookTitle.getAllBookTitles({ activeOnly: true });
            if (booksResponse.success && booksResponse.data?.bookTitles) {
              const currentBook = booksResponse.data.bookTitles.find((b: any) => b.title === bookTitleOrId);
              if (currentBook) {
                bookId = currentBook.id;

              }
            }
          }

          if (bookId) {
            const chaptersResponse = await bookManagementService.bookChapter.getChaptersByBookTitle(bookId);


            if (chaptersResponse.success && chaptersResponse.data?.chapters) {
              const validAvailableChapters = chaptersResponse.data.chapters;


              // 3. Map IDs to Titles
              loadedChapters = loadedChapters.map((ch: IndividualChapter) => {
                const titleVal = ch.chapterTitle;
                if (!isNaN(Number(titleVal))) {
                  const found = validAvailableChapters.find((ac: any) => ac.id === Number(titleVal));
                  if (found) {
                    return { ...ch, chapterTitle: found.chapterTitle };
                  }
                }
                return ch;
              });


            }
          }
        }
        setChapters(loadedChapters);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleChapterClick = (chapter: IndividualChapter) => {
    setSelectedChapter(chapter);
    setShowChapterDetail(true);
  };

  const handleChapterUpload = (chapter: IndividualChapter) => {
    setSelectedChapter(chapter);
    setShowUploadModal(true);
  };

  // Determine if upload tab should be visible
  // Show upload tab when:
  // 1. Manuscripts are pending (MANUSCRIPTS_PENDING)
  // 2. Reviewer requests revision (REVISION_REQUESTED) - Global or Chapter level
  const isRevisionRequired = chapters.some(ch => ch.status === 'REVISION_REQUESTED');
  const isUploadRequired =
    submission.status === 'MANUSCRIPTS_PENDING' || isRevisionRequired;

  // Auto-switch to upload tab if it's the primary action needed and no specific tab requested
  useEffect(() => {
    if (!initialTab) {
      if (isUploadRequired) {
        setActiveTab('upload');
      } else if (submission.status === 'MANUSCRIPTS_PENDING') {
        setActiveTab('chapters');
      }
    }
  }, [isUploadRequired, initialTab, submission.status]);

  // Update active tab if initialTab changes (for external linking)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as TabType);
    }
  }, [initialTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
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
          <span className={`${styles.statusBadge} ${styles[submission.status.toLowerCase()]}`}>
            {submission.status.replace('_', ' ')}
          </span>
        </div>
      </div>

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
        {!['APPROVED', 'REJECTED', 'PUBLISHED', 'UNDER_REVIEW', 'EDITORIAL_REVIEW', 'REVIEWER_ASSIGNMENT', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS', 'MANUSCRIPTS_PENDING'].includes(submission.status) && (
          <button
            className={`${styles.tab} ${activeTab === 'edit' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('edit')}
          >
            <Edit2 size={18} /> Edit
          </button>
        )}
        <button
          className={`${styles.tab} ${activeTab === 'actions' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('actions')}
        >
          <BookOpen size={18} /> Actions
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'overview' && (
          <SubmissionOverview
            submission={submission}
          />
        )}

        {activeTab === 'chapters' && (
          <div className={styles.chaptersContainer}>
            {chapters.length > 0 && (
              <div className={styles.chapterProgress}>
                <ChapterProgressBar chapters={chapters} showDetails={true} />
              </div>
            )}

            {loadingChapters ? (
              <div className={styles.loading}>Loading chapters...</div>
            ) : chapters.length > 0 ? (
              <ChapterList
                chapters={chapters}
                userRole="author"
                onChapterClick={handleChapterClick}
                onChapterUpload={handleChapterUpload}
                showFilters={true}
                showUploadForRevision={true} // Explicitly enable upload for revisions
              />
            ) : (
              <div className={styles.emptyState}>
                <p>No chapters found for this submission.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className={styles.workflowContainer}>
            <SubmissionWorkflowView submission={submission} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.workflowContainer}>
            <SubmissionStatusHistory submissionId={submission.id} />
          </div>
        )}

        {activeTab === 'discussions' && (
          <DiscussionPanel
            currentUserRole="author"
            submissionId={submission.id}
            submissionStatus={submission.status}
          />
        )}

        {activeTab === 'edit' && !['APPROVED', 'REJECTED', 'PUBLISHED', 'UNDER_REVIEW', 'EDITORIAL_REVIEW', 'REVIEWER_ASSIGNMENT', 'ISBN_APPLIED', 'PUBLICATION_IN_PROGRESS', 'MANUSCRIPTS_PENDING'].includes(localSubmission.status) ? (
          <EditTab
            submission={localSubmission}
            onUpdate={(updated) => {
              setLocalSubmission(updated);
              if (onUpdate) onUpdate(updated);
              // Reload chapters to reflect any changes
              setTimeout(() => loadChapters(), 500);
            }}
            onCancel={() => handleTabChange('overview')}
          />
        ) : activeTab === 'edit' ? (
          <div className={styles.emptyState}>
            <p>Editing is not available for this submission status.</p>
            <button className={styles.uploadPrimaryButton} onClick={() => handleTabChange('overview')}>
              Return to Overview
            </button>
          </div>
        ) : null}

        {/* {activeTab === 'upload' && isUploadRequired && (
          <div className={styles.uploadTabContainer}>
            <div className={styles.uploadCta}>
              <Upload size={48} className={styles.uploadCtaIcon} />
              {submission.status === 'MANUSCRIPTS_PENDING' ? (
                <>
                  <h3>Full Chapter Manuscript Required</h3>
                  <p>The editor has accepted your abstract and requested the full chapter manuscript. Please upload your document to proceed with the review process.</p>
                </>
              ) : isRevisionRequired ? (
                <>
                  <h3>Revision Required</h3>
                  <p>The reviewer has requested revisions to your manuscript. Please upload the revised version addressing the feedback provided in the discussions.</p>
                </>
              ) : null}

              {submission.status === 'MANUSCRIPTS_PENDING' ? (
                <button className={styles.uploadPrimaryButton} onClick={() => handleTabChange('chapters')}>
                  <BookOpen size={18} /> Go to Chapters
                </button>
              ) : (
                <button className={styles.uploadPrimaryButton} onClick={() => setShowUploadModal(true)}>
                  <Upload size={18} /> Upload {isRevisionRequired ? 'Revised' : ''} Manuscript
                </button>
              )}
            </div>
          </div>
        )} */}
        {activeTab === 'actions' && (
          <div className={styles.actionsTab}>
            {localSubmission.status === 'PUBLICATION_IN_PROGRESS' && !localSubmission.deliveryAddress && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '20px',
                backgroundColor: '#fffbeb',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                marginBottom: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}>
                <AlertCircle size={24} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '700', color: '#92400e' }}>
                    Action Required: Submit Your Delivery Address
                  </h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '0.95rem', color: '#78350f', lineHeight: '1.5' }}>
                    Publication has been initiated for your book chapter. We need your current delivery address to proceed with the final publication and copy dispatch.
                  </p>
                  <button
                    onClick={() => setShowDeliveryAddressForm(true)}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                  >
                    Submit Delivery Address Now →
                  </button>
                </div>
              </div>
            )}

            <div className={styles.actionsGrid}>
              {localSubmission.status === 'PUBLICATION_IN_PROGRESS' && !localSubmission.deliveryAddress ? (
                /* Hidden as we show the banner above, but kept if the grid expands */
                null
              ) : (
                <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.emptyStateIcon}>✓</div>
                  <h3>No actions required</h3>
                  <p>
                    {localSubmission.status === 'PUBLICATION_IN_PROGRESS' && localSubmission.deliveryAddress
                      ? 'Delivery address has been submitted. The admin team will finalize the publication soon.'
                      : 'Your submission is currently being processed.'}
                  </p>
                  <p className={styles.statusText}>
                    Current status: <strong>{localSubmission.status.replace(/_/g, ' ')}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showDeliveryAddressForm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeliveryAddressForm(false)}>
          <div className={styles.modal} style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }} onClick={e => e.stopPropagation()}>
            <DeliveryAddressForm
              submissionId={submission.id}
              type="chapter"
              onSuccess={(savedAddress) => {
                setShowDeliveryAddressForm(false);
                const updatedSubmission = {
                  ...localSubmission, // Merge with local state to reflect current reality immediately
                  deliveryAddress: savedAddress
                };
                if (onUpdate) onUpdate(updatedSubmission);
                // Update local state instantly so UI drops the banner/action card without reloading
                setLocalSubmission(updatedSubmission);
              }}
              onCancel={() => setShowDeliveryAddressForm(false)}
            />
          </div>
        </div>
      )}

      {/* Upload Modal (when triggered from status alert button or otherwise) */}
      {showUploadModal && (
        <FileUploadModal
          submission={submission}
          chapterInfo={selectedChapter ? {
            chapterId: selectedChapter.id,
            chapterNumber: selectedChapter.chapterNumber,
            chapterTitle: selectedChapter.chapterTitle
          } : undefined}
          isRevisionUpload={isRevisionRequired}
          onUploadSuccess={() => {
            setShowUploadModal(false);
            setSelectedChapter(null);
            if (onUpdate) {
              onUpdate(submission);
            }
            // Reload chapters if we're on the chapters tab
            if (activeTab === 'chapters') {
              loadChapters();
            }
          }}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedChapter(null);
          }}
        />
      )}
      {/* Chapter Detail Modal */}
      {showChapterDetail && selectedChapter && (
        <ChapterDetailModal
          chapter={selectedChapter}
          userRole="author"
          onClose={() => {
            setShowChapterDetail(false);
            setSelectedChapter(null);
          }}
          onUpdate={(updatedChapter) => {
            // Update the chapter in the list
            setChapters(prev =>
              prev.map(c => c.id === updatedChapter.id ? updatedChapter : c)
            );
            // Also notify parent if needed
            if (onUpdate) {
              onUpdate(submission);
            }
          }}
          onUpload={() => {
            // Close the detail modal and open upload modal
            setShowChapterDetail(false);
            setShowUploadModal(true);
            // selectedChapter is already set
          }}
        />
      )}

      {/* Global Alert Popup */}
      <AlertPopup
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

// Edit Tab Component (Enhanced)
interface EditTabProps {
  submission: BookChapterSubmission;
  onUpdate?: (submission: BookChapterSubmission) => void;
  onCancel: () => void;
}

const EditTab: React.FC<EditTabProps> = ({ submission, onUpdate, onCancel }) => {
  // State for form data
  const [formData, setFormData] = useState({
    bookTitle: submission.bookTitle,
    bookChapterTitles: submission.bookChapterTitles || (submission as any).chapters || [],
    abstract: submission.abstract || '',
    keywords: submission.keywords ? submission.keywords.join(', ') : '',
    mainAuthor: { otherDesignation: '', ...submission.mainAuthor },
    coAuthors: (submission.coAuthors || []).map(ca => ({ otherDesignation: '', ...ca })),
    selectedEditorId: (submission as any).designatedEditorId?.toString() || (submission as any).assignedEditorId?.toString() || ''
  });

  // State for available chapters and book titles
  const [availableChapters, setAvailableChapters] = useState<Array<{ id: string, chapterTitle: string }>>([]);
  const [bookTitles, setBookTitles] = useState<Array<{ id: number, title: string }>>([]);
  const [availableEditors, setAvailableEditors] = useState<Array<{ id: number, fullName: string, email: string }>>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState<boolean>(false);
  const [isLoadingEditors, setIsLoadingEditors] = useState<boolean>(false);

  // UI State
  const [activeSection, setActiveSection] = useState<'details' | 'author' | 'coauthors'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch book titles on component mount
  useEffect(() => {
    fetchBookTitles();
  }, []);

  // Fetch chapters when book title changes
  useEffect(() => {
    if (formData.bookTitle) {
      fetchChapters(formData.bookTitle);
      fetchEditors(formData.bookTitle);
    } else {
      setAvailableChapters([]);
      setAvailableEditors([]);
    }
  }, [formData.bookTitle]);

  // Fetch book titles from API
  const fetchBookTitles = async () => {
    setIsLoadingBooks(true);
    try {
      const response = await bookManagementService.bookTitle.getAllBookTitles();
      if (response.success && response.data && response.data.bookTitles) {
        setBookTitles(response.data.bookTitles.map((book: any) => ({
          id: book.id,
          title: book.title
        })));
      }
    } catch (error) {
      console.error('Error fetching book titles:', error);
      setError('Failed to load book titles. Please refresh the page.');
    } finally {
      setIsLoadingBooks(false);
    }
  };

  // Fetch chapters when book title changes
  const fetchChapters = async (bookTitleId: string | number) => {
    setIsLoadingChapters(true);
    let resolvedId: number | null = null;

    if (!bookTitleId) {
      setAvailableChapters([]);
      setIsLoadingChapters(false);
      return;
    }

    // Try to parse the ID
    const parsedId = typeof bookTitleId === 'number' ? bookTitleId : parseInt(bookTitleId);

    if (!isNaN(parsedId)) {
      resolvedId = parsedId;
    } else {
      // If it's not a number, maybe it's the title string? Try to find it in bookTitles
      const book = bookTitles.find(b => b.title === bookTitleId);
      if (book) {
        resolvedId = book.id;
        // Also update form data to use ID to keep it consistent
        setFormData(prev => ({ ...prev, bookTitle: book.id.toString() }));
      } else {
        console.warn('Could not resolve book title to ID:', bookTitleId);
      }
    }

    if (!resolvedId) {
      // If we still don't have an ID, we can't fetch chapters
      // But if bookTitles are still loading, this might happen.
      // We'll rely on the useEffect dependency on bookTitles to retry?
      // No, useEffect only watches formData.bookTitle.
      // Let's just fail gracefully.

      setAvailableChapters([]);
      setIsLoadingChapters(false);
      return;
    }

    try {
      const response = await bookManagementService.bookChapter.getChaptersByBookTitle(resolvedId);
      if (response.success && response.data && response.data.chapters) {
        setAvailableChapters(response.data.chapters.map((chapter: any) => ({
          id: chapter.id.toString(),
          chapterTitle: chapter.chapterTitle
        })));
      }
    } catch (err: any) {
      console.error('Error fetching chapters:', err);
      // Only show error if we actually tried to fetch and failed
      setError('Failed to load chapters for the selected book.');
      setAvailableChapters([]);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const fetchEditors = async (bookTitleId: string | number) => {
    setIsLoadingEditors(true);
    let resolvedId: number | null = null;
    const parsedId = typeof bookTitleId === 'number' ? bookTitleId : parseInt(bookTitleId);
    if (!isNaN(parsedId)) {
      resolvedId = parsedId;
    } else {
      const book = bookTitles.find(b => b.title === bookTitleId);
      if (book) resolvedId = book.id;
    }

    if (!resolvedId) {
      setAvailableEditors([]);
      setIsLoadingEditors(false);
      return;
    }

    try {
      const response = await bookManagementService.bookEditor.getEditorsByBookTitle(resolvedId);
      if (response.success && response.data && response.data.editors) {
        setAvailableEditors(
          response.data.editors.map((assignment: any) => ({
            id: assignment.editor.id,
            fullName: assignment.editor.fullName,
            email: assignment.editor.email
          }))
        );
      } else {
        setAvailableEditors([]);
      }
    } catch (error) {
      console.error('Error fetching editors:', error);
      setAvailableEditors([]);
    } finally {
      setIsLoadingEditors(false);
    }
  };

  // Trigger fetchChapters when bookTitles load if we have a title but no chapters
  useEffect(() => {
    if (bookTitles.length > 0 && formData.bookTitle && availableChapters.length === 0) {
      fetchChapters(formData.bookTitle);
      fetchEditors(formData.bookTitle);
    }
  }, [bookTitles]);


  // Handlers
  const handleInputChange = (section: string, field: string, value: any, index?: number) => {
    setFormData(prev => {
      if (section === 'details') {
        return { ...prev, [field]: value };
      }
      if (section === 'mainAuthor') {
        return { ...prev, mainAuthor: { ...prev.mainAuthor, [field]: value } };
      }
      if (section === 'coAuthors' && typeof index === 'number') {
        const newCoAuthors = [...prev.coAuthors];
        newCoAuthors[index] = { ...newCoAuthors[index], [field]: value };
        return { ...prev, coAuthors: newCoAuthors };
      }
      return prev;
    });
  };

  const handleBookTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBookId = e.target.value;
    setFormData(prev => ({
      ...prev,
      bookTitle: newBookId,
      bookChapterTitles: [] // Reset chapters when book changes
    }));
  };

  const handleChapterToggle = (chapterId: string) => {
    setFormData(prev => {
      const currentChapters = prev.bookChapterTitles;
      if (currentChapters.includes(chapterId)) {
        return { ...prev, bookChapterTitles: currentChapters.filter((id: string) => id !== chapterId) };
      } else {
        return { ...prev, bookChapterTitles: [...currentChapters, chapterId] };
      }
    });
  };

  const addCoAuthor = () => {
    setFormData(prev => ({
      ...prev,
      coAuthors: [...prev.coAuthors, {
        firstName: '', lastName: '', designation: '', departmentName: '',
        instituteName: '', city: '', state: '', country: '', email: '',
        isCorrespondingAuthor: false, otherDesignation: ''
      }]
    }));
  };

  const removeCoAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coAuthors: prev.coAuthors.filter((_, i) => i !== index)
    }));
  };

  const handleCorrespondingAuthorChange = (index?: number) => {
    // If index is undefined, it's main author
    // If index is defined, it's co-author at that index

    setFormData(prev => {
      // First, set everyone to false
      const updatedMain = { ...prev.mainAuthor, isCorrespondingAuthor: false };
      const updatedCoAuthors = prev.coAuthors.map(ca => ({ ...ca, isCorrespondingAuthor: false }));

      if (typeof index === 'number') {
        // Set specific co-author to true
        updatedCoAuthors[index].isCorrespondingAuthor = true;
      } else {
        // Set main author to true
        updatedMain.isCorrespondingAuthor = true;
      }

      return {
        ...prev,
        mainAuthor: updatedMain,
        coAuthors: updatedCoAuthors
      };
    });
  };




  const validateForm = (): string | null => {
    if (!formData.bookTitle) return 'Book Title is required';
    if (!formData.abstract) return 'Abstract is required';

    // Main Author Validation
    const ma = formData.mainAuthor;
    if (!ma.firstName || !ma.lastName || !ma.designation || !ma.departmentName || !ma.instituteName || !ma.city || !ma.state || !ma.country || !ma.email) {
      return 'All Main Author fields (except Phone) are required';
    }

    if (ma.designation === 'other' && (!ma.otherDesignation || !ma.otherDesignation.trim())) {
      return 'Main Author: Please specify designation';
    }

    if (ma.phoneNumber && ma.phoneNumber.replace(/\D/g, '').length < 10) {
      return 'Main Author: Phone number must be at least 10 digits';
    }

    // Co-Authors Validation
    for (let i = 0; i < formData.coAuthors.length; i++) {
      const ca = formData.coAuthors[i];
      if (!ca.firstName || !ca.lastName || !ca.designation || !ca.departmentName || !ca.instituteName || !ca.city || !ca.state || !ca.country || !ca.email) {
        return `Co-Author ${i + 1}: All fields (except Phone) are required`;
      }
      if (ca.designation === 'other' && (!ca.otherDesignation || !ca.otherDesignation.trim())) {
        return `Co-Author ${i + 1}: Please specify designation`;
      }
      if (ca.phoneNumber && ca.phoneNumber.replace(/\D/g, '').length < 10) {
        return `Co-Author ${i + 1}: Phone number must be at least 10 digits`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        bookTitle: formData.bookTitle,
        abstract: formData.abstract,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        bookChapterTitles: formData.bookChapterTitles,
        mainAuthor: formData.mainAuthor,
        coAuthors: formData.coAuthors,
        selectedEditorId: formData.selectedEditorId
      };

      const response = await bookChapterService.updateSubmission(submission.id, payload);

      if (response.success && onUpdate) {
        onUpdate(response.data!);
        setSuccessMessage('Submission updated successfully!');
        // Optionally auto-switch tab or just show success
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error("Error updating submission", err);
      const msg = err.message || 'Failed to update submission';
      if (err.status === 403) {
        setError('Access Denied: You cannot edit this submission in its current status.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get Book Title Label
  // const getBookTitleLabel = (idOrTitle: string) => {
  //   const book = dummyBookTitles.find(b => b.id === idOrTitle || b.title === idOrTitle);
  //   return book ? book.title : idOrTitle;
  // };

  // Helper to get Chapter Label
  // const getChapterLabel = (idOrTitle: string) => {
  //   // Search in available chapters first
  //   const chapter = availableChapters.find(c => c.id === idOrTitle || c.chapterTitle === idOrTitle);
  //   if (chapter) return chapter.chapterTitle;

  //   // Fallback search in all dummy chapters (if imported, or just show ID)
  //   // Since we don't have all chapters in state usually, strictly we might miss titles if book changed
  //   // But typically we show what's selected.
  //   return idOrTitle;
  // };

  return (
    <div className={styles.editTab}>
      <div className={styles.editContainer}>

        {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
        {successMessage && <div className={`${styles.alert} ${styles.alertSuccess}`}>{successMessage}</div>}

        <div className={styles.formSection}>
          <div className={styles.sectionHeader} onClick={() => setActiveSection(activeSection === 'details' ? 'details' : 'details')}>
            <h3>Book Chapter Details</h3>
            {activeSection === 'details' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {activeSection === 'details' && (
            <div className={styles.sectionContent}>
              <div className={styles.formGroup}>
                <label>Book Title</label>
                <select
                  value={formData.bookTitle}
                  onChange={handleBookTitleChange}
                  className={styles.select}
                >
                  <option value="">Select Book Title</option>
                  {isLoadingBooks ? (
                    <option value="" disabled>Loading book titles...</option>
                  ) : (
                    bookTitles.map(book => (
                      <option key={book.id} value={book.id}>{book.title}</option>
                    ))
                  )}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Selected Editor</label>
                <select
                  value={formData.selectedEditorId}
                  onChange={(e) => handleInputChange('details', 'selectedEditorId', e.target.value)}
                  className={styles.select}
                >
                  <option value="">{isLoadingEditors ? 'Loading available editors...' : '-- Select an Editor --'}</option>
                  {!isLoadingEditors && availableEditors.map((editor) => (
                    <option key={editor.id} value={editor.id.toString()}>
                      {editor.fullName} ({editor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Chapters</label>
                <div className={styles.chapterList}>
                  {isLoadingChapters ? (
                    <p className="text-gray-500 text-sm">Loading chapters...</p>
                  ) : availableChapters.length > 0 ? (
                    availableChapters.map(chapter => (
                      <label key={chapter.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.bookChapterTitles.includes(chapter.id)}
                          onChange={() => handleChapterToggle(chapter.id)}
                        />
                        {chapter.chapterTitle}
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Select a valid book title to see chapters.</p>
                  )}
                  {/* Proposed Chapters (if any existing ones are not in available list) */}
                  {formData.bookChapterTitles.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                      <strong>Selected:</strong> {formData.bookChapterTitles.map((id: string) => {
                        const ch = availableChapters.find(c => c.id === id);
                        // If we can't find it in available chapters (e.g. inactive), show ID as fallback, but try to be helpful
                        return ch ? ch.chapterTitle : `Chapter ID: ${id}`;
                      }).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Abstract</label>
                <textarea
                  value={formData.abstract}
                  onChange={(e) => handleInputChange('details', 'abstract', e.target.value)}
                  className={styles.textarea}
                  rows={6}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Keywords</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('details', 'keywords', e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <div className={styles.sectionHeader} onClick={() => setActiveSection(activeSection === 'author' ? 'author' : 'author')}>
            <h3>Main Author</h3>
            {activeSection === 'author' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {activeSection === 'author' && (
            <div className={styles.sectionContent}>
              <div className={styles.row}>
                <div className={styles.col}>
                  <label>First Name</label>
                  <input type="text" value={formData.mainAuthor.firstName} onChange={(e) => handleInputChange('mainAuthor', 'firstName', e.target.value)} className={styles.input} />
                </div>
                <div className={styles.col}>
                  <label>Last Name</label>
                  <input type="text" value={formData.mainAuthor.lastName} onChange={(e) => handleInputChange('mainAuthor', 'lastName', e.target.value)} className={styles.input} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.col}>
                  <label>Email</label>
                  <input type="email" value={formData.mainAuthor.email} onChange={(e) => handleInputChange('mainAuthor', 'email', e.target.value)} className={styles.input} />
                </div>
                <div className={styles.col}>
                  <select value={formData.mainAuthor.designation} onChange={(e) => handleInputChange('mainAuthor', 'designation', e.target.value)} className={styles.select}>
                    <option value="">Select</option>
                    {DESIGNATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              {formData.mainAuthor.designation === 'other' && (
                <div className={styles.row}>
                  <div className={styles.col}>
                    <label>Specify Designation</label>
                    <input
                      type="text"
                      value={formData.mainAuthor.otherDesignation || ''}
                      onChange={(e) => handleInputChange('mainAuthor', 'otherDesignation', e.target.value)}
                      className={styles.input}
                      placeholder="e.g. Senior Researcher"
                    />
                  </div>
                </div>
              )}
              <div className={styles.row}>
                <div className={styles.col}>
                  <label>Department</label>
                  <input type="text" value={formData.mainAuthor.departmentName} onChange={(e) => handleInputChange('mainAuthor', 'departmentName', e.target.value)} className={styles.input} />
                </div>
                <div className={styles.col}>
                  <label>Institute</label>
                  <input type="text" value={formData.mainAuthor.instituteName} onChange={(e) => handleInputChange('mainAuthor', 'instituteName', e.target.value)} className={styles.input} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.col}>
                  <label>City</label>
                  <input type="text" value={formData.mainAuthor.city} onChange={(e) => handleInputChange('mainAuthor', 'city', e.target.value)} className={styles.input} />
                </div>
                <div className={styles.col}>
                  <label>Country</label>

                  <input
                    type="text"
                    value={formData.mainAuthor.country}
                    onChange={(e) => handleInputChange('mainAuthor', 'country', e.target.value)}
                    className={styles.input}
                    placeholder="Enter country"
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.col}>
                  <label>Phone Number (Optional)</label>
                  <PhoneNumberInput
                    value={formData.mainAuthor.phoneNumber || ''}
                    onChange={(val: string) => handleInputChange('mainAuthor', 'phoneNumber', val)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className={styles.row}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.mainAuthor.isCorrespondingAuthor}
                    onChange={() => handleCorrespondingAuthorChange()}
                  />
                  Corresponding Author
                </label>
              </div>
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <div className={styles.sectionHeader} onClick={() => setActiveSection(activeSection === 'coauthors' ? 'coauthors' : 'coauthors')}>
            <h3>Co-Authors ({formData.coAuthors.length})</h3>
            {activeSection === 'coauthors' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {activeSection === 'coauthors' && (
            <div className={styles.sectionContent}>
              {formData.coAuthors.map((author, index) => (
                <div key={index} className={styles.coAuthorCard}>
                  <div className={styles.cardHeader}>
                    <h4>Co-Author {index + 1}</h4>
                    <button type="button" onClick={() => removeCoAuthor(index)} className={styles.iconButton}><Trash2 size={16} /></button>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.col}>
                      <label>First Name</label>
                      <input type="text" value={author.firstName} onChange={(e) => handleInputChange('coAuthors', 'firstName', e.target.value, index)} className={styles.input} />
                    </div>
                    <div className={styles.col}>
                      <label>Last Name</label>
                      <input type="text" value={author.lastName} onChange={(e) => handleInputChange('coAuthors', 'lastName', e.target.value, index)} className={styles.input} />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.col}>
                      <label>Email</label>
                      <input type="email" value={author.email} onChange={(e) => handleInputChange('coAuthors', 'email', e.target.value, index)} className={styles.input} />
                    </div>
                    <div className={styles.col}>
                      <select value={author.designation} onChange={(e) => handleInputChange('coAuthors', 'designation', e.target.value, index)} className={styles.select}>
                        <option value="">Select</option>
                        {DESIGNATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {author.designation === 'other' && (
                    <div className={styles.row}>
                      <div className={styles.col}>
                        <label>Specify Designation</label>
                        <input
                          type="text"
                          value={author.otherDesignation || ''}
                          onChange={(e) => handleInputChange('coAuthors', 'otherDesignation', e.target.value, index)}
                          className={styles.input}
                          placeholder="e.g. Researcher"
                        />
                      </div>
                    </div>
                  )}
                  <div className={styles.row}>
                    <div className={styles.col}>
                      <label>Department</label>
                      <input type="text" value={author.departmentName} onChange={(e) => handleInputChange('coAuthors', 'departmentName', e.target.value, index)} className={styles.input} />
                    </div>
                    <div className={styles.col}>
                      <label>Institute</label>
                      <input type="text" value={author.instituteName} onChange={(e) => handleInputChange('coAuthors', 'instituteName', e.target.value, index)} className={styles.input} />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.col}>
                      <label>City</label>
                      <input type="text" value={author.city} onChange={(e) => handleInputChange('coAuthors', 'city', e.target.value, index)} className={styles.input} />
                    </div>
                    <div className={styles.col}>
                      <label>Country</label>
                      <input
                        type="text"
                        value={author.country}
                        onChange={(e) => handleInputChange('coAuthors', 'country', e.target.value, index)}
                        className={styles.input}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.col}>
                      <label>Phone Number (Optional)</label>
                      <PhoneNumberInput
                        value={author.phoneNumber || ''}
                        onChange={(val: string) => handleInputChange('coAuthors', 'phoneNumber', val, index)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={author.isCorrespondingAuthor}
                        onChange={() => handleCorrespondingAuthorChange(index)}
                      />
                      Corresponding Author
                    </label>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCoAuthor} className={styles.addButton}>
                <Plus size={16} /> Add Co-Author
              </button>
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={18} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthorSubmissionDetailView;