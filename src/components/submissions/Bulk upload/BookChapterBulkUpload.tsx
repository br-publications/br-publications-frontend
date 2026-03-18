/**
 * BookChapterBulkUpload.tsx
 *
 * Bulk publishing page for Book Chapters.
 *
 * Architecture:
 *  ┌─ Step 1: Upload CSV + Cover Images
 *  ├─ Step 2: Parse & Validate (ISBN dupe check against server)
 *  ├─ Step 3: Review validation table, crop images per entry
 *  ├─ Step 4: Sequential publishing (reuses publishBookChapter service)
 *  └─ Step 5: Complete
 *
 * The cover image cropper is driven internally using react-easy-crop
 * (same library used by IndividualPublishChapterWizard) so the crop
 * UX is identical and we don't need to mount the full wizard modal.
 *
 * To publish a single book manually (with TOC, PDFs, biographies etc.)
 * the admin should use IndividualPublishChapterModal instead.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import ImageCropper from '../../../pages/textBookSubmission/publishing/ImageCropper';
import { autoCropCoverImage } from '../../../utils/imageCropperUtils';

import BcpBulkCoverImageDropzone from './BcpBulkCoverImageDropzone';
import BcpBulkPdfDropzone from './BcpBulkPdfDropzone';
import BcpBulkValidationTable from './BcpBulkValidationTable';
import BcpBulkProgressTracker from './BcpBulkProgressTracker';
import AlertPopup from '../../common/alertPopup';
import type { AlertType } from '../../common/alertPopup';

import {
    parseChapterCSVRow,
    matchChapterCoverImages,
    matchChapterPdfs,
    validateChapterEntry,
    findDuplicateChapterISBNs,
    downloadChapterCSVTemplate,
    type ParsedChapterEntry,
    type ChapterCSVRow,
    type ChapterValidationResult,
} from './bcpBulkValidator';

import {
    publishChaptersSequentially,
    bcpCalculateEstimatedTime,
    bcpFormatTime,
    type BcpPublishingProgress,
} from './bcpBulkPublisher';

import { checkBookChapterIsbnAvailability } from '../../../services/bookChapterPublishing.service';

import './bookChapterBulkUpload.css';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type Step = 'upload' | 'validation' | 'publishing' | 'complete';



// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

const BookChapterBulkUpload: React.FC = () => {
    const navigate = useNavigate();

    // ── Main wizard state ──────────────────────────────────
    const [currentStep, setCurrentStep] = useState<Step>('upload');
    const [csvFile, setCSVFile] = useState<File | null>(null);
    const [coverImages, setCoverImages] = useState<File[]>([]);
    const [pdfFiles, setPdfFiles] = useState<File[]>([]);
    const [parsedEntries, setParsedEntries] = useState<ParsedChapterEntry[]>([]);
    const [validationResults, setValidationResults] = useState<ChapterValidationResult[]>([]);
    const [publishingProgress, setPublishingProgress] = useState<BcpPublishingProgress | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);

    // ── Alert popup ────────────────────────────────────────
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
        showCancel?: boolean;
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    const showAlert = (
        type: AlertType,
        title: string,
        message: string,
        opts?: Partial<typeof alertConfig>
    ) => setAlertConfig({ isOpen: true, type, title, message, ...opts });

    // ── Per-entry cover image cropping ─────────────────────
    // We keep a single cropper state; only one entry can be
    // cropped at a time (same pattern as TextBookBulkUpload).
    const [cropState, setCropState] = useState<{
        rowNumber: number;
        imageSrc: string;
        fileName: string;
    } | null>(null);



    // ── Helpers ────────────────────────────────────────────

    const validCount = validationResults.filter((v) => v.isValid).length;
    const estimatedTime = validCount > 0 ? bcpCalculateEstimatedTime(validCount) : 0;

    // ──────────────────────────────────────────────────────
    // STEP 1: Handle CSV file selection
    // ──────────────────────────────────────────────────────
    const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCSVFile(file);
    };

    const clearCSV = () => {
        setCSVFile(null);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    // ──────────────────────────────────────────────────────
    // STEP 2: Parse CSV + validate
    // ──────────────────────────────────────────────────────
    const handleParseAndValidate = () => {
        if (!csvFile) {
            showAlert('error', 'Missing CSV', 'Please upload a CSV file first.');
            return;
        }

        setIsValidating(true);

        Papa.parse<ChapterCSVRow>(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (results.errors.length > 0) {
                    showAlert(
                        'error',
                        'CSV Parse Error',
                        `Failed to parse CSV: ${results.errors[0].message}`
                    );
                    setIsValidating(false);
                    return;
                }

                // Parse rows
                const entries = results.data.map((row, idx) =>
                    parseChapterCSVRow(row, idx + 2) // +2 = header row offset
                );

                // Match cover images by filename
                const entriesWithImages = matchChapterCoverImages(entries, coverImages);
                // Match PDFs by filename
                const entriesWithPdfs = matchChapterPdfs(entriesWithImages, pdfFiles);

                setParsedEntries(entriesWithPdfs);

                // Batch ISBN dupe check
                const batchDupes = findDuplicateChapterISBNs(entriesWithPdfs);
                const isbnList = entriesWithPdfs
                    .map((e) => e.isbn?.trim())
                    .filter((isbn): isbn is string => !!isbn);

                try {
                    // Use BCP-specific ISBN check (queries PublishedBookChapter, not textbook tables)
                    const existingIsbns = await checkBookChapterIsbnAvailability(isbnList);
                    const existingSet = new Set(existingIsbns);

                    const validations = entriesWithPdfs.map((entry) => {
                        const isbn = entry.isbn?.trim();
                        return validateChapterEntry(
                            entry,
                            !!entry.matchedCoverImage,
                            isbn ? batchDupes.has(isbn) : false,
                            isbn ? existingSet.has(isbn) : false
                        );
                    });

                    setValidationResults(validations);
                    setCurrentStep('validation');

                    // Build summary message
                    const validCnt = validations.filter((v) => v.isValid).length;
                    const invalidCnt = validations.length - validCnt;

                    if (batchDupes.size > 0 || existingSet.size > 0) {
                        let msg = '';
                        if (batchDupes.size > 0)
                            msg += `Duplicate ISBNs in batch: ${[...batchDupes].join(', ')}\n\n`;
                        if (existingSet.size > 0)
                            msg += `ISBNs already in system: ${[...existingSet].join(', ')}`;
                        showAlert('error', 'Duplicate ISBNs Detected', msg);
                    } else {
                        showAlert(
                            invalidCnt === 0 ? 'success' : 'info',
                            'Validation Complete',
                            `${validCnt} valid, ${invalidCnt} invalid out of ${validations.length} entries.`
                        );
                    }
                } catch (err: any) {
                    showAlert(
                        'error',
                        'Validation Error',
                        'Could not verify ISBNs with the server. Please try again.'
                    );
                }

                setIsValidating(false);
            },
            error: (err) => {
                showAlert('error', 'Parse Error', `Failed to parse CSV: ${err.message}`);
                setIsValidating(false);
            },
        });
    };

    // ──────────────────────────────────────────────────────
    // STEP 3: Remove a single entry from the table
    // ──────────────────────────────────────────────────────
    const handleRemoveEntry = (rowNumber: number) => {
        setParsedEntries((prev) => prev.filter((e) => e.rowNumber !== rowNumber));
        setValidationResults((prev) => prev.filter((v) => v.rowNumber !== rowNumber));
    };

    // ──────────────────────────────────────────────────────
    // STEP 3: Crop request — open cropper for a row's cover image
    // ──────────────────────────────────────────────────────
    const handleCropRequest = async (rowNumber: number) => {
        const entry = parsedEntries.find((e) => e.rowNumber === rowNumber);
        if (!entry?.matchedCoverImage) return;

        // Auto-crop the image to the correct aspect ratio first, then pass to
        // the ImageCropper for fine-tuning. This prevents the "far-right sliver"
        // problem caused by ImageCropper's default onMediaLoaded position.
        let imageFile = entry.matchedCoverImage;
        try {
            imageFile = await autoCropCoverImage(imageFile);
        } catch (cropError) {
            console.warn('Pre-crop failed, opening original:', cropError);
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropState({
                rowNumber,
                imageSrc: reader.result as string,
                fileName: entry.matchedCoverImage!.name,
            });
        };
        reader.readAsDataURL(imageFile);
    };

    // Apply the crop: take Blob from ImageCropper → convert to File → replace matchedCoverImage
    const handleCropComplete = (_cropArea: any, croppedBlob: Blob) => {
        if (!cropState) return;

        const croppedFile = new File([croppedBlob], cropState.fileName, {
            type: 'image/png',
            lastModified: Date.now()
        });

        // Replace the matched image in parsedEntries
        setParsedEntries((prev) =>
            prev.map((e) =>
                e.rowNumber === cropState.rowNumber
                    ? { ...e, matchedCoverImage: croppedFile }
                    : e
            )
        );

        // Re-validate cover image warning for this row
        setValidationResults((prev) =>
            prev.map((v) =>
                v.rowNumber === cropState.rowNumber
                    ? {
                        ...v,
                        warnings: v.warnings.filter(
                            (w) => !w.toLowerCase().includes('cover')
                        ),
                    }
                    : v
            )
        );

        setCropState(null);
    };

    const handleCropCancel = () => setCropState(null);

    // ──────────────────────────────────────────────────────
    // STEP 3b: Inline category update from validation table
    // ──────────────────────────────────────────────────────
    const handleUpdateCategory = (rowNumber: number, newCategory: string) => {
        // Update the entry's category in parsedEntries
        const updatedEntries = parsedEntries.map((e) =>
            e.rowNumber === rowNumber ? { ...e, category: newCategory } : e
        );
        setParsedEntries(updatedEntries);

        // Re-run validation for just that row so errors update immediately
        const updatedEntry = updatedEntries.find((e) => e.rowNumber === rowNumber);
        if (!updatedEntry) return;

        setValidationResults((prev) =>
            prev.map((v) => {
                if (v.rowNumber !== rowNumber) return v;
                const isBatchDup = prev.some(
                    (other) => other.rowNumber !== rowNumber &&
                        updatedEntries.find((e) => e.rowNumber === other.rowNumber)?.isbn === updatedEntry.isbn
                );
                return validateChapterEntry(
                    updatedEntry,
                    !!updatedEntry.matchedCoverImage,
                    isBatchDup,
                    false // server dup stays false; user can re-validate from step 1 if needed
                );
            })
        );
    };

    // ──────────────────────────────────────────────────────
    // STEP 4: Confirm and start publishing
    // ──────────────────────────────────────────────────────
    const handleProceedToPublishing = () => {
        const validEntries = parsedEntries.filter((entry) => {
            const result = validationResults.find((v) => v.rowNumber === entry.rowNumber);
            return result?.isValid;
        });

        if (validEntries.length === 0) {
            showAlert(
                'error',
                'No Valid Entries',
                'There are no valid entries to publish. Please correct errors or upload a new CSV.'
            );
            return;
        }

        showAlert(
            'info',
            'Confirm Publishing',
            `You are about to publish ${validEntries.length} book chapter(s).\n\nEstimated time: ${bcpFormatTime(
                bcpCalculateEstimatedTime(validEntries.length)
            )}\n\nYou are about to publish these book chapters with their full details including TOC and PDFs.\n\nDo you want to proceed?`,
            {
                showCancel: true,
                confirmText: 'Yes, Publish All',
                cancelText: 'Cancel',
                onConfirm: () => {
                    setAlertConfig((p) => ({ ...p, isOpen: false }));
                    setCurrentStep('publishing');
                    startPublishing(validEntries);
                },
            }
        );
    };

    const startPublishing = async (validEntries: ParsedChapterEntry[]) => {
        try {
            const result = await publishChaptersSequentially(validEntries, (progress) => {
                setPublishingProgress(progress);
            });

            setCurrentStep('complete');
            showAlert(
                result.failureCount === 0 ? 'success' : 'warning',
                'Publishing Complete',
                `Successfully published ${result.successCount} of ${result.successCount + result.failureCount
                } book chapters.\n\nTotal time: ${bcpFormatTime(result.totalTime)}`
            );
        } catch (err: any) {
            showAlert(
                'error',
                'Publishing Failed',
                err?.message ?? 'An unexpected error occurred during publishing.'
            );
        }
    };

    // ──────────────────────────────────────────────────────
    // Reset
    // ──────────────────────────────────────────────────────
    const handleReset = () => {
        setCurrentStep('upload');
        setCSVFile(null);
        setCoverImages([]);
        setPdfFiles([]);
        setParsedEntries([]);
        setValidationResults([]);
        setPublishingProgress(null);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    // ──────────────────────────────────────────────────────
    // Step indicator helpers
    // ──────────────────────────────────────────────────────
    const stepOrder: Step[] = ['upload', 'validation', 'publishing', 'complete'];
    const stepIdx = stepOrder.indexOf(currentStep);

    const stepClass = (idx: number) => {
        if (idx < stepIdx) return 'bcp-bulk-step-done';
        if (idx === stepIdx) return 'bcp-bulk-step-active';
        return '';
    };

    const connectorClass = (idx: number) =>
        idx < stepIdx ? 'bcp-bulk-connector-done' : '';

    // ──────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────
    return (
        <div className="bcp-bulk-page">
            {/* ── Page header ── */}
            <div className="bcp-bulk-header">
                <div className="bcp-bulk-header-left">
                    <h1>📚 Book Chapter — Bulk Publish</h1>
                    <p>
                        Upload a CSV with book chapter metadata and matching cover images to
                        publish multiple titles at once.
                    </p>
                </div>
                <button
                    className="bcp-bulk-back-btn"
                    onClick={() => navigate('/dashboard/admin/book-chapters')}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* ── Step indicator ── */}
            <div className="bcp-bulk-stepper">
                {['Upload', 'Validate', 'Publish', 'Complete'].map((label, idx) => (
                    <React.Fragment key={label}>
                        <div className={`bcp-bulk-step ${stepClass(idx)}`}>
                            <div className="bcp-bulk-step-circle">
                                {idx < stepIdx ? '✓' : idx + 1}
                            </div>
                            <div className="bcp-bulk-step-label">{label}</div>
                        </div>
                        {idx < 3 && (
                            <div
                                className={`bcp-bulk-step-connector ${connectorClass(idx)}`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* ── Step content ── */}
            <div className="bcp-bulk-card">

                {/* ════ STEP 1: Upload ════ */}
                {currentStep === 'upload' && (
                    <>
                        <p className="bcp-bulk-card-title">Step 1 — Upload CSV &amp; Cover Images</p>
                        <p className="bcp-bulk-card-desc">
                            Download the template, fill in one row per book chapter, then upload the
                            CSV along with all cover image files. Image filenames must match the
                            <code> coverImageFilename </code> column exactly.
                        </p>

                        {/* CSV section */}
                        <div className="bcp-bulk-section">
                            <div className="bcp-bulk-section-header">
                                <span className="bcp-bulk-section-label">CSV File</span>
                                <button
                                    className="bcp-bulk-template-btn"
                                    onClick={downloadChapterCSVTemplate}
                                >
                                    📥 Download Template
                                </button>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={csvInputRef}
                                type="file"
                                accept=".csv"
                                className="bcp-bulk-hidden-input"
                                onChange={handleCSVSelect}
                            />

                            {/* Styled strip trigger */}
                            <div className="bcp-bulk-csv-strip">
                                <button
                                    type="button"
                                    className="bcp-bulk-csv-trigger"
                                    onClick={() => csvInputRef.current?.click()}
                                >
                                    📂 Choose CSV
                                </button>
                                <span
                                    className={`bcp-bulk-csv-filename ${csvFile ? 'bcp-bulk-has-file' : ''
                                        }`}
                                >
                                    {csvFile ? csvFile.name : 'No file selected…'}
                                </span>
                                {csvFile && (
                                    <button
                                        type="button"
                                        className="bcp-bulk-csv-clear"
                                        onClick={clearCSV}
                                        title="Clear CSV"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="bcp-bulk-info-box">
                                <span className="bcp-bulk-info-icon">ℹ</span>
                                <span>
                                    Bulk upload populates full book chapter metadata, including 
                                    editors, keywords, TOC chapters, biographies, and all 
                                    matching PDF documents. Ensure your filenames in the CSV
                                    match the uploaded files exactly.
                                </span>
                            </div>
                        </div>

                        {/* Cover images dropzone */}
                        <div className="bcp-bulk-section">
                            <div className="bcp-bulk-section-header">
                                <span className="bcp-bulk-section-label">Cover Images</span>
                            </div>
                            <BcpBulkCoverImageDropzone
                                selectedImages={coverImages}
                                onImagesSelected={setCoverImages}
                            />
                        </div>

                        {/* Chapter PDFs dropzone */}
                        <div className="bcp-bulk-section">
                            <div className="bcp-bulk-section-header">
                                <span className="bcp-bulk-section-label">Chapter PDFs (Optional)</span>
                            </div>
                            <BcpBulkPdfDropzone
                                selectedPdfs={pdfFiles}
                                onPdfsSelected={setPdfFiles}
                            />
                        </div>

                        {/* Action */}
                        <div className="bcp-bulk-action-bar">
                            <span />
                            <div className="bcp-bulk-action-right">
                                <button
                                    className="bcp-bulk-btn bcp-bulk-btn-primary"
                                    onClick={handleParseAndValidate}
                                    disabled={!csvFile || isValidating}
                                >
                                    {isValidating ? '⏳ Validating…' : 'Parse & Validate →'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ════ STEP 2: Validation ════ */}
                {currentStep === 'validation' && (
                    <>
                        <p className="bcp-bulk-card-title">Step 2 — Review Validation Results</p>
                        <p className="bcp-bulk-card-desc">
                            Review errors below. You can remove invalid entries or crop cover images
                            before proceeding. Only valid entries will be published.
                        </p>

                        <BcpBulkValidationTable
                            entries={parsedEntries}
                            validationResults={validationResults}
                            onRemoveEntry={handleRemoveEntry}
                            onCrop={handleCropRequest}
                            onUpdateCategory={handleUpdateCategory}
                        />

                        {/* Proceed panel (only shown when there are valid entries) */}
                        {validCount > 0 && (
                            <div className="bcp-bulk-proceed-panel">
                                <div className="bcp-bulk-estimate">
                                    <p>
                                        <strong>Valid Entries:</strong> {validCount}
                                    </p>
                                    <p>
                                        <strong>Estimated Time:</strong>{' '}
                                        {bcpFormatTime(estimatedTime)}
                                    </p>
                                </div>
                                <button
                                    className="bcp-bulk-btn bcp-bulk-btn-success"
                                    onClick={handleProceedToPublishing}
                                >
                                    Proceed with {validCount} Valid Entr
                                    {validCount !== 1 ? 'ies' : 'y'} →
                                </button>
                            </div>
                        )}

                        <div className="bcp-bulk-action-bar">
                            <button
                                className="bcp-bulk-btn bcp-bulk-btn-secondary"
                                onClick={handleReset}
                            >
                                ← Start Over
                            </button>
                            <div className="bcp-bulk-action-right" />
                        </div>
                    </>
                )}

                {/* ════ STEP 3: Publishing ════ */}
                {currentStep === 'publishing' && publishingProgress && (
                    <>
                        <p className="bcp-bulk-card-title">Step 3 — Publishing Book Chapters</p>
                        <p className="bcp-bulk-card-desc">
                            Please keep this page open while publishing is in progress.
                        </p>
                        <BcpBulkProgressTracker progress={publishingProgress} />
                    </>
                )}

                {/* ════ STEP 4: Complete ════ */}
                {currentStep === 'complete' && publishingProgress && (
                    <>
                        <p className="bcp-bulk-card-title">Step 4 — Publishing Complete</p>

                        <div className="bcp-bulk-complete-wrap">
                            <span className="bcp-bulk-complete-icon">🎉</span>
                            <p className="bcp-bulk-complete-title">All Done!</p>
                            <p className="bcp-bulk-complete-sub">
                                Review the log below. Failed entries can be retried individually
                                using the Individual Publish wizard.
                            </p>
                        </div>

                        <BcpBulkProgressTracker progress={publishingProgress} />

                        <div className="bcp-bulk-complete-actions" style={{ marginTop: 24 }}>
                            <button
                                className="bcp-bulk-btn bcp-bulk-btn-primary"
                                onClick={() =>
                                    navigate('/dashboard/admin/book-chapters?tab=completed')
                                }
                            >
                                View Published Chapters
                            </button>
                            <button
                                className="bcp-bulk-btn bcp-bulk-btn-secondary"
                                onClick={handleReset}
                            >
                                Upload More Chapters
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Image Cropper Modal */}
            {cropState && (
                <ImageCropper
                    image={cropState.imageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            {/* ── Alert popup ── */}
            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig((p) => ({ ...p, isOpen: false }))}
                showCancel={alertConfig.showCancel}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
            />
        </div>
    );
};

export default BookChapterBulkUpload;


