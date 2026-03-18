// Chapter Detail Modal Component
import React, { useState, useEffect } from 'react';
import { X, FileText, History, Upload, MessageSquare, GitBranch, Monitor, Eye, Download } from 'lucide-react';
import { type IndividualChapter } from '../../../../types/chapterTypes';
import { formatChapterTitle, canUploadManuscript } from '../../../../utils/chapterUtils';
import ChapterStatusBadge from '../status/chapterStatusBadge';
import ChapterWorkflow from '../status/chapterWorkflow';
import chapterService from '../../../../services/chapter.service';
import { DiscussionPanel } from '../discussion/discussionPanel';
import { ReviewerMonitoringPanel } from '../Overview/reviewerMonitoringPanel';
import styles from './chapterDetailModal.module.css';
import FilePreviewModal from '../files/filePreviewModal';
import AlertPopup, { type AlertType } from '../../../../components/common/alertPopup';

interface ChapterDetailModalProps {
    chapter: IndividualChapter;
    userRole: 'author' | 'editor' | 'reviewer' | 'admin';
    onClose: () => void;
    onUpdate?: (chapter: IndividualChapter) => void;
    onUpload?: () => void;
}

type TabType = 'overview' | 'workflow' | 'history' | 'discussions' | 'manuscript' | 'monitoring';

export const ChapterDetailModal: React.FC<ChapterDetailModalProps> = ({
    chapter: initialChapter,
    userRole,
    onClose,
    onUpload,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [chapter, setChapter] = useState<IndividualChapter>(initialChapter);
    const [statusHistory, setStatusHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Shared File Preview & Download State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewFileName, setPreviewFileName] = useState('');
    const [previewFileType, setPreviewFileType] = useState('');
    const [currentFileId, setCurrentFileId] = useState<number | null>(null);
    const [alert, setAlert] = useState<{ isOpen: boolean; type: AlertType; title: string; message: string }>({
        isOpen: false, type: 'info', title: '', message: ''
    });

    const handlePreview = async (fileId: number, fileName: string, mimeType: string = 'application/pdf') => {
        try {
            const { url, type } = await chapterService.previewFile(fileId);
            setPreviewUrl(url);
            setPreviewFileName(fileName);
            setPreviewFileType(type || mimeType);
            setCurrentFileId(fileId);
            setIsPreviewOpen(true);
        } catch {
            setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to load file preview.' });
        }
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        try {
            await chapterService.downloadFile(fileId, fileName);
        } catch {
            setAlert({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to download file.' });
        }
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setPreviewFileName('');
        setPreviewFileType('');
        setCurrentFileId(null);
    };

    const handleDownloadFromPreview = () => {
        if (currentFileId && previewFileName) handleDownload(currentFileId, previewFileName);
    };

    // Fetch full chapter details on mount to get manuscript and revisions
    useEffect(() => {
        const loadChapterDetails = async () => {
            try {
                const response = await chapterService.getChapterById(initialChapter.id);
                if (response.success && response.data) {
                    const fetchedChapter = response.data;

                    // Check if fetched title is a number (ID) and we have a better title in initialChapter
                    if (!isNaN(Number(fetchedChapter.chapterTitle)) &&
                        initialChapter.chapterTitle &&
                        isNaN(Number(initialChapter.chapterTitle))) {
                        fetchedChapter.chapterTitle = initialChapter.chapterTitle;
                    }

                    setChapter(fetchedChapter);
                }
            } catch (error) {
                console.error('Error loading chapter details:', error);
            }
        };

        loadChapterDetails();
    }, [initialChapter.id]);

    // Load status history when history tab is active
    useEffect(() => {
        if (activeTab === 'history' && statusHistory.length === 0) {
            loadStatusHistory();
        }
    }, [activeTab]);

    const loadStatusHistory = async () => {
        setLoading(true);
        try {
            const response = await chapterService.getStatusHistory(chapter.id);
            if (response.success && response.data) {
                setStatusHistory(response.data);
            }
        } catch (error) {
            console.error('Error loading status history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h2 className={styles.title}>{formatChapterTitle(chapter)}</h2>
                        <ChapterStatusBadge status={chapter.status} />
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FileText size={16} />
                        Overview
                    </button>

                    {/* Workflow tab - visible when manuscript submitted */}
                    {chapter.manuscriptFileId && (
                        <button
                            className={`${styles.tab} ${activeTab === 'workflow' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('workflow')}
                        >
                            <GitBranch size={16} />
                            Workflow
                        </button>
                    )}



                    <button
                        className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History size={16} />
                        History
                    </button>

                    {/* Discussions tab */}
                    <button
                        className={`${styles.tab} ${activeTab === 'discussions' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('discussions')}
                    >
                        <MessageSquare size={16} />
                        Discussions
                    </button>

                    <button
                        className={`${styles.tab} ${activeTab === 'manuscript' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('manuscript')}
                    >
                        <FileText size={16} />
                        Manuscript
                    </button>

                    {/* Reviewer Monitoring Tab (Admin/Editor only) */}
                    {(userRole === 'admin' || userRole === 'editor') && (
                        <button
                            className={`${styles.tab} ${activeTab === 'monitoring' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('monitoring')}
                        >
                            <Monitor size={16} />
                            Monitoring
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {activeTab === 'overview' && (
                        <div className={styles.overviewTab}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Chapter Number</span>
                                    <span className={styles.infoValue}>{chapter.chapterNumber}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Status</span>
                                    <ChapterStatusBadge status={chapter.status} size="small" />
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Revision Count</span>
                                    <span className={styles.infoValue}>{chapter.revisionCount}/3</span>
                                </div>
                                {chapter.reviewDeadline && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Review Deadline</span>
                                        <span className={styles.infoValue}>
                                            {new Date(chapter.reviewDeadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {chapter.editorDecision && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Editor Decision</span>
                                        <span className={`${styles.infoValue} ${styles[chapter.editorDecision.toLowerCase()]}`}>
                                            {chapter.editorDecision}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {chapter.editorDecisionNotes && (
                                <div className={styles.notesSection}>
                                    <h4>Editor Notes</h4>
                                    <p>{chapter.editorDecisionNotes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'workflow' && (
                        <ChapterWorkflow chapter={chapter} />
                    )}

                    {activeTab === 'discussions' && (
                        <div className={styles.discussionsTab}>
                            <DiscussionPanel
                                submissionId={chapter.id}
                                submissionStatus={chapter.status as any}
                                currentUserRole={userRole}
                                isChapterDiscussion={true}
                            />
                        </div>
                    )}

                    {activeTab === 'manuscript' && (
                        <div className={styles.manuscriptTab}>
                            <div className={styles.manuscriptList}>
                                {/* Initial Manuscript */}
                                <div className={styles.manuscriptGroup}>
                                    <h4 className={styles.groupTitle}>Initial Manuscript</h4>
                                    {chapter.manuscriptFile ? (
                                        <div className={styles.fileCard}>
                                            <FileText size={32} className={styles.fileIcon} />
                                            <div className={styles.fileInfo}>
                                                <h4>{chapter.manuscriptFile.fileName}</h4>
                                                <p>
                                                    Uploaded: {new Date(chapter.manuscriptFile.uploadDate).toLocaleDateString()}
                                                </p>
                                                <p>Size: {(chapter.manuscriptFile.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className={styles.previewButton}
                                                    onClick={() => handlePreview(chapter.manuscriptFile!.id, chapter.manuscriptFile!.fileName)}
                                                >
                                                    <Eye size={16} /> Preview
                                                </button>
                                                <button
                                                    className={styles.downloadButton}
                                                    onClick={() => handleDownload(chapter.manuscriptFile!.id, chapter.manuscriptFile!.fileName)}
                                                >
                                                    <Download size={16} /> Download
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.emptyState}>
                                            <FileText size={32} />
                                            <p>No initial manuscript uploaded yet</p>
                                            {canUploadManuscript(chapter) && onUpload && (
                                                <button
                                                    className={styles.uploadButton}
                                                    onClick={onUpload}
                                                >
                                                    <Upload size={18} />
                                                    Upload Manuscript
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Revisions */}
                                {chapter.revisions && chapter.revisions.length > 0 && (
                                    <div className={styles.manuscriptGroup} style={{ marginTop: '24px' }}>
                                        <h4 className={styles.groupTitle}>Revisions</h4>
                                        <div className={styles.revisionsList}>
                                            {chapter.revisions.filter(r => r.file || r.fileId).map((revision) => (
                                                <div key={revision.id} className={styles.revisionFileItem}>
                                                    <div className={styles.fileCard}>
                                                        <FileText size={28} className={styles.fileIcon} />
                                                        <div className={styles.fileInfo}>
                                                            <h4>Revision {revision.revisionNumber}</h4>
                                                            {revision.file && (
                                                                <p className={styles.fileName}>{revision.file.fileName}</p>
                                                            )}
                                                            <p className={styles.meta}>
                                                                {revision.submittedDate ? `Submitted: ${new Date(revision.submittedDate).toLocaleDateString()}` : 'Date unknown'}
                                                            </p>
                                                        </div>
                                                        {revision.fileId && (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    className={styles.previewButtonSmall}
                                                                    onClick={() => handlePreview(revision.fileId!, revision.file?.fileName || `Revision_${revision.revisionNumber}`)}
                                                                >
                                                                    <Eye size={12} /> Preview
                                                                </button>
                                                                <button
                                                                    className={styles.downloadButtonSmall}
                                                                    onClick={() => handleDownload(revision.fileId!, revision.file?.fileName || `Revision_${revision.revisionNumber}`)}
                                                                >
                                                                    <Download size={12} /> Download
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {revision.reviewerComments && (
                                                        <div className={styles.revisionComments}>
                                                            <strong>Reviewer Feedback:</strong>
                                                            <p>{revision.reviewerComments}</p>
                                                        </div>
                                                    )}
                                                    {revision.authorResponse && (
                                                        <div className={styles.authorResponse}>
                                                            <strong>Author Response:</strong>
                                                            <p>{revision.authorResponse}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className={styles.historyTab}>
                            {loading ? (
                                <div className={styles.loading}>Loading history...</div>
                            ) : statusHistory.length > 0 ? (
                                <div className={styles.timeline}>
                                    {statusHistory.map((item) => (
                                        <div key={item.id} className={styles.timelineItem}>
                                            <div className={styles.timelineDot} />
                                            <div className={styles.timelineContent}>
                                                <div className={styles.timelineHeader}>
                                                    <strong>{item.action}</strong>
                                                    <span className={styles.timelineDate}>
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className={styles.timelineStatus}>
                                                    {item.previousStatus && `${item.previousStatus} → `}
                                                    {item.newStatus}
                                                </p>
                                                {item.notes && <p className={styles.timelineNotes}>{item.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <History size={32} />
                                    <p>No history available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'monitoring' && (
                        <div className="p-6">
                            <ReviewerMonitoringPanel assignments={chapter.reviewerAssignments} />
                        </div>
                    )}
                </div>

                {/* Shared File Preview Modal */}
                {isPreviewOpen && (
                    <FilePreviewModal
                        url={previewUrl}
                        fileType={previewFileType}
                        fileName={previewFileName}
                        onClose={handleClosePreview}
                        onDownload={handleDownloadFromPreview}
                    />
                )}

                {/* Shared Alert */}
                <AlertPopup
                    isOpen={alert.isOpen}
                    type={alert.type}
                    title={alert.title}
                    message={alert.message}
                    onClose={() => setAlert(a => ({ ...a, isOpen: false }))}
                />
            </div>
        </div>
    );
};

export default ChapterDetailModal;
