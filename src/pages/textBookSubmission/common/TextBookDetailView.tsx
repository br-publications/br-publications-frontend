import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import TextBookPublishingForm from '../publishing/TextBookPublishingForm';
import type { PublishingFormData } from '../types/publishingTypes';
import {
    ChevronLeft,
    FileText,
    MessageSquare,
    CheckCircle,
    Download,
    Calendar,
    User,
    Mail,
    Building,
    Clock,
    Eye,
} from 'lucide-react';
import type { TextBookSubmission } from '../types/textBookTypes';
import { STATUS_COLORS, STATUS_LABELS, formatDate, formatDateTime } from '../types/textBookTypes';
import FilePreviewModal from '../../bookChapterSubmission/common/files/filePreviewModal';
import textBookService from '../../../services/textBookService';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import styles from './textBookDetailView.module.css';

interface TextBookDetailViewProps {
    submission: TextBookSubmission;
    onClose: () => void;
    userRole: 'admin' | 'author';
    onRefresh?: () => void;
}

type DetailTab = 'overview' | 'files' | 'workflow' | 'history' | 'discussions' | 'actions';

export const TextBookDetailView: React.FC<TextBookDetailViewProps> = ({
    submission,
    onClose,
    userRole,
    onRefresh
}) => {
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');

    // Shared File Preview & Download State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewFileName, setPreviewFileName] = useState('');
    const [previewFileType, setPreviewFileType] = useState('');
    const [currentFileId, setCurrentFileId] = useState<number | null>(null);
    const [alert, setAlert] = useState<{ isOpen: boolean; type: AlertType; title: string; message: string }>({
        isOpen: false, type: 'info', title: '', message: ''
    });

    const handlePreview = async (fileId: number, fileName: string, mimeType: string) => {
        try {
            const { url, type } = await textBookService.previewFile(submission.id, fileId);
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
            await textBookService.downloadFile(submission.id, fileId, fileName);
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

    // Shared grouped files logic
    const groupedFiles = submission.files?.reduce((acc, file) => {
        const key = (file.revisionNumber && file.revisionNumber > 0)
            ? `Revision ${file.revisionNumber}`
            : 'Initial Submission';

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(file);
        return acc;
    }, {} as Record<string, typeof submission.files>);

    const sortedKeys = Object.keys(groupedFiles || {}).sort((a, b) => {
        if (a === 'Initial Submission') return -1;
        if (b === 'Initial Submission') return 1;

        const revA = parseInt(a.split(' ')[1]);
        const revB = parseInt(b.split(' ')[1]);
        return revA - revB;
    });

    const sharedFileProps = {
        submission,
        groupedFiles,
        sortedKeys,
        handlePreview,
        handleDownload
    };

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <button onClick={onClose} className={styles.backButton}>
                        <ChevronLeft size={14} />
                        Back to Dashboard
                    </button>
                    <div className={styles.headerActions}>
                        <span
                            className={styles.statusBadge}
                            style={{
                                backgroundColor: `${STATUS_COLORS[submission.status]}20`,
                                borderColor: STATUS_COLORS[submission.status],
                                color: STATUS_COLORS[submission.status]
                            }}
                        >
                            {STATUS_LABELS[submission.status]}
                        </span>
                    </div>
                </div>

                {/* Title Section */}
                <div className={styles.titleSection}>
                    <h2 className={styles.bookTitle}>{submission.bookTitle}</h2>
                    <div className={styles.metadata}>
                        <span className={styles.metaItem}>
                            <Calendar size={16} />
                            Submitted: {formatDate(submission.submissionDate)}
                        </span>
                        {submission.isDirectSubmission && (
                            <span className={`${styles.metaItem} ${styles.directBadge}`} style={{ color: '#E91E63', fontWeight: 'bold' }}>
                                <CheckCircle size={16} /> Direct Publishing
                            </span>
                        )}
                        {submission.isBulkSubmission && (
                            <span className={`${styles.metaItem} ${styles.bulkBadge}`} style={{ color: '#2196F3', fontWeight: 'bold' }}>
                                <CheckCircle size={16} /> Bulk Upload
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FileText size={16} /> Overview
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'files' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('files')}
                    >
                        <Download size={16} /> Files
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'workflow' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('workflow')}
                    >
                        <Clock size={16} /> Workflow
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Clock size={16} /> History
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'discussions' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('discussions')}
                    >
                        <MessageSquare size={16} /> Discussions
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'actions' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('actions')}
                    >
                        <CheckCircle size={16} /> {userRole === 'admin' ? 'Admin Actions' : 'My Actions'}
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {activeTab === 'overview' && <OverviewTab {...sharedFileProps} />}
                    {activeTab === 'files' && <FilesTab {...sharedFileProps} />}
                    {activeTab === 'workflow' && <WorkflowTab submission={submission} userRole={userRole} />}
                    {activeTab === 'history' && <HistoryTab submission={submission} />}
                    {activeTab === 'discussions' && <DiscussionsTab submission={submission} />}
                    {activeTab === 'actions' && userRole === 'admin' && <ActionsTab submission={submission} onRefresh={() => onRefresh?.()} />}
                    {activeTab === 'actions' && userRole === 'author' && <AuthorActionsTab submission={submission} onRefresh={() => onRefresh?.()} />}
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
        </div>,
        document.body
    );
};

// Types for shared props
type SharedFileProps = {
    submission: TextBookSubmission;
    groupedFiles: Record<string, NonNullable<TextBookSubmission['files']>> | undefined;
    sortedKeys: string[];
    handlePreview: (fileId: number, fileName: string, mimeType: string) => Promise<void>;
    handleDownload: (fileId: number, fileName: string) => Promise<void>;
};

// Overview Tab
const OverviewTab: React.FC<SharedFileProps> = ({ submission, groupedFiles, sortedKeys, handlePreview, handleDownload }) => {
    return (
        <div className={styles.overviewTab}>
            {/* Author Information */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Main Author</h3>
                <div className={styles.authorCard}>
                    <div className={styles.authorDetail}>
                        <User size={16} />
                        <span>{submission.mainAuthor.title} {submission.mainAuthor.firstName} {submission.mainAuthor.lastName}</span>
                    </div>
                    <div className={styles.authorDetail}>
                        <Mail size={16} />
                        <span>{submission.mainAuthor.email}</span>
                    </div>
                    {submission.mainAuthor.phoneNumber && (
                        <div className={styles.authorDetail}>
                            <span className={styles.label}>Phone:</span>
                            <span>{submission.mainAuthor.phoneNumber}</span>
                        </div>
                    )}
                    <div className={styles.authorDetail}>
                        <Building size={16} />
                        <span>{submission.mainAuthor.institute || submission.mainAuthor.instituteName}</span>
                    </div>
                    {(submission.mainAuthor.city || submission.mainAuthor.state || submission.mainAuthor.country) && (
                        <div className={styles.authorDetail}>
                            <span className={styles.label}>Location:</span>
                            <span>
                                {[
                                    submission.mainAuthor.city,
                                    submission.mainAuthor.state,
                                    submission.mainAuthor.country
                                ].filter(Boolean).join(', ')}
                            </span>
                        </div>
                    )}
                    {submission.mainAuthor.biography && (
                        <div className={styles.authorDetail} style={{ marginTop: '8px', alignItems: 'flex-start' }}>
                            <span className={styles.label}>Biography:</span>
                            <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#4b5563' }}>{submission.mainAuthor.biography}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Co-Authors */}
            {submission.coAuthors && submission.coAuthors.length > 0 && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Co-Authors ({submission.coAuthors.length})</h3>
                    <div className={styles.coAuthorsListDetailed}>
                        {submission.coAuthors.map((author, index) => (
                            <div key={index} className={styles.coAuthorCardDetailed}>
                                <div className={styles.coAuthorName}>
                                    {author.title} {author.firstName} {author.lastName}
                                </div>
                                <div className={styles.detailedInfo}>
                                    <div className={styles.infoRow}><Mail size={14} /> {author.email}</div>
                                    {author.phoneNumber && <div className={styles.infoRow}><strong>Phone:</strong> {author.phoneNumber}</div>}
                                    <div className={styles.infoRow}><Building size={14} /> {author.institute || author.instituteName}</div>
                                    {(author.city || author.state || author.country) && (
                                        <div className={styles.infoRow}>
                                            <strong>Location:</strong> {[author.city, author.state, author.country].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    {author.biography && (
                                        <div className={styles.biography}>
                                            <strong>Biography:</strong>
                                            <p>{author.biography}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submission Details */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Submission Details</h3>
                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Submission Date:</span>
                        <span className={styles.detailValue}>{formatDate(submission.submissionDate)}</span>
                    </div>
                    {submission.currentRevisionNumber > 0 && (
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Current Revision:</span>
                            <span className={styles.detailValue}>{submission.currentRevisionNumber}</span>
                        </div>
                    )}
                    {submission.isbnNumber && (
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>ISBN:</span>
                            <span className={styles.detailValue}>{submission.isbnNumber}</span>
                        </div>
                    )}
                    {submission.doiNumber && (
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>DOI:</span>
                            <span className={styles.detailValue}>{submission.doiNumber}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Delivery Address */}
            {submission.deliveryAddress && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Delivery Details</h3>
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Recipient:</span>
                            <span className={styles.detailValue}>{submission.deliveryAddress.fullName}</span>
                        </div>
                        {submission.deliveryAddress.companyName && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Company:</span>
                                <span className={styles.detailValue}>{submission.deliveryAddress.companyName}</span>
                            </div>
                        )}
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Contact:</span>
                            <span className={styles.detailValue}>{submission.deliveryAddress.countryCode} {submission.deliveryAddress.mobileNumber}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Email:</span>
                            <span className={styles.detailValue}>{submission.deliveryAddress.email}</span>
                        </div>
                        <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                            <span className={styles.detailLabel}>Address:</span>
                            <span className={styles.detailValue}>
                                {[
                                    submission.deliveryAddress.buildingName,
                                    submission.deliveryAddress.addressLine1,
                                    submission.deliveryAddress.streetName,
                                    submission.deliveryAddress.area,
                                    submission.deliveryAddress.city,
                                    submission.deliveryAddress.state,
                                    submission.deliveryAddress.country,
                                    submission.deliveryAddress.postalCode
                                ].filter(Boolean).join(', ')}
                            </span>
                        </div>
                        {submission.deliveryAddress.deliveryInstructions && (
                            <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                                <span className={styles.detailLabel}>Instructions:</span>
                                <span className={styles.detailValue}>{submission.deliveryAddress.deliveryInstructions}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Submission Files */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Submission Files</h3>
                <div className={styles.filesTab} style={{ padding: 0 }}>
                    {sortedKeys.length > 0 ? (
                        sortedKeys.map(groupKey => (
                            <div key={groupKey} className={styles.fileGroup}>
                                <h4 className={styles.sectionTitle} style={{ fontSize: '14px', margin: '8px 0', padding: 0, borderBottom: 'none' }}>
                                    {groupKey} <span className={styles.fileCount}>({groupedFiles![groupKey]!.length})</span>
                                </h4>
                                <div className={styles.filesList}>
                                    {groupedFiles![groupKey]!.map((file) => (
                                        <div key={file.id} className={styles.fileCard}>
                                            <div className={styles.fileInfo}>
                                                <FileText size={24} className={styles.fileIcon} />
                                                <div className={styles.fileDetails}>
                                                    <div className={styles.fileName}>{file.fileName}</div>
                                                    <div className={styles.fileMetadata}>
                                                        <span>{file.fileType}</span>
                                                        <span>•</span>
                                                        <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                        <span>•</span>
                                                        <span>{formatDate(file.uploadedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.fileActions} style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className={styles.previewBtn}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', cursor: 'pointer' }}
                                                    onClick={() => handlePreview(file.id, file.fileName, file.fileType || 'application/pdf')}
                                                >
                                                    <Eye size={12} /> Preview
                                                </button>
                                                <button
                                                    className={styles.downloadBtn}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                                                    onClick={() => handleDownload(file.id, file.fileName)}
                                                >
                                                    <Download size={12} /> Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <FileText size={48} className={styles.emptyIcon} />
                            <p>No files uploaded yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Files Tab
const FilesTab: React.FC<SharedFileProps> = ({ groupedFiles, sortedKeys, handlePreview, handleDownload }) => {
    return (
        <div className={styles.filesTab}>
            {sortedKeys.length > 0 ? (
                sortedKeys.map(groupKey => (
                    <div key={groupKey} className={styles.fileGroup}>
                        <h3 className={styles.sectionTitle}>
                            {groupKey} <span className={styles.fileCount}>({groupedFiles![groupKey]!.length})</span>
                        </h3>
                        <div className={styles.filesList}>
                            {groupedFiles![groupKey]!.map((file) => (
                                <div key={file.id} className={styles.fileCard}>
                                    <div className={styles.fileInfo}>
                                        <FileText size={24} className={styles.fileIcon} />
                                        <div className={styles.fileDetails}>
                                            <div className={styles.fileName}>{file.fileName}</div>
                                            <div className={styles.fileMetadata}>
                                                <span>{file.fileType}</span>
                                                <span>•</span>
                                                <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                <span>•</span>
                                                <span>{formatDate(file.uploadedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.fileActions} style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className={styles.previewBtn}
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', cursor: 'pointer' }}
                                            onClick={() => handlePreview(file.id, file.fileName, file.fileType || 'application/pdf')}
                                        >
                                            <Eye size={12} /> Preview
                                        </button>
                                        <button
                                            className={styles.downloadBtn}
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                                            onClick={() => handleDownload(file.id, file.fileName)}
                                        >
                                            <Download size={12} /> Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className={styles.emptyState}>
                    <FileText size={48} className={styles.emptyIcon} />
                    <p>No files uploaded yet</p>
                </div>
            )}
        </div>
    );
};

// Discussions Tab
const DiscussionsTab: React.FC<{ submission: TextBookSubmission }> = ({ submission }) => {
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');

    // Check if discussions are active (not published or rejected)
    const isActive = !['PUBLISHED', 'SUBMISSION_REJECTED', 'PROPOSAL_REJECTED', 'WITHDRAWN'].includes(submission.status);

    // Fetch discussions on mount
    React.useEffect(() => {
        const fetchDiscussions = async () => {
            try {
                const textBookService = await import('../../../services/textBookService');
                const data = await textBookService.getDiscussions(submission.id);
                setDiscussions(data);
            } catch (err: any) {
                console.error('Failed to fetch discussions:', err);
            } finally {
                setFetchLoading(false);
            }
        };

        fetchDiscussions();
    }, [submission.id]);

    const handleSendMessage = async () => {
        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const textBookService = await import('../../../services/textBookService');
            const newDiscussion = await textBookService.sendDiscussionMessage(submission.id, { message: message.trim() });
            setDiscussions([...discussions, newDiscussion]);
            setMessage('');
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (fetchLoading) {
        return (
            <div className={styles.discussionsTab}>
                <div className={styles.loadingState}>
                    <p>Loading discussions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.discussionsTab}>
            {!isActive && (
                <div className={styles.inactiveNotice}>
                    <span>🔒</span>
                    <p>Discussions are closed for this submission</p>
                    <small>Status: {STATUS_LABELS[submission.status]}</small>
                </div>
            )}

            {/* Messages List */}
            <div className={styles.messagesList}>
                {discussions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <MessageSquare size={48} className={styles.emptyIcon} />
                        <p>No messages yet</p>
                        {isActive && <small>Start a discussion about this submission</small>}
                    </div>
                ) : (
                    discussions.map((discussion, index) => (
                        <div key={discussion.id || index} className={styles.messageItem}>
                            <div className={styles.messageHeader}>
                                <User size={16} />
                                <span className={styles.senderName}>
                                    {discussion.sender?.fullName || 'Unknown User'}
                                </span>
                                <span className={styles.messageSeparator}>•</span>
                                <span className={styles.messageTime}>
                                    {formatDate(discussion.createdAt)} at {new Date(discussion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className={styles.messageContent}>
                                {discussion.message}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Message Input (only if active) */}
            {isActive && (
                <div className={styles.messageInput}>
                    {error && (
                        <div className={styles.errorMessage}>
                            <span>⚠️ {error}</span>
                        </div>
                    )}
                    <div className={styles.inputGroup}>
                        <textarea
                            className={styles.textarea}
                            placeholder="Type your message here..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            rows={3}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!message.trim() || loading}
                            className={styles.sendButton}
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Author Actions Tab
import DeliveryAddressForm from '../../components/common/deliveryAddressForm';

const AuthorActionsTab: React.FC<{ submission: TextBookSubmission; onRefresh: () => void }> = ({ submission, onRefresh }) => {
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [showDeliveryAddressForm, setShowDeliveryAddressForm] = useState(false);

    const getAvailableActions = () => {
        const actions = [];

        // Only action: Submit revision when requested
        if (submission.status === 'REVISION_REQUESTED') {
            actions.push({
                id: 'submit-revision',
                label: 'Submit Revision',
                description: `Submit your revised manuscript`,
                icon: '📄',
                onClick: () => setShowRevisionModal(true),
                variant: 'Primary'
            });
        }

        // Action: Submit Delivery Address when publication is in progress or awaiting details
        if ((submission.status === 'PUBLICATION_IN_PROGRESS' || submission.status === 'AWAITING_DELIVERY_DETAILS') && !submission.deliveryAddress) {
            actions.push({
                id: 'submit-delivery-address',
                label: 'Submit Delivery Address',
                description: `Provide delivery address for your published book copies.`,
                icon: '📦',
                onClick: () => setShowDeliveryAddressForm(true),
                variant: 'Primary'
            });
        }

        return actions;
    };

    const actions = getAvailableActions();

    if (actions.length === 0) {
        return (
            <div className={styles.actionsTab}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>✓</div>
                    <h3>No actions required</h3>
                    <p>
                        {(submission.status === 'PUBLICATION_IN_PROGRESS' || submission.status === 'AWAITING_DELIVERY_DETAILS') && submission.deliveryAddress
                            ? 'Delivery address has been submitted. The admin team will finalize the publication soon.'
                            : 'Your submission is currently being processed by the admin team.'}
                    </p>
                    <p className={styles.statusText}>
                        Current status: <strong>{STATUS_LABELS[submission.status]}</strong>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.actionsTab}>
            <div className={styles.actionsGrid}>
                {actions.map(action => (
                    <button
                        key={action.id}
                        className={`${styles.actionCard} ${styles[`actionCard${action.variant}`]}`}
                        onClick={action.onClick}
                    >
                        <div className={styles.actionIcon}>{action.icon}</div>
                        <h3>{action.label}</h3>
                        <p>{action.description}</p>
                    </button>
                ))}
            </div>

            {showRevisionModal && (
                <SubmitRevisionModal
                    submission={submission}
                    onClose={() => setShowRevisionModal(false)}
                    onSuccess={() => {
                        setShowRevisionModal(false);
                        onRefresh();
                    }}
                />
            )}

            {showDeliveryAddressForm && (
                <div className={styles.modalOverlay} style={{ zIndex: 1000 }} onClick={() => setShowDeliveryAddressForm(false)}>
                    <div className={styles.modal} style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }} onClick={e => e.stopPropagation()}>
                        <DeliveryAddressForm
                            submissionId={submission.id}
                            type="textbook"
                            onSuccess={(savedAddress) => {
                                setShowDeliveryAddressForm(false);
                                onRefresh();
                            }}
                            onCancel={() => setShowDeliveryAddressForm(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Submit Revision Modal (Author)
const SubmitRevisionModal: React.FC<{
    submission: TextBookSubmission;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ submission, onClose, onSuccess }) => {
    const [revisionFile, setRevisionFile] = useState<File | null>(null);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!revisionFile) {
            setError('Please select a revision file');
            return;
        }

        // Validate file size (20MB max)
        if (revisionFile.size > 20 * 1024 * 1024) {
            setError('File size must be less than 20MB');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const textBookService = await import('../../../services/textBookService');
            await textBookService.submitRevision(
                submission.id,
                revisionFile,
                comments
            );
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to submit revision');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>Submit Revision</h2>

                {error && (
                    <div className={styles.errorMessage}>
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <div className={styles.modalContent}>


                    {/* File Upload */}
                    <div className={styles.formGroup}>
                        <label>Revised Manuscript *</label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={e => setRevisionFile(e.target.files?.[0] || null)}
                            disabled={loading}
                            className={styles.fileInput}
                        />
                        {revisionFile && (
                            <div className={styles.fileInfo}>
                                ✓ Selected: {revisionFile.name} ({(revisionFile.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                        )}
                    </div>

                    {/* Comments */}
                    <div className={styles.formGroup}>
                        <label>Comments *</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Describe the changes you made (Required)..."
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            rows={4}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className={styles.cancelButton}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!revisionFile || !comments.trim() || loading}
                        className={styles.submitButton}
                    >
                        {loading ? 'Submitting...' : 'Submit Revision'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Admin Actions Tab (existing component continues below)
const ActionsTab: React.FC<{ submission: TextBookSubmission; onRefresh: () => void }> = ({ submission, onRefresh }) => {
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [showFinalDecisionModal, setShowFinalDecisionModal] = useState(false);
    const [showIsbnApplyModal, setShowIsbnApplyModal] = useState(false);
    const [showIsbnReceiveModal, setShowIsbnReceiveModal] = useState(false);
    const [showPublicationModal, setShowPublicationModal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProposalDecision = async (decision: 'accept' | 'reject', comments: string) => {
        setLoading(true);
        setError(null);
        try {
            const { proposalDecision } = await import('../../../services/textBookService');
            await proposalDecision(submission.id, decision, comments);
            setShowProposalModal(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestRevision = async (comments: string) => {
        setLoading(true);
        setError(null);
        try {
            const { requestRevision } = await import('../../../services/textBookService');
            await requestRevision(submission.id, comments);
            setShowRevisionModal(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalDecision = async (decision: 'accept' | 'reject', comments: string) => {
        setLoading(true);
        setError(null);
        try {
            const { finalDecision } = await import('../../../services/textBookService');
            await finalDecision(submission.id, decision, comments);
            setShowFinalDecisionModal(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyIsbn = async (comments: string) => {
        setLoading(true);
        setError(null);
        try {
            const { applyIsbn } = await import('../../../services/textBookService');
            await applyIsbn(submission.id, comments);
            setShowIsbnApplyModal(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReceiveIsbn = async (isbnNumber: string, doiNumber?: string, comments?: string) => {
        setLoading(true);
        setError(null);
        try {
            const { receiveIsbn } = await import('../../../services/textBookService');
            await receiveIsbn(submission.id, isbnNumber, doiNumber, comments);
            setShowIsbnReceiveModal(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPublication = async (comments: string) => {
        setLoading(true);
        setError(null);
        try {
            const { startPublication } = await import('../../../services/textBookService');
            await startPublication(submission.id, comments);
            setShowPublicationModal(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (formData: PublishingFormData) => {
        setLoading(true);
        setError(null);
        try {
            const { publishTextBook } = await import('../../../services/textBookService');

            // Use cropped image if available, otherwise original
            let coverImageFile: File | Blob | null = formData.croppedCoverImage || formData.coverImage;

            await publishTextBook(submission.id, formData, coverImageFile as File, undefined);
            setShowPublishModal(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAvailableActions = () => {
        const actions = [];
        const status = submission.status;

        // Proposal Decision
        if (status === 'INITIAL_SUBMITTED' || status === 'PROPOSAL_UNDER_REVIEW') {
            actions.push({
                id: 'proposal',
                label: 'Make Proposal Decision',
                description: 'Accept or reject the initial proposal',
                icon: CheckCircle,
                onClick: () => setShowProposalModal(true),
                variant: 'Primary' as const
            });
        }

        // Request Revision
        if (status === 'PROPOSAL_ACCEPTED' || status === 'REVISION_SUBMITTED') {
            if (submission.currentRevisionNumber < 5) {
                actions.push({
                    id: 'revision',
                    label: 'Request Revision',
                    description: `Request revision (${submission.currentRevisionNumber}/5 used)`,
                    icon: FileText,
                    onClick: () => setShowRevisionModal(true),
                    variant: 'Secondary' as const
                });
            }
        }

        // Final Decision
        if (status === 'PROPOSAL_ACCEPTED' || status === 'REVISION_SUBMITTED') {
            actions.push({
                id: 'final',
                label: 'Make Final Decision',
                description: 'Accept or reject the submission',
                icon: CheckCircle,
                onClick: () => setShowFinalDecisionModal(true),
                variant: 'Primary' as const
            });
        }

        // Apply for ISBN
        if (status === 'SUBMISSION_ACCEPTED') {
            actions.push({
                id: 'isbn-apply',
                label: 'Apply for ISBN',
                description: 'Submit ISBN application',
                icon: FileText,
                onClick: () => setShowIsbnApplyModal(true),
                variant: 'Primary' as const
            });
        }

        // Record ISBN Receipt
        if (status === 'ISBN_APPLIED') {
            actions.push({
                id: 'isbn-receive',
                label: 'Record ISBN Receipt',
                description: 'Enter ISBN and DOI numbers',
                icon: CheckCircle,
                onClick: () => setShowIsbnReceiveModal(true),
                variant: 'Primary' as const
            });
        }

        // Start Publication
        if (status === 'ISBN_RECEIVED' || status === 'AWAITING_DELIVERY_DETAILS' || status === 'DELIVERY_ADDRESS_RECEIVED') {
            actions.push({
                id: 'publication',
                label: 'Start Publication',
                description: 'Begin publication process',
                icon: FileText,
                onClick: () => setShowPublicationModal(true),
                variant: 'Primary' as const
            });
        }

        // Publish
        if (status === 'PUBLICATION_IN_PROGRESS' || status === 'AWAITING_DELIVERY_DETAILS') {
            if (!submission.deliveryAddress && !submission.isDirectSubmission) {
                // Return a non-clickable placeholder explaining what's missing
                actions.push({
                    id: 'waiting-delivery-address',
                    label: 'Waiting for Author',
                    description: 'Cannot publish yet. The author must submit their delivery address first.',
                    icon: Clock,
                    onClick: () => {
                        window.dispatchEvent(new CustomEvent('app-alert', {
                            detail: {
                                type: 'info',
                                title: 'Waiting for Author',
                                message: 'The author has been notified to provide their physical delivery address. You can proceed with publishing once they submit it.'
                            }
                        }));
                    },
                    variant: 'Secondary' as const
                });
            } else {
                actions.push({
                    id: 'publish',
                    label: 'Publish Text Book',
                    description: 'Finalize and publish the text book',
                    icon: CheckCircle,
                    onClick: () => setShowPublishModal(true),
                    variant: 'success' as const
                });
            }
        }

        return actions;
    };

    const actions = getAvailableActions();

    if (actions.length === 0) {
        return (
            <div className={styles.actionsTab}>
                <div className={styles.emptyState}>
                    <CheckCircle size={48} className={styles.emptyIcon} />
                    <p>No actions available for current status</p>
                    <small>Status: {STATUS_LABELS[submission.status]}</small>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.actionsTab}>
            <div className={styles.actionsGrid}>
                {actions.map(action => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            className={`${styles.actionCard} ${styles[`actionCard${action.variant.charAt(0).toUpperCase() + action.variant.slice(1)}`]}`}
                            onClick={action.onClick}
                        >
                            <Icon size={32} className={styles.actionIcon} />
                            <h3>{action.label}</h3>
                            <p>{action.description}</p>
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}

            {/* Modals */}
            {showProposalModal && (
                <ProposalDecisionModal
                    onClose={() => setShowProposalModal(false)}
                    onSubmit={handleProposalDecision}
                    loading={loading}
                />
            )}
            {showRevisionModal && (
                <RequestRevisionModal
                    onClose={() => setShowRevisionModal(false)}
                    onSubmit={handleRequestRevision}
                    loading={loading}
                    currentRevision={submission.currentRevisionNumber}
                />
            )}
            {showFinalDecisionModal && (
                <FinalDecisionModal
                    onClose={() => setShowFinalDecisionModal(false)}
                    onSubmit={handleFinalDecision}
                    loading={loading}
                />
            )}
            {showIsbnApplyModal && (
                <IsbnApplyModal
                    onClose={() => setShowIsbnApplyModal(false)}
                    onSubmit={handleApplyIsbn}
                    loading={loading}
                />
            )}
            {showIsbnReceiveModal && (
                <IsbnReceiveModal
                    onClose={() => setShowIsbnReceiveModal(false)}
                    onSubmit={handleReceiveIsbn}
                    loading={loading}
                />
            )}
            {showPublicationModal && (
                <PublicationStartModal
                    onClose={() => setShowPublicationModal(false)}
                    onSubmit={handleStartPublication}
                    loading={loading}
                />
            )}
            {showPublishModal && (
                <TextBookPublishingForm
                    submission={submission}
                    onCancel={() => setShowPublishModal(false)}
                    onSubmit={handlePublish}
                    loading={loading}
                />
            )}
        </div>
    );
};

// Modal Components
const ProposalDecisionModal: React.FC<{
    onClose: () => void;
    onSubmit: (decision: 'accept' | 'reject', comments: string) => void;
    loading: boolean;
}> = ({ onClose, onSubmit, loading }) => {
    const [decision, setDecision] = useState<'accept' | 'reject' | ''>('');
    const [comments, setComments] = useState('');

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>Proposal Decision</h2>
                <div className={styles.modalContent}>
                    <div className={styles.decisionButtons}>
                        <button
                            className={`${styles.decisionButton} ${decision === 'accept' ? styles.active : ''}`}
                            onClick={() => setDecision('accept')}
                        >
                            Accept Proposal
                        </button>
                        <button
                            className={`${styles.decisionButton} ${decision === 'reject' ? styles.active : ''}`}
                            onClick={() => setDecision('reject')}
                        >
                            Reject Proposal
                        </button>
                    </div>
                    <textarea
                        placeholder={decision === 'reject' ? "Comments (required for rejection)" : "Comments (optional)"}
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        rows={4}
                        className={styles.textarea}
                        required={decision === 'reject'}
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        onClick={() => decision && onSubmit(decision, comments)}
                        disabled={!decision || (decision === 'reject' && !comments.trim()) || loading}
                        className={styles.primaryButton}
                    >
                        {loading ? 'Submitting...' : 'Submit Decision'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const RequestRevisionModal: React.FC<{
    onClose: () => void;
    onSubmit: (comments: string) => void;
    loading: boolean;
    currentRevision: number;
}> = ({ onClose, onSubmit, loading, currentRevision }) => {
    const [comments, setComments] = useState('');

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>Request Revision</h2>
                <p className={styles.revisionCounter}>Revision {currentRevision + 1} of 5</p>
                <div className={styles.modalContent}>
                    <textarea
                        placeholder="Revision comments (required)"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        rows={6}
                        className={styles.textarea}
                        required
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        onClick={() => onSubmit(comments)}
                        disabled={!comments.trim() || loading}
                        className={styles.primaryButton}
                    >
                        {loading ? 'Requesting...' : 'Request Revision'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const FinalDecisionModal: React.FC<{
    onClose: () => void;
    onSubmit: (decision: 'accept' | 'reject', comments: string) => void;
    loading: boolean;
}> = ({ onClose, onSubmit, loading }) => {
    const [decision, setDecision] = useState<'accept' | 'reject' | ''>('');
    const [comments, setComments] = useState('');

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>Final Decision</h2>
                <div className={styles.modalContent}>
                    <div className={styles.decisionButtons}>
                        <button
                            className={`${styles.decisionButton} ${decision === 'accept' ? styles.active : ''}`}
                            onClick={() => setDecision('accept')}
                        >
                            Accept Submission
                        </button>
                        <button
                            className={`${styles.decisionButton} ${decision === 'reject' ? styles.active : ''}`}
                            onClick={() => setDecision('reject')}
                        >
                            Reject Submission
                        </button>
                    </div>
                    <textarea
                        placeholder={decision === 'reject' ? "Comments (required for rejection)" : "Comments (optional)"}
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        rows={4}
                        className={styles.textarea}
                        required={decision === 'reject'}
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        onClick={() => decision && onSubmit(decision, comments)}
                        disabled={!decision || (decision === 'reject' && !comments.trim()) || loading}
                        className={styles.primaryButton}
                    >
                        {loading ? 'Submitting...' : 'Submit Decision'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const IsbnApplyModal: React.FC<{
    onClose: () => void;
    onSubmit: (comments: string) => void;
    loading: boolean;
}> = ({ onClose, onSubmit, loading }) => {
    const [comments, setComments] = useState('');

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>Apply for ISBN</h2>
                <div className={styles.modalContent}>
                    <p>Submit ISBN application for this text book? *</p>
                    <textarea
                        placeholder="Please provide application details or notes (Required)"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        rows={3}
                        className={styles.textarea}
                        required
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        onClick={() => onSubmit(comments)}
                        disabled={loading || !comments.trim()}
                        className={styles.primaryButton}
                    >
                        {loading ? 'Submitting...' : 'Apply for ISBN'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const IsbnReceiveModal: React.FC<{
    onClose: () => void;
    onSubmit: (isbnNumber: string, doiNumber?: string, comments?: string) => Promise<void> | void;
    loading: boolean;
}> = ({ onClose, onSubmit, loading }) => {
    const [isbnNumber, setIsbnNumber] = useState('');
    const [doiNumber, setDoiNumber] = useState('');
    const [comments, setComments] = useState('');

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>Record ISBN Receipt</h2>
                <div className={styles.modalContent}>
                    <div className={styles.formGroup}>
                        <label>ISBN Number *</label>
                        <input
                            type="text"
                            placeholder="Enter ISBN number"
                            value={isbnNumber}
                            onChange={e => setIsbnNumber(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>DOI Number</label>
                        <input
                            type="text"
                            placeholder="Enter DOI number"
                            value={doiNumber}
                            onChange={e => setDoiNumber(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <textarea
                        placeholder="Comments (optional)"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        rows={3}
                        className={styles.textarea}
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        onClick={() => onSubmit(isbnNumber, doiNumber, comments)}
                        disabled={!isbnNumber.trim() || loading}
                        className={styles.primaryButton}
                    >
                        {loading ? 'Saving...' : 'Record ISBN'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const PublicationStartModal: React.FC<{
    onClose: () => void;
    onSubmit: (comments: string) => void;
    loading: boolean;
}> = ({ onClose, onSubmit, loading }) => {
    const [comments, setComments] = useState('');

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>Start Publication</h2>
                <div className={styles.modalContent}>
                    <p>Begin the publication process for this text book?</p>
                    <textarea
                        placeholder="Comments (optional)"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        rows={3}
                        className={styles.textarea}
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        onClick={() => onSubmit(comments)}
                        disabled={loading}
                        className={styles.primaryButton}
                    >
                        {loading ? 'Starting...' : 'Start Publication'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};


// Workflow Tab
const WorkflowTab: React.FC<{ submission: TextBookSubmission; userRole: 'admin' | 'author' }> = ({ submission, userRole }) => {
    // Define the workflow stages
    const getWorkflowStages = () => {
        const STATUS_ORDER = [
            'INITIAL_SUBMITTED',
            'PROPOSAL_UNDER_REVIEW',
            'PROPOSAL_ACCEPTED', // Transition to acceptance/rejection
            'REVISION_REQUESTED',
            'REVISION_SUBMITTED',
            'SUBMISSION_ACCEPTED',
            'ISBN_APPLIED',
            'ISBN_RECEIVED',
            'AWAITING_DELIVERY_DETAILS',
            'DELIVERY_ADDRESS_RECEIVED',
            'PUBLICATION_IN_PROGRESS',
            'PUBLISHED'
        ];

        const stages = [
            {
                id: 'submission-received',
                title: 'Submission Received',
                description: 'Initial submission received',
                status: 'completed' as const,
                date: formatDate(submission.submissionDate),
            },
            {
                id: 'under-review',
                title: 'Under Review',
                description: 'Proposal and revisions under review',
                status: (['PROPOSAL_REJECTED', 'SUBMISSION_REJECTED', 'PROPOSAL_ACCEPTED', 'REVISION_REQUESTED', 'REVISION_SUBMITTED', 'SUBMISSION_ACCEPTED', 'ISBN_APPLIED', 'ISBN_RECEIVED', 'AWAITING_DELIVERY_DETAILS', 'DELIVERY_ADDRESS_RECEIVED', 'PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status)) ? 'completed' :
                    (submission.status === 'PROPOSAL_UNDER_REVIEW') ? 'active' : 'pending',
                date: (submission.status !== 'INITIAL_SUBMITTED' && submission.status !== 'PROPOSAL_UNDER_REVIEW') ? formatDate(submission.updatedAt) : undefined,
            },
            {
                id: 'acceptance-rejection',
                title: 'Submission Acceptance/Rejection',
                description: 'Final decision on submission',
                status: (['SUBMISSION_ACCEPTED', 'ISBN_APPLIED', 'ISBN_RECEIVED', 'AWAITING_DELIVERY_DETAILS', 'DELIVERY_ADDRESS_RECEIVED', 'PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status)) ? 'completed' :
                    (submission.status === 'SUBMISSION_REJECTED' || submission.status === 'PROPOSAL_REJECTED') ? 'rejected' :
                        (['REVISION_REQUESTED', 'REVISION_SUBMITTED', 'PROPOSAL_ACCEPTED'].includes(submission.status)) ? 'active' : 'pending',
                date: submission.approvalDate ? formatDate(submission.approvalDate) : undefined,
            },
            {
                id: 'isbn-applied',
                title: 'ISBN Applied',
                description: 'Application submitted for ISBN',
                status: (['ISBN_APPLIED', 'ISBN_RECEIVED', 'AWAITING_DELIVERY_DETAILS', 'DELIVERY_ADDRESS_RECEIVED', 'PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status)) ? 'completed' :
                    submission.status === 'SUBMISSION_ACCEPTED' ? 'active' : 'pending',
                date: submission.isbnAppliedDate ? formatDate(submission.isbnAppliedDate) : undefined,
            },
            {
                id: 'isbn-received',
                title: 'ISBN Received',
                description: 'ISBN and DOI assigned',
                status: (['ISBN_RECEIVED', 'AWAITING_DELIVERY_DETAILS', 'DELIVERY_ADDRESS_RECEIVED', 'PUBLICATION_IN_PROGRESS', 'PUBLISHED'].includes(submission.status)) ? 'completed' :
                    submission.status === 'ISBN_APPLIED' ? 'active' : 'pending',
                date: submission.isbnReceivedDate ? formatDate(submission.isbnReceivedDate) : undefined,
            },
            {
                id: 'delivery-details',
                title: 'Delivery Details',
                description: 'Author submits shipping address',
                status: (submission.deliveryAddress || ['DELIVERY_ADDRESS_RECEIVED', 'PUBLISHED', 'PUBLICATION_IN_PROGRESS'].includes(submission.status)) ? 'completed' :
                    submission.status === 'AWAITING_DELIVERY_DETAILS' ? 'active' : 'pending',
                date: submission.deliveryAddress ? formatDate(submission.deliveryAddress.createdAt) : undefined,
            },
            {
                id: 'waiting-publication',
                title: 'Waiting Publication',
                description: 'Ready to publish, preparing materials',
                status: (['PUBLISHED', 'PUBLICATION_IN_PROGRESS'].includes(submission.status)) ? 'completed' :
                    (submission.status === 'DELIVERY_ADDRESS_RECEIVED' || submission.status === 'AWAITING_DELIVERY_DETAILS') ? 'active' : 'pending',
                date: submission.publicationStartDate ? formatDate(submission.publicationStartDate) : undefined,
            },
            {
                id: 'published',
                title: 'Published',
                description: 'Text book published',
                status: submission.status === 'PUBLISHED' ? 'completed' :
                    submission.status === 'PUBLICATION_IN_PROGRESS' ? 'active' : 'pending',
                date: submission.publishDate ? formatDate(submission.publishDate) : undefined,
            },
        ];

        return stages;
    };

    const workflowStages = getWorkflowStages();
    const completedCount = workflowStages.filter(s => s.status === 'completed').length;
    const progressPercentage = (completedCount / workflowStages.length) * 100;

    return (
        <div className={styles.workflowTab}>
            {/* Progress Summary */}
            <div className={styles.progressSummary}>
                <div className={styles.progressInfo}>
                    <h3 className={styles.progressTitle}>Submission Progress</h3>
                    <p className={styles.progressText}>
                        {completedCount} of {workflowStages.length} stages completed
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

            {/* Horizontal Timeline */}
            <div className={styles.horizontalTimeline}>
                {workflowStages.map((stage, index) => (
                    <div key={stage.id} className={styles.timelineStage}>
                        {/* Stage Circle */}
                        <div className={`${styles.stageCircle} ${styles[`status-${stage.status}`]}`}>
                            {stage.status === 'completed' && <CheckCircle size={20} />}
                            {stage.status === 'active' && <Clock size={20} />}
                            {stage.status === 'rejected' && <span className={styles.rejectedIcon}>✕</span>}
                            {stage.status === 'pending' && <span className={styles.pendingDot}></span>}
                        </div>

                        {/* Connector Line */}
                        {index < workflowStages.length - 1 && (
                            <div className={`${styles.horizontalConnector} ${stage.status === 'completed' ? styles.connectorCompleted : ''}`} />
                        )}

                        {/* Stage Content */}
                        <div className={styles.stageContent}>
                            <h4 className={styles.stageTitle}>{stage.title}</h4>
                            <p className={styles.stageDescription}>{stage.description}</p>
                            {stage.date && <span className={styles.stageDate}>{stage.date}</span>}
                            {stage.status === 'active' && (
                                <span className={styles.activeBadge}>In Progress</span>
                            )}
                            {stage.status === 'rejected' && (
                                <span className={styles.rejectedBadge}>Rejected</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Current Status Info */}
            <div className={styles.currentStatusInfo}>
                <h4>Current Status</h4>
                <div className={styles.statusDetail}>
                    <span
                        className={styles.statusBadge}
                        style={{
                            backgroundColor: `${STATUS_COLORS[submission.status]}20`,
                            borderColor: STATUS_COLORS[submission.status],
                            color: STATUS_COLORS[submission.status]
                        }}
                    >
                        {STATUS_LABELS[submission.status]}
                    </span>
                    {submission.currentRevisionNumber > 0 && userRole === 'admin' && (
                        <span className={styles.revisionInfo}>
                            Revision {submission.currentRevisionNumber}/5
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// History Tab
const HistoryTab: React.FC<{ submission: TextBookSubmission }> = ({ submission }) => {
    const historyItems = [...(submission.statusHistory || [])].sort((a, b) => {
        const dateA = new Date(a.changedAt || a.createdAt).getTime();
        const dateB = new Date(b.changedAt || b.createdAt).getTime();
        return dateB - dateA;
    });


    return (
        <div className={styles.historyTab}>
            <div className={styles.historyHeader}>
                <Clock size={20} />
                <h3 className={styles.historyTitle}>Status History</h3>
                <span className={styles.historySubtitle}>
                    {historyItems.length} status change{historyItems.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className={styles.historyTimeline}>
                {historyItems.map((item, idx) => (
                    <div key={item.id} className={styles.historyItem}>
                        {/* Connector Line */}
                        {idx < historyItems.length - 1 && <div className={styles.historyConnector} />}

                        {/* Icon Circle */}
                        <div className={styles.historyIconContainer}>
                            <Clock size={18} />
                        </div>

                        {/* Content */}
                        <div className={styles.historyContent}>
                            <div className={styles.historyContentHeader}>
                                <div className={styles.historyStatusInfo}>
                                    <h4 className={styles.historyStatusName}>
                                        {STATUS_LABELS[item.newStatus] || item.newStatus}
                                    </h4>
                                    <p className={styles.historyByLine}>
                                        by <span className={styles.historyChangedBy}>{item.changedByUser?.fullName || 'System'}</span>
                                        {item.changedByUser?.role && (
                                            <span className={styles.historyRole}>({item.changedByUser.role})</span>
                                        )}
                                    </p>
                                </div>
                                <div className={styles.historyTimestamp}>
                                    {formatDateTime(item.changedAt || item.createdAt)}
                                </div>
                            </div>

                            {item.notes && (
                                <div className={styles.historyComment}>
                                    <p className={styles.historyCommentText}>{item.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {historyItems.length === 0 && (
                <div className={styles.emptyState} style={{ marginTop: '40px', padding: '40px' }}>
                    <Clock size={48} className={styles.emptyIcon} />
                    <p>No history records found for this submission</p>
                </div>
            )}
        </div>
    );
};


export default TextBookDetailView;
