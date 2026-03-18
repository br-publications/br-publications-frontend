import React, { useState } from 'react';
import {
    User,
    BookOpen,
    FileText,
    Download,
    Eye,
    Calendar,
    Hash,
    RefreshCw,
    MessageSquare,
    AlertCircle,
} from 'lucide-react';
import type { ReviewerAssignment } from '../../../types/submissionTypes';
import FilePreviewModal from '../common/files/filePreviewModal';
import { bookChapterReviewerService } from '../../../services/bookChapterSumission.service';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import { DESIGNATIONS } from '../../../types/bookChapterManuscriptTypes';
import styles from './reviewerOverview.module.css';

interface ReviewerOverviewProps {
    assignment: ReviewerAssignment;
}

const ReviewerOverview: React.FC<ReviewerOverviewProps> = ({ assignment }) => {
    // File preview state
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewFileName, setPreviewFileName] = useState('');
    const [previewFileType, setPreviewFileType] = useState('');
    const [currentFileId, setCurrentFileId] = useState<number | null>(null);
    const [alert, setAlert] = useState<{ isOpen: boolean; type: AlertType; title: string; message: string }>({
        isOpen: false, type: 'info', title: '', message: ''
    });

    const chapter = assignment.individualChapters?.[0];
    const mainAuthor = assignment.mainAuthor;
    const coAuthors = assignment.coAuthors || [];

    // Helper: designation display
    const getDesignationDisplay = (author: any) => {
        if (author.designation === 'other' && author.otherDesignation) {
            return author.otherDesignation;
        }
        const found = DESIGNATIONS.find((d: any) => d.value === author.designation);
        return found ? found.label : (author.designation || '—');
    };

    // File actions
    const handlePreview = async (fileId: number, fileName: string, mimeType: string) => {
        try {
            const { url, type } = await bookChapterReviewerService.previewFile(fileId);
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
            await bookChapterReviewerService.downloadFile(fileId, fileName);
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

    // Collect chapter-specific files
    const chapterFiles: Array<{ id: number; fileName: string; fileSize: number; mimeType: string; uploadDate: string; label: string; tag: string; revisionComments?: string; authorResponse?: string }> = [];

    if (chapter?.manuscriptFile) {
        chapterFiles.push({
            ...chapter.manuscriptFile,
            label: 'Initial Manuscript',
            tag: 'initial',
        });
    }

    const revisions: any[] = (chapter as any)?.revisions || [];
    revisions
        .filter((r: any) => r.file || r.fileId)
        .sort((a: any, b: any) => (a.revisionNumber || 0) - (b.revisionNumber || 0))
        .forEach((r: any) => {
            if (r.file) {
                chapterFiles.push({
                    ...r.file,
                    label: `Revision ${r.revisionNumber}`,
                    tag: 'revision',
                    revisionComments: r.reviewerComments,
                    authorResponse: r.authorResponse,
                });
            }
        });

    const statusColorMap: Record<string, string> = {
        ABSTRACT_SUBMITTED: '#6b7280',
        MANUSCRIPTS_PENDING: '#d97706',
        REVIEWER_ASSIGNMENT: '#7c3aed',
        UNDER_REVIEW: '#2563eb',
        REVISION_REQUESTED: '#d97706',
        ADDITIONAL_REVISION_REQUESTED: '#b45309',
        REVISION_SUBMITTED: '#059669',
        EDITORIAL_REVIEW: '#0891b2',
        CHAPTER_APPROVED: '#16a34a',
        CHAPTER_REJECTED: '#dc2626',
    };

    const formatStatus = (s: string) => s.replace(/_/g, ' ');

    return (
        <div className={styles.container}>
            {/* ─── 1. Main Author ─── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}><User size={14} /> Main Author</h3>
                {mainAuthor ? (
                    <div className={styles.authorCard}>
                        <div className={styles.authorHeader}>
                            <div className={styles.avatar}>
                                {mainAuthor.firstName?.charAt(0)}{mainAuthor.lastName?.charAt(0)}
                            </div>
                            <div>
                                <p className={styles.authorName}>{mainAuthor.firstName} {mainAuthor.lastName}</p>
                                <span className={styles.roleBadge}>
                                    Main Author
                                    {(mainAuthor.isCorrespondingAuthor === true || String(mainAuthor.isCorrespondingAuthor) === 'true') && (
                                        <span className={styles.correspondingBadge}>Corresponding</span>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}><span className={styles.label}>Designation</span><span className={styles.value}>{getDesignationDisplay(mainAuthor)}</span></div>
                            <div className={styles.detailItem}><span className={styles.label}>Email</span><span className={styles.value}>{mainAuthor.email || '—'}</span></div>
                            <div className={styles.detailItem}><span className={styles.label}>Institute</span><span className={styles.value}>{mainAuthor.instituteName || '—'}</span></div>
                            <div className={styles.detailItem}><span className={styles.label}>Department</span><span className={styles.value}>{mainAuthor.departmentName || '—'}</span></div>
                            <div className={styles.detailItem}><span className={styles.label}>Location</span><span className={styles.value}>{[mainAuthor.city, mainAuthor.state, mainAuthor.country].filter(Boolean).join(', ') || '—'}</span></div>
                            {mainAuthor.phoneNumber && (
                                <div className={styles.detailItem}><span className={styles.label}>Phone</span><span className={styles.value}>{mainAuthor.phoneNumber}</span></div>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className={styles.empty}>Author information not available.</p>
                )}
            </section>

            {/* ─── 2. Co-Authors ─── */}
            {coAuthors.length > 0 && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}><User size={14} /> Co-Authors ({coAuthors.length})</h3>
                    <div className={styles.coAuthorGrid}>
                        {coAuthors.map((author: any, idx: number) => {
                            const isCorresponding = author.isCorrespondingAuthor === true || String(author.isCorrespondingAuthor) === 'true';
                            return (
                                <div key={idx} className={styles.coAuthorCard}>
                                    <div className={styles.authorHeader}>
                                        <div className={styles.avatarSmall}>
                                            {author.firstName?.charAt(0)}{author.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className={styles.authorName}>{author.firstName} {author.lastName}</p>
                                            <span className={styles.roleBadge}>
                                                {author.role || 'Co-Author'}
                                                {isCorresponding && <span className={styles.correspondingBadge}>Corresponding</span>}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.detailGrid}>
                                        <div className={styles.detailItem}><span className={styles.label}>Designation</span><span className={styles.value}>{getDesignationDisplay(author)}</span></div>
                                        <div className={styles.detailItem}><span className={styles.label}>Email</span><span className={styles.value}>{author.email || '—'}</span></div>
                                        <div className={styles.detailItem}><span className={styles.label}>Institute</span><span className={styles.value}>{author.instituteName || '—'}</span></div>
                                        <div className={styles.detailItem}><span className={styles.label}>Department</span><span className={styles.value}>{author.departmentName || '—'}</span></div>
                                        <div className={styles.detailItem}><span className={styles.label}>Location</span><span className={styles.value}>{[author.city, author.country].filter(Boolean).join(', ') || '—'}</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ─── 3. Book & Chapter Details ─── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}><BookOpen size={14} /> Book & Chapter Details</h3>
                <div className={styles.detailGrid} style={{ marginBottom: chapter ? '1.25rem' : 0 }}>
                    <div className={styles.detailItem}>
                        <span className={styles.label}>Book Title</span>
                        <span className={styles.value}>{assignment.bookTitle || '—'}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.label}>Submission Date</span>
                        <span className={styles.value}>
                            {assignment.submissionDate ? new Date(assignment.submissionDate).toLocaleDateString() : '—'}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.label}>Review Deadline</span>
                        <span className={styles.value}>
                            {assignment.dueDate ? (assignment.dueDate as Date).toLocaleDateString() : '—'}
                        </span>
                    </div>
                </div>

                {chapter && (
                    <div className={styles.chapterDetailBox}>
                        <div className={styles.chapterDetailHeader}>
                            <Hash size={12} /> Chapter Being Reviewed
                        </div>
                        <div className={styles.chapterDetailGrid}>
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Chapter Title</span>
                                <span className={styles.value}>{chapter.chapterTitle || '—'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Chapter Number</span>
                                <span className={styles.value}>{chapter.chapterNumber ?? '—'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Status</span>
                                <span
                                    className={styles.statusBadge}
                                    style={{
                                        backgroundColor: `${statusColorMap[chapter.status] || '#6b7280'}18`,
                                        color: statusColorMap[chapter.status] || '#6b7280',
                                        border: `1px solid ${statusColorMap[chapter.status] || '#6b7280'}40`,
                                    }}
                                >
                                    {formatStatus(chapter.status)}
                                </span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Revisions</span>
                                <span className={styles.value}>{chapter.revisionCount ?? 0} / 3</span>
                            </div>
                            {chapter.reviewDeadline && (
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Review Deadline</span>
                                    <span className={styles.value}>{new Date(chapter.reviewDeadline).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* ─── 4. Manuscripts ─── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}><FileText size={14} /> Manuscripts</h3>

                {chapterFiles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FileText size={32} opacity={0.3} />
                        <p>No manuscript files have been uploaded for this chapter yet.</p>
                    </div>
                ) : (
                    <div className={styles.fileList}>
                        {chapterFiles.map((file, idx) => (
                            <div key={idx} className={styles.fileItem}>
                                <div className={styles.fileItemTop}>
                                    <div className={styles.fileItemLeft}>
                                        <FileText size={24} className={styles.fileIcon} />
                                        <div>
                                            <div className={styles.fileLabel}>{file.label}</div>
                                            <div className={styles.fileName}>{file.fileName}</div>
                                            <div className={styles.fileMeta}>
                                                <Calendar size={10} />
                                                {new Date(file.uploadDate).toLocaleDateString()}
                                                <span className={styles.dot}>·</span>
                                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                                <span className={styles.dot}>·</span>
                                                {file.mimeType}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.fileActions}>
                                        <button
                                            className={styles.previewBtn}
                                            onClick={() => handlePreview(file.id, file.fileName, file.mimeType)}
                                        >
                                            <Eye size={12} /> Preview
                                        </button>
                                        <button
                                            className={styles.downloadBtn}
                                            onClick={() => handleDownload(file.id, file.fileName)}
                                        >
                                            <Download size={12} /> Download
                                        </button>
                                    </div>
                                </div>

                                {/* Revision comments / author response (for revision files) */}
                                {file.tag === 'revision' && (file.revisionComments || file.authorResponse) && (
                                    <div className={styles.revisionMeta}>
                                        {file.revisionComments && (
                                            <div className={styles.revisionBlock}>
                                                <div className={styles.revisionBlockHeader}><AlertCircle size={10} /> Reviewer Feedback</div>
                                                <p className={styles.revisionBlockText}>{file.revisionComments}</p>
                                            </div>
                                        )}
                                        {file.authorResponse && (
                                            <div className={`${styles.revisionBlock} ${styles.authorBlock}`}>
                                                <div className={styles.revisionBlockHeader}><MessageSquare size={10} /> Author Response</div>
                                                <p className={styles.revisionBlockText}>{file.authorResponse}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Revision summary pill */}
                {revisions.length > 0 && (
                    <div className={styles.revisionSummary}>
                        <RefreshCw size={12} />
                        {revisions.length} revision{revisions.length !== 1 ? 's' : ''} submitted
                    </div>
                )}
            </section>

            {/* File Preview Modal */}
            {isPreviewOpen && (
                <FilePreviewModal
                    url={previewUrl}
                    fileType={previewFileType}
                    fileName={previewFileName}
                    onClose={handleClosePreview}
                    onDownload={handleDownloadFromPreview}
                />
            )}

            {/* Alert */}
            <AlertPopup
                isOpen={alert.isOpen}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert(a => ({ ...a, isOpen: false }))}
            />
        </div>
    );
};

export default ReviewerOverview;
