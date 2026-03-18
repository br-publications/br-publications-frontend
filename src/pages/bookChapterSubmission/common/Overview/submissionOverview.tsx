import React, { useState } from 'react';
import { FileText, User, BookOpen, Tag } from 'lucide-react';
import type { BookChapterSubmission } from '../../../../types/submissionTypes';
import FilePreviewModal from '../files/filePreviewModal';
import bookManagementService from '../../../../services/bookManagement.service';
import AlertPopup, { type AlertType } from '../../../../components/common/alertPopup';
import styles from './submissionOverview.module.css';
import { DESIGNATIONS } from '../../../../types/bookChapterManuscriptTypes';

interface SubmissionOverviewProps {
    submission: BookChapterSubmission;
    showMinimalDetails?: boolean;
}

const SubmissionOverview: React.FC<SubmissionOverviewProps> = ({
    submission,
    showMinimalDetails = false
}) => {
    // State for preview modal
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewFileName, setPreviewFileName] = useState<string>('');
    const [previewFileType, setPreviewFileType] = useState<string>('');
    const [currentFileId, setCurrentFileId] = useState<number | null>(null);
    const [chapterInfo, setChapterInfo] = useState<Record<string, { title: string; isPublished: boolean }>>({});
    const [resolvedBookTitle, setResolvedBookTitle] = useState<string | null>(null);
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

    // Fetch chapter titles
    React.useEffect(() => {
        const loadChapterTitles = async () => {
            try {
                let bookId: number | null = null;
                const titleOrId = submission.bookTitle;

                // 1. Resolve Book ID & Title
                const parsedId = parseInt(titleOrId);
                if (!isNaN(parsedId) && titleOrId.trim() === parsedId.toString()) {
                    bookId = parsedId;
                    // It's an ID, let's fetch the actual title for display

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
                if (bookId && submission.chapters && submission.chapters.length > 0) {
                    const chapterResp = await bookManagementService.bookChapter.getChaptersByBookTitle(bookId, false);
                    if (chapterResp.success && chapterResp.data?.chapters) {
                        const infoMap: Record<string, { title: string; isPublished: boolean }> = {};
                        chapterResp.data.chapters.forEach(ch => {
                            infoMap[ch.id.toString()] = {
                                title: ch.chapterTitle,
                                isPublished: ch.isPublished
                            };
                        });
                        setChapterInfo(infoMap);
                    }
                }
            } catch (err) {
                console.error("Failed to load chapter titles for overview", err);
            }
        };

        loadChapterTitles();
    }, [submission.bookTitle, submission.chapters]);


    // Handle download from preview modal
    const handleDownloadFromPreview = () => {
        if (currentFileId && previewFileName) {
            // Downloading logic removed/commented from UI
        }
    };

    // Close preview modal
    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        // Clean up blob URL
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl('');
        setPreviewFileName('');
        setPreviewFileType('');
        setCurrentFileId(null);
    };

    // Helper to get designation display
    const getDesignationDisplay = (author: any) => {
        if (author.designation === 'other' && author.otherDesignation) {
            return author.otherDesignation;
        }
        const found = DESIGNATIONS.find(d => d.value === author.designation);
        return found ? found.label : author.designation;
    };

    // Helper to render a detail row with a fallback
    const renderDetail = (label: string, value: string | undefined | null) => (
        <p className={styles.detailRow}>
            <strong>{label}:</strong> {value && value.trim() !== '' ? value : <span className={styles.notProvided}>Not Provided</span>}
        </p>
    );

    return (
        <div className={styles.overviewContainer}>
            {/* 1. Main Author Information */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <User size={16} /> Main Author
                </h3>
                {(() => {
                    const mainAuthor = submission.mainAuthor;
                    const isMainCorresponding = mainAuthor.isCorrespondingAuthor === true || String(mainAuthor.isCorrespondingAuthor) === 'true';
                    const otherAuthors = submission.coAuthors || [];

                    return (
                        <>
                            <div className={styles.authorCard}>
                                <div className={styles.authorHeader}>
                                    <div className={styles.avatarPlaceholder}>
                                        {mainAuthor.firstName.charAt(0)}{mainAuthor.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className={styles.authorName}>
                                            {mainAuthor.firstName} {mainAuthor.lastName}
                                        </h4>
                                        <span className={styles.authorRole}>
                                            Main Author
                                            {isMainCorresponding && (
                                                <span
                                                    style={{ marginLeft: '8px', fontSize: '11px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}
                                                >
                                                    Corresponding
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.authorDetails}>
                                    {renderDetail('Designation', getDesignationDisplay(mainAuthor))}
                                    {renderDetail('Institute', mainAuthor.instituteName)}
                                    {renderDetail('Department', mainAuthor.departmentName)}
                                    {renderDetail('Email', mainAuthor.email)}
                                    {renderDetail('Location', `${mainAuthor.city}${mainAuthor.state ? `, ${mainAuthor.state}` : ''}${mainAuthor.country ? `, ${mainAuthor.country}` : ''}`)}
                                    {renderDetail('Phone', mainAuthor.phoneNumber)}
                                </div>
                            </div>

                            {/* 2. Other Authors Information */}
                            {otherAuthors.length > 0 && (
                                <section className={styles.section} style={{ marginTop: '20px' }}>
                                    <h3 className={styles.sectionTitle}>
                                        <User size={16} /> Other Authors ({otherAuthors.length})
                                    </h3>
                                    <div className={styles.coAuthorsGrid}>
                                        {otherAuthors.map((author: any, idx) => {
                                            const isCoAuthorCorresponding = author.isCorrespondingAuthor === true || String(author.isCorrespondingAuthor) === 'true';
                                            return (
                                                <div key={idx} className={styles.coAuthorCard}>
                                                    <div className={styles.authorHeader}>
                                                        <div className={styles.avatarPlaceholderSmall}>
                                                            {author.firstName.charAt(0)}{author.lastName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className={styles.coAuthorName}>{author.firstName} {author.lastName}</h4>
                                                            <span className={styles.authorRole}>
                                                                {author.role || 'Co-Author'}
                                                                {isCoAuthorCorresponding && (
                                                                    <span
                                                                        style={{ marginLeft: '8px', fontSize: '11px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}
                                                                    >
                                                                        Corresponding
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.authorDetails}>
                                                        {renderDetail('Designation', getDesignationDisplay(author))}
                                                        {renderDetail('Institute', author.instituteName)}
                                                        {renderDetail('Department', author.departmentName)}
                                                        {renderDetail('Email', author.email)}
                                                        {renderDetail('Location', `${author.city}${author.state ? `, ${author.state}` : ''}${author.country ? `, ${author.country}` : ''}`)}
                                                        {renderDetail('Phone', author.phoneNumber)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </>
                    );
                })()}
            </section>

            {/* 3. Book Information */}
            {!showMinimalDetails && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <BookOpen size={16} /> Book Details
                    </h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label>Book Title</label>
                            <p className={styles.infoValueLarge}>{resolvedBookTitle || submission.bookTitle}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Proposed Chapters</label>
                            <div className={styles.chaptersList}>
                                {submission.chapters?.map((ch, i) => {
                                    const info = chapterInfo[ch];
                                    return (
                                        <div key={i} className={styles.chapterBadgeWrapper}>
                                            <span className={styles.chapterBadge}>
                                                {info ? info.title : ch}
                                            </span>
                                            {info?.isPublished && (
                                                <span className={styles.publishedTag}>
                                                    Published
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                {!submission.chapters?.length && <span className={styles.emptyText}>No specific chapters listed</span>}
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Selected Editor</label>
                            <p className={styles.infoValueLarge}>
                                {(submission as any).designatedEditor?.fullName || submission.assignedEditor?.fullName || 'Not Yet Assigned'}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* 4. Abstract */}
            {!showMinimalDetails && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <FileText size={16} /> Abstract
                    </h3>
                    <div className={styles.abstractContent}>
                        {submission.abstract}
                    </div>
                </section>
            )}

            {/* 5. Keywords */}
            {!showMinimalDetails && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <Tag size={16} /> Keywords
                    </h3>
                    <div className={styles.keywordsList}>
                        {submission.keywords?.map((kw, i) => (
                            <span key={i} className={styles.keyword}>{kw}</span>
                        ))}
                        {!submission.keywords?.length && <span className={styles.emptyText}>No keywords provided</span>}
                    </div>
                </section>
            )}

            {/* 6. Publication Details */}
            {(submission.isbn || submission.doi) && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <BookOpen size={16} /> Publication Details
                    </h3>
                    <div className={styles.infoGrid}>
                        {submission.isbn && (
                            <div className={styles.infoItem}>
                                <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>ISBN Number</label>
                                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{submission.isbn}</p>
                            </div>
                        )}
                        {submission.doi && (
                            <div className={styles.infoItem}>
                                <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>DOI Number</label>
                                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{submission.doi}</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 7. Delivery Address */}
            {(submission as any).deliveryAddress && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <FileText size={16} /> Delivery Details
                    </h3>
                    <div className={styles.deliveryGrid}>
                        <div className={styles.infoItem}>
                            <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Recipient Name</label>
                            <p style={{ fontWeight: '600', color: '#111827' }}>{(submission as any).deliveryAddress.fullName}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Address Type</label>
                            <p style={{ fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                                {(submission as any).deliveryAddress.isResidential ? '🏠 Residential' : '🏢 Commercial / Office'}
                            </p>
                        </div>
                        
                        {(submission as any).deliveryAddress.companyName && (
                            <div className={styles.infoItem}>
                                <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Company / Institution</label>
                                <p style={{ color: '#374151' }}>{(submission as any).deliveryAddress.companyName}</p>
                            </div>
                        )}
                        
                        {(submission as any).deliveryAddress.contactPersonName && (
                            <div className={styles.infoItem}>
                                <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Contact Person</label>
                                <p style={{ color: '#374151' }}>{(submission as any).deliveryAddress.contactPersonName}</p>
                            </div>
                        )}

                        <div className={styles.infoItem}>
                            <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Email Address</label>
                            <p style={{ color: '#374151' }}>{(submission as any).deliveryAddress.email}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Phone Number</label>
                            <p style={{ color: '#374151' }}>
                                {(submission as any).deliveryAddress.countryCode} {(submission as any).deliveryAddress.mobileNumber}
                            </p>
                        </div>

                        {(submission as any).deliveryAddress.altMobileNumber && (
                            <div className={styles.infoItem}>
                                <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Alt Phone</label>
                                <p style={{ color: '#374151' }}>
                                    {(submission as any).deliveryAddress.altCountryCode} {(submission as any).deliveryAddress.altMobileNumber}
                                </p>
                            </div>
                        )}

                        <div className={`${styles.infoItem} ${styles.deliveryFullRow}`}>
                            <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Shipping Address</label>
                            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', lineHeight: '1.6' }}>
                                <p style={{ margin: 0, fontWeight: '500' }}>{(submission as any).deliveryAddress.addressLine1}</p>
                                {(submission as any).deliveryAddress.addressLine2 && <p style={{ margin: 0 }}>{(submission as any).deliveryAddress.addressLine2}</p>}
                                <p style={{ margin: 0 }}>
                                    {[(submission as any).deliveryAddress.buildingName, (submission as any).deliveryAddress.streetName, (submission as any).deliveryAddress.area, (submission as any).deliveryAddress.landmark].filter(Boolean).join(', ')}
                                </p>
                                <p style={{ margin: 0 }}>
                                    {(submission as any).deliveryAddress.city}, {(submission as any).deliveryAddress.state} - {(submission as any).deliveryAddress.postalCode}
                                </p>
                                <p style={{ margin: 0, fontWeight: '600', color: '#1e5292', marginTop: '6px' }}>{(submission as any).deliveryAddress.country.toUpperCase()}</p>
                            </div>
                        </div>

                        {(submission as any).deliveryAddress.deliveryInstructions && (
                            <div className={`${styles.infoItem} ${styles.deliveryFullRow}`}>
                                <label style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Delivery Instructions</label>
                                <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                    <p style={{ color: '#92400e', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>{(submission as any).deliveryAddress.deliveryInstructions}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Manuscript History / Files removed from overview */}

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

            {/* Alert Popup */}
            <AlertPopup
                isOpen={alert.isOpen}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, isOpen: false })}
            />
        </div>
    );
};

export default SubmissionOverview;
