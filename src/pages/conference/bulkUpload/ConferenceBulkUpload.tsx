/**
 * ConferenceBulkUpload.tsx
 *
 * 4-step bulk upload wizard for conferences:
 *   Step 1: Upload CSV
 *   Step 2: Parse & Validate → review table
 *   Step 3: Sequential publishing + live progress
 *   Step 4: Complete → downloadable report
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import AlertPopup from '../../../components/common/alertPopup';
import type { AlertType } from '../../../components/common/alertPopup';
import ConfBulkValidationTable from './ConfBulkValidationTable';
import ConfBulkProgressTracker from './ConfBulkProgressTracker';

import {
    parseConfCSVRow,
    validateConfEntry,
    findDuplicateConfTitles,
    downloadConfCSVTemplate,
    type ParsedConfEntry,
    type ConfValidationResult,
    type ConfCSVRow,
} from './confBulkValidator';

import {
    publishConferencesSequentially,
    confCalculateEstimatedTime,
    confFormatTime,
    type ConfPublishingProgress,
    type ConfPublishingResult,
} from './confBulkPublisher';

import './conferenceBulkUpload.css';

type Step = 'upload' | 'validation' | 'publishing' | 'complete';

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

const ConferenceBulkUpload: React.FC = () => {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState<Step>('upload');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parsedEntries, setParsedEntries] = useState<ParsedConfEntry[]>([]);
    const [validationResults, setValidationResults] = useState<ConfValidationResult[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [publishingProgress, setPublishingProgress] = useState<ConfPublishingProgress | null>(null);
    const [finalResult, setFinalResult] = useState<ConfPublishingResult | null>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean; type: AlertType;
        title: string; message: string;
        showCancel?: boolean; confirmText?: string; cancelText?: string;
        onConfirm?: () => void;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    const showAlert = (
        type: AlertType, title: string, message: string,
        opts?: Partial<typeof alertConfig>
    ) => setAlertConfig({ isOpen: true, type, title, message, ...opts });

    // ── Step helpers ───────────────────────────────────────────
    const stepOrder: Step[] = ['upload', 'validation', 'publishing', 'complete'];
    const stepIdx = stepOrder.indexOf(currentStep);
    const stepClass = (idx: number) =>
        idx < stepIdx ? 'cbulk-step-done' : idx === stepIdx ? 'cbulk-step-active' : '';

    // Derived
    const validCount = validationResults.filter(v => v.isValid).length;
    const estimatedMs = confCalculateEstimatedTime(validCount);

    // ── STEP 1: CSV selection ──────────────────────────────────
    const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCsvFile(file);
    };
    const clearCsv = () => {
        setCsvFile(null);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    // ── STEP 2: Parse + validate ───────────────────────────────
    const handleParseAndValidate = () => {
        if (!csvFile) {
            showAlert('error', 'Missing CSV', 'Please upload a CSV file first.');
            return;
        }
        setIsValidating(true);

        Papa.parse<ConfCSVRow>(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    showAlert('error', 'CSV Parse Error', `Failed to parse CSV: ${results.errors[0].message}`);
                    setIsValidating(false);
                    return;
                }

                const entries = results.data.map((row, idx) =>
                    parseConfCSVRow(row, idx + 2)
                );

                const batchDupes = findDuplicateConfTitles(entries);

                const validations = entries.map(entry =>
                    validateConfEntry(entry, batchDupes.has(entry.conferenceTitle.toLowerCase()))
                );

                setParsedEntries(entries);
                setValidationResults(validations);
                setCurrentStep('validation');

                const validCnt = validations.filter(v => v.isValid).length;
                const invalidCnt = validations.length - validCnt;

                if (batchDupes.size > 0) {
                    showAlert('warning', 'Duplicate Titles Detected',
                        `${[...batchDupes].join(', ')} appear more than once in the batch.`);
                } else {
                    showAlert(
                        invalidCnt === 0 ? 'success' : 'info',
                        'Validation Complete',
                        `${validCnt} valid, ${invalidCnt} invalid out of ${validations.length} conference rows.`
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

    // ── STEP 2: Remove entry ───────────────────────────────────
    const handleRemoveEntry = (rowNumber: number) => {
        setParsedEntries(p => p.filter(e => e.rowNumber !== rowNumber));
        setValidationResults(p => p.filter(v => v.rowNumber !== rowNumber));
    };

    // ── STEP 3: Confirm + start publishing ────────────────────
    const handleProceedToPublishing = () => {
        if (validCount === 0) {
            showAlert('error', 'No Valid Entries', 'Fix errors or upload a new CSV before proceeding.');
            return;
        }
        showAlert(
            'info', 'Confirm Upload',
            `You are about to upload ${validCount} conference(s).\n\nEstimated time: ${confFormatTime(estimatedMs)}\n\nDo you want to proceed?`,
            {
                showCancel: true,
                confirmText: 'Yes, Upload All',
                cancelText: 'Cancel',
                onConfirm: () => {
                    setAlertConfig(p => ({ ...p, isOpen: false }));
                    setCurrentStep('publishing');
                    startPublishing();
                },
            }
        );
    };

    const startPublishing = async () => {
        const validEntries = parsedEntries.filter(entry =>
            validationResults.find(v => v.rowNumber === entry.rowNumber)?.isValid
        );

        try {
            const result = await publishConferencesSequentially(validEntries, (progress) => {
                setPublishingProgress(progress);
            });
            setFinalResult(result);
            setCurrentStep('complete');
        } catch (err: any) {
            showAlert('error', 'Upload Failed', err?.message ?? 'Unexpected error during upload.');
        }
    };

    // ── Download final report ──────────────────────────────────
    const downloadReport = () => {
        if (!publishingProgress) return;
        const lines = [
            'Row,Conference Title,Status,Articles Created,Duration (s),Message',
            ...publishingProgress.logs.map(l =>
                `"${l.rowNumber}","${l.conferenceTitle.replace(/"/g, '""')}","${l.status}","${l.articlesCreated}","${(l.duration / 1000).toFixed(1)}","${l.message.replace(/"/g, '""')}"`
            )
        ];
        const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conference_bulk_report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ── Reset ──────────────────────────────────────────────────
    const handleReset = () => {
        setCurrentStep('upload');
        setCsvFile(null);
        setParsedEntries([]);
        setValidationResults([]);
        setPublishingProgress(null);
        setFinalResult(null);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    // ──────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────
    return (
        <div className="cbulk-page">
            {/* Header */}
            <div className="cbulk-header">
                <div>
                    <h1>🎓 Conference — Bulk Upload</h1>
                    <p>Upload a CSV file with one conference per row and all its articles inline.</p>
                </div>
                <button className="cbulk-back-btn" onClick={() => navigate('/dashboard/admin/conferences')}>
                    ← Back to Conferences
                </button>
            </div>

            {/* Step indicator */}
            <div className="cbulk-stepper">
                {['Upload CSV', 'Validate', 'Upload', 'Complete'].map((label, idx) => (
                    <React.Fragment key={label}>
                        <div className={`cbulk-step ${stepClass(idx)}`}>
                            <div className="cbulk-step-circle">{idx < stepIdx ? '✓' : idx + 1}</div>
                            <div className="cbulk-step-label">{label}</div>
                        </div>
                        {idx < 3 && (
                            <div className={`cbulk-step-connector ${idx < stepIdx ? 'cbulk-connector-done' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Card */}
            <div className="cbulk-card">

                {/* ════ STEP 1: Upload ════ */}
                {currentStep === 'upload' && (
                    <>
                        <p className="cbulk-card-title">Step 1 — Upload CSV</p>
                        <p className="cbulk-card-desc">
                            Download the template, fill in one row per conference with its articles
                            (article1Title…article1Authors…), then upload the CSV here.
                        </p>

                        {/* CSV section */}
                        <div className="cbulk-section">
                            <div className="cbulk-section-header">
                                <span className="cbulk-section-label">CSV File</span>
                                <button className="cbulk-template-btn" onClick={downloadConfCSVTemplate}>
                                    📥 Download Template
                                </button>
                            </div>

                            <input
                                ref={csvInputRef}
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={handleCsvSelect}
                            />
                            <div className="cbulk-csv-strip">
                                <button
                                    type="button"
                                    className="cbulk-csv-trigger"
                                    onClick={() => csvInputRef.current?.click()}
                                >
                                    📂 Choose CSV
                                </button>
                                <span className={`cbulk-csv-fname ${csvFile ? 'cbulk-has-file' : ''}`}>
                                    {csvFile ? csvFile.name : 'No file selected…'}
                                </span>
                                {csvFile && (
                                    <button className="cbulk-csv-clear" onClick={clearCsv} title="Clear">✕</button>
                                )}
                            </div>

                            <div className="cbulk-info-box">
                                <span>ℹ</span>
                                <div>
                                    <strong>CSV format:</strong> One conference per row. Articles are inlined as columns
                                    (<code>article1Title</code>, <code>article1Authors</code>, <code>article1Year</code>, … <code>article2Title</code>, …).
                                    Up to <strong>30 articles</strong> per conference.
                                    Download the template to see the exact column names.
                                </div>
                            </div>
                        </div>

                        <div className="cbulk-action-bar">
                            <span />
                            <button
                                className="cbulk-btn cbulk-btn-primary"
                                disabled={!csvFile || isValidating}
                                onClick={handleParseAndValidate}
                            >
                                {isValidating ? '⏳ Validating…' : 'Parse & Validate →'}
                            </button>
                        </div>
                    </>
                )}

                {/* ════ STEP 2: Validation ════ */}
                {currentStep === 'validation' && (
                    <>
                        <p className="cbulk-card-title">Step 2 — Review Validation Results</p>
                        <p className="cbulk-card-desc">
                            Review errors, click rows to expand details. Remove invalid entries or go back and fix the CSV.
                            Only valid rows will be uploaded.
                        </p>

                        <ConfBulkValidationTable
                            entries={parsedEntries}
                            validationResults={validationResults}
                            onRemoveEntry={handleRemoveEntry}
                        />

                        {validCount > 0 && (
                            <div className="cbulk-proceed-panel">
                                <div className="cbulk-estimate">
                                    <p><strong>Valid Conferences:</strong> {validCount}</p>
                                    <p><strong>Estimated Time:</strong> {confFormatTime(estimatedMs)}</p>
                                </div>
                                <button
                                    className="cbulk-btn cbulk-btn-success"
                                    onClick={handleProceedToPublishing}
                                >
                                    Upload {validCount} Valid Entr{validCount !== 1 ? 'ies' : 'y'} →
                                </button>
                            </div>
                        )}

                        <div className="cbulk-action-bar">
                            <button className="cbulk-btn cbulk-btn-secondary" onClick={handleReset}>
                                ← Start Over
                            </button>
                            <div />
                        </div>
                    </>
                )}

                {/* ════ STEP 3: Publishing ════ */}
                {currentStep === 'publishing' && publishingProgress && (
                    <>
                        <p className="cbulk-card-title">Step 3 — Uploading Conferences</p>
                        <p className="cbulk-card-desc">
                            Please keep this page open while the upload is in progress.
                        </p>
                        <ConfBulkProgressTracker progress={publishingProgress} />
                    </>
                )}

                {/* ════ STEP 4: Complete ════ */}
                {currentStep === 'complete' && publishingProgress && finalResult && (
                    <>
                        <p className="cbulk-card-title">Step 4 — Upload Complete</p>

                        <div className="cbulk-complete-wrap">
                            <span className="cbulk-complete-icon">
                                {finalResult.failureCount === 0 ? '🎉' : '⚠️'}
                            </span>
                            <p className="cbulk-complete-title">
                                {finalResult.failureCount === 0
                                    ? 'All conferences uploaded successfully!'
                                    : `${finalResult.successCount} of ${finalResult.successCount + finalResult.failureCount} uploaded`}
                            </p>
                            <p className="cbulk-complete-sub">
                                Total time: {confFormatTime(finalResult.totalTime)}
                                {finalResult.failureCount > 0 && (
                                    <> · {finalResult.failureCount} failed (see log below)</>
                                )}
                            </p>
                        </div>

                        <ConfBulkProgressTracker progress={publishingProgress} />

                        <div className="cbulk-complete-actions">
                            <button className="cbulk-btn cbulk-btn-primary"
                                onClick={() => navigate('/dashboard/admin/conferences')}>
                                View Conference Manager
                            </button>
                            <button className="cbulk-btn cbulk-btn-secondary" onClick={downloadReport}>
                                📥 Download Report CSV
                            </button>
                            <button className="cbulk-btn cbulk-btn-secondary" onClick={handleReset}>
                                Upload More
                            </button>
                        </div>
                    </>
                )}
            </div>

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(p => ({ ...p, isOpen: false }))}
                showCancel={alertConfig.showCancel}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
            />
        </div>
    );
};

export default ConferenceBulkUpload;
