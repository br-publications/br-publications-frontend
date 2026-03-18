import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import CoverImageDropzone from './components/CoverImageDropzone';
import BulkUploadValidationTable from './components/BulkUploadValidationTable';
import PublishingProgressTracker from './components/PublishingProgressTracker';
import ImageCropper from '../publishing/ImageCropper';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import { downloadCSVTemplate, type CSVTemplateData } from '../../../utils/csvTemplateGenerator';
import {
    parseCSVRow,
    matchCoverImages,
    validateBookEntry,
    findDuplicateISBNs,
    type ParsedBookEntry,
    type ValidationResult
} from '../../../utils/bulkUploadValidator';
import {
    publishBooksSequentially,
    calculateEstimatedTime,
    formatTime,
    type PublishingProgress
} from '../../../utils/bulkPublisher';
import { checkIsbnAvailability } from '../../../services/textBookService';
import './textBookBulkUpload.css';

type Step = 'upload' | 'validation' | 'correction' | 'publishing' | 'complete';

const TextBookBulkUpload: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [currentStep, setCurrentStep] = useState<Step>('upload');
    const [csvFile, setCSVFile] = useState<File | null>(null);
    const [coverImages, setCoverImages] = useState<File[]>([]);
    const [parsedEntries, setParsedEntries] = useState<ParsedBookEntry[]>([]);
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [publishingProgress, setPublishingProgress] = useState<PublishingProgress | null>(null);
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

    // Cropping State
    const [croppingState, setCroppingState] = useState<{
        rowNumber: number;
        imageSrc: string;
        fileName: string;
    } | null>(null);

    // Step 1: Handle CSV Upload
    const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCSVFile(file);
        }
    };

    // Step 2: Parse and Validate
    const handleParseAndValidate = () => {
        if (!csvFile) {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Missing CSV',
                message: 'Please upload a CSV file first.'
            });
            return;
        }

        Papa.parse<CSVTemplateData>(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setAlertConfig({
                        isOpen: true,
                        type: 'error',
                        title: 'CSV Parse Error',
                        message: `Failed to parse CSV: ${results.errors[0].message}`
                    });
                    return;
                }

                // Parse entries
                const entries = results.data.map((row, index) => parseCSVRow(row, index + 2)); // +2 for header row

                // Match cover images
                const entriesWithImages = matchCoverImages(entries, coverImages);
                setParsedEntries(entriesWithImages);

                // Check for duplicates within the batch
                const duplicateISBNsInBatch = findDuplicateISBNs(entriesWithImages);

                // Collect ISBNs to check against server
                const isbnList = entriesWithImages
                    .map(e => e.isbn?.trim())
                    .filter((isbn): isbn is string => !!isbn);

                // Check availability against server
                checkIsbnAvailability(isbnList)
                    .then(existingIsbns => {
                        const existingIsbnSet = new Set(existingIsbns);

                        // Validate entries
                        const validations = entriesWithImages.map(entry => {
                            const isbn = entry.isbn?.trim();
                            const isBatchDuplicate = isbn ? duplicateISBNsInBatch.has(isbn) : false;
                            const isServerDuplicate = isbn ? existingIsbnSet.has(isbn) : false;

                            return validateBookEntry(entry, !!entry.matchedCoverImage, isBatchDuplicate, isServerDuplicate);
                        });
                        setValidationResults(validations);

                        if (duplicateISBNsInBatch.size > 0 || existingIsbnSet.size > 0) {
                            let message = '';
                            if (duplicateISBNsInBatch.size > 0) {
                                message += `Duplicate ISBNs in batch: ${Array.from(duplicateISBNsInBatch).join(', ')}\n\n`;
                            }
                            if (existingIsbnSet.size > 0) {
                                message += `ISBNs already registered in system: ${Array.from(existingIsbnSet).join(', ')}`;
                            }

                            setAlertConfig({
                                isOpen: true,
                                type: 'error',
                                title: 'Invalid ISBNs Detected',
                                message: `${message}\n\nThese entries have been marked as invalid.`
                            });
                        } else {
                            const validCount = validations.filter(v => v.isValid).length;
                            setAlertConfig({
                                isOpen: true,
                                type: 'info',
                                title: 'Validation Complete',
                                message: `${validCount} valid entries out of ${validations.length} total.`
                            });
                        }

                        setCurrentStep('validation');
                    })
                    .catch(error => {
                        console.error('Failed to check ISBNs:', error);
                        setAlertConfig({
                            isOpen: true,
                            type: 'error',
                            title: 'Validation Error',
                            message: 'Failed to verify ISBN availability with server. Please try again.'
                        });
                    });
            },
            error: (error) => {
                setAlertConfig({
                    isOpen: true,
                    type: 'error',
                    title: 'Parse Error',
                    message: `Failed to parse CSV: ${error.message}`
                });
            }
        });
    };

    const handleRemoveEntry = (rowNumber: number) => {
        const updatedEntries = parsedEntries.filter(e => e.rowNumber !== rowNumber);
        const updatedValidations = validationResults.filter(v => v.rowNumber !== rowNumber);

        setParsedEntries(updatedEntries);
        setValidationResults(updatedValidations);

        setAlertConfig({
            isOpen: true,
            type: 'info',
            title: 'Entry Removed',
            message: `Row ${rowNumber} has been removed.`
        });
    };

    const handleCropRequest = (rowNumber: number) => {
        const entry = parsedEntries.find(e => e.rowNumber === rowNumber);
        if (entry && entry.matchedCoverImage) {
            const reader = new FileReader();
            reader.onload = () => {
                setCroppingState({
                    rowNumber,
                    imageSrc: reader.result as string,
                    fileName: entry.matchedCoverImage!.name
                });
            };
            reader.readAsDataURL(entry.matchedCoverImage);
        }
    };

    const handleCropComplete = (_cropArea: any, croppedBlob: Blob) => {
        if (!croppingState) return;

        const croppedFile = new File([croppedBlob], croppingState.fileName, {
            type: 'image/png',
            lastModified: Date.now()
        });

        setParsedEntries(prev => prev.map(entry => {
            if (entry.rowNumber === croppingState.rowNumber) {
                return { ...entry, matchedCoverImage: croppedFile };
            }
            return entry;
        }));

        setCroppingState(null);
    };

    const handleCropCancel = () => {
        setCroppingState(null);
    };

    // Step 4: Proceed to Publishing
    const handleProceedToPublishing = () => {
        const validEntries = parsedEntries.filter(entry => {
            const validation = validationResults.find(v => v.rowNumber === entry.rowNumber);
            return validation?.isValid;
        });

        if (validEntries.length === 0) {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'No Valid Entries',
                message: 'There are no valid entries to publish. Please correct errors or upload a new CSV.'
            });
            return;
        }

        const estimatedTime = calculateEstimatedTime(validEntries.length);
        const confirmMessage = `You are about to publish ${validEntries.length} book(s).\n\nEstimated time: ${formatTime(estimatedTime)}\n\nDo you want to proceed?`;

        setAlertConfig({
            isOpen: true,
            type: 'info',
            title: 'Confirm Publishing',
            message: confirmMessage,
            showCancel: true,
            confirmText: 'Yes, Publish',
            onConfirm: () => {
                setCurrentStep('publishing');
                startPublishing(validEntries);
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Start Publishing
    const startPublishing = async (validEntries: ParsedBookEntry[]) => {
        try {
            const result = await publishBooksSequentially(validEntries, (progress) => {
                setPublishingProgress(progress);
            });

            setCurrentStep('complete');

            setAlertConfig({
                isOpen: true,
                type: result.failureCount === 0 ? 'success' : 'warning',
                title: 'Publishing Complete',
                message: `Successfully published ${result.successCount} out of ${result.successCount + result.failureCount} books.\n\nTotal time: ${formatTime(result.totalTime)}`
            });

        } catch (error: any) {
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Publishing Failed',
                message: error.message || 'An error occurred during publishing.'
            });
        }
    };

    // Reset and start over
    const handleReset = () => {
        setCurrentStep('upload');
        setCSVFile(null);
        setCoverImages([]);
        setParsedEntries([]);
        setValidationResults([]);
        setPublishingProgress(null);
    };

    const validCount = validationResults.filter(v => v.isValid).length;
    const estimatedTime = validCount > 0 ? calculateEstimatedTime(validCount) : 0;

    return (
        <div className="textBookBulk-container">
            {/* Header */}
            <div className="textBookBulk-header">
                <h1>Bulk TextBook Upload</h1>
                <button
                    className="textBookBulk-back-button"
                    onClick={() => navigate('/dashboard/admin/textbooks')}
                >
                    ← Back
                </button>
            </div>

            {/* Step Indicator */}
            <div className="textBookBulk-step-indicator">
                <div className={`textBookBulk-step ${currentStep === 'upload' ? 'textBookBulk-step-active' : 'textBookBulk-step-completed'}`}>
                    <div className="textBookBulk-step-number">1</div>
                    <div className="textBookBulk-step-label">Upload</div>
                </div>
                <div className="textBookBulk-step-line" style={{ width: '40px' }} />
                <div className={`textBookBulk-step ${currentStep === 'validation' || currentStep === 'correction' ? 'textBookBulk-step-active' : currentStep === 'publishing' || currentStep === 'complete' ? 'textBookBulk-step-completed' : ''}`}>
                    <div className="textBookBulk-step-number">2</div>
                    <div className="textBookBulk-step-label">Validate</div>
                </div>
                <div className="textBookBulk-step-line" style={{ width: '40px' }} />
                <div className={`textBookBulk-step ${currentStep === 'publishing' ? 'textBookBulk-step-active' : currentStep === 'complete' ? 'textBookBulk-step-completed' : ''}`}>
                    <div className="textBookBulk-step-number">3</div>
                    <div className="textBookBulk-step-label">Publish</div>
                </div>
                <div className="textBookBulk-step-line" style={{ width: '40px' }} />
                <div className={`textBookBulk-step ${currentStep === 'complete' ? 'textBookBulk-step-active' : ''}`}>
                    <div className="textBookBulk-step-number">4</div>
                    <div className="textBookBulk-step-label">Complete</div>
                </div>
            </div>

            {/* Step Content */}
            <div className="textBookBulk-content">
                {/* Step 1: Upload */}
                {currentStep === 'upload' && (
                    <div className="textBookBulk-upload-section">
                        <h2>Step 1: Upload CSV and Cover Images</h2>
                        <p className="bcp-bulk-card-desc">
                            Download the template, fill in one row per book chapter, then upload the
                            CSV along with all cover image files. Image filenames must match the
                            <code> coverImageFilename </code> column exactly.
                        </p>
                        {/* CSV Upload */}
                        <div className="textBookBulk-csv-section">
                            <div className="textBookBulk-section-header">
                                <h3>CSV File</h3>
                                <button
                                    className="textBookBulk-template-button"
                                    onClick={downloadCSVTemplate}
                                >
                                    📥 Download Template
                                </button>
                            </div>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="textBookBulk-file-input"
                            />
                            {csvFile && (
                                <p className="textBookBulk-file-name">Selected: {csvFile.name}</p>
                            )}
                        </div>

                        {/* Cover Images Upload */}
                        <div className="textBookBulk-images-section">
                            <h3>Cover Images</h3>
                            <CoverImageDropzone
                                selectedImages={coverImages}
                                onImagesSelected={setCoverImages}
                            />
                        </div>

                        {/* Next Button */}
                        <button
                            className="textBookBulk-primary-button"
                            onClick={handleParseAndValidate}
                            disabled={!csvFile}
                        >
                            Parse & Validate →
                        </button>
                    </div>
                )}

                {/* Step 2 & 3: Validation & Correction */}
                {(currentStep === 'validation' || currentStep === 'correction') && (
                    <div className="textBookBulk-validation-section">
                        <h2>Step 2: Review Validation Results</h2>

                        <BulkUploadValidationTable
                            entries={parsedEntries}
                            validationResults={validationResults}
                            onRemoveEntry={handleRemoveEntry}
                            onCrop={handleCropRequest}
                        />

                        {validCount > 0 && (
                            <div className="textBookBulk-proceed-section">
                                <div className="textBookBulk-estimate">
                                    <p><strong>Valid Entries:</strong> {validCount}</p>
                                    <p><strong>Estimated Time:</strong> {formatTime(estimatedTime)}</p>
                                </div>
                                <button
                                    className="textBookBulk-primary-button"
                                    onClick={handleProceedToPublishing}
                                >
                                    Proceed with {validCount} Valid Entries →
                                </button>
                            </div>
                        )}

                        <button
                            className="textBookBulk-secondary-button"
                            onClick={handleReset}
                        >
                            ← Start Over
                        </button>
                    </div>
                )}

                {/* Step 4: Publishing */}
                {currentStep === 'publishing' && publishingProgress && (
                    <div className="textBookBulk-publishing-section">
                        <h2>Step 3: Publishing Books</h2>
                        <PublishingProgressTracker progress={publishingProgress} />
                    </div>
                )}

                {/* Step 5: Complete */}
                {currentStep === 'complete' && publishingProgress && (
                    <div className="textBookBulk-complete-section">
                        <h2>Publishing Complete!</h2>
                        <PublishingProgressTracker progress={publishingProgress} />

                        <div className="textBookBulk-complete-actions">
                            <button
                                className="textBookBulk-primary-button"
                                onClick={() => navigate('/dashboard/admin/textbooks?tab=completed')}
                            >
                                View Published Books
                            </button>
                            <button
                                className="textBookBulk-secondary-button"
                                onClick={handleReset}
                            >
                                Upload More Books
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Cropper Modal */}
            {croppingState && (
                <ImageCropper
                    image={croppingState.imageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            {/* Alert Popup */}
            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                showCancel={alertConfig.showCancel}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
            />
        </div>
    );
};

export default TextBookBulkUpload;
