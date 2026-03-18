import React, { useState, useEffect } from 'react';
import type { ParsedChapterEntry, ChapterValidationResult } from './bcpBulkValidator';
import { VALID_CATEGORIES } from './bcpBulkValidator';
import './bookChapterBulkUpload.css';

// ────────────────────────────────────────────────────────────
// Types (mirrored from bcpBulkValidator so the table is
// self-contained — the actual shapes come from the validator)
// ────────────────────────────────────────────────────────────

interface BcpBulkValidationTableProps {
    entries: ParsedChapterEntry[];
    validationResults: ChapterValidationResult[];
    onRemoveEntry: (rowNumber: number) => void;
    /** Opens the cropper for this row's matched cover image */
    onCrop: (rowNumber: number) => void;
    /** Called when the user changes the category from the inline dropdown */
    onUpdateCategory: (rowNumber: number, newCategory: string) => void;
}

type FilterType = 'all' | 'valid' | 'invalid';

// ────────────────────────────────────────────────────────────
// Lazy cover preview — avoids rendering all ObjectURLs at once
// ────────────────────────────────────────────────────────────
const CoverPreview: React.FC<{ file: File }> = ({ file }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return null;
    return (
        <img
            src={url}
            alt="Cover preview"
            className="bcp-bulk-cover-thumb"
        />
    );
};

// ────────────────────────────────────────────────────────────
// Main table
// ────────────────────────────────────────────────────────────
const BcpBulkValidationTable: React.FC<BcpBulkValidationTableProps> = ({
    entries,
    validationResults,
    onRemoveEntry,
    onCrop,
    onUpdateCategory,
}) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const validCount = validationResults.filter((r) => r.isValid).length;
    const invalidCount = validationResults.filter((r) => !r.isValid).length;

    const filtered = validationResults.filter((r) => {
        if (filter === 'valid') return r.isValid;
        if (filter === 'invalid') return !r.isValid;
        return true;
    });

    const getEntry = (row: number) =>
        entries.find((e) => e.rowNumber === row);

    const toggleExpand = (row: number) =>
        setExpandedRow(expandedRow === row ? null : row);

    return (
        <div className="bcp-bulk-val-wrap">
            {/* ── Summary bar ── */}
            <div className="bcp-bulk-val-summary">
                <span className="bcp-bulk-val-title">
                    Validation Results — {validationResults.length} entries
                </span>
                <div className="bcp-bulk-badges">
                    <span className="bcp-bulk-badge bcp-bulk-badge-ok">
                        ✓ {validCount} Valid
                    </span>
                    <span className="bcp-bulk-badge bcp-bulk-badge-err">
                        ✗ {invalidCount} Invalid
                    </span>
                    <span className="bcp-bulk-badge">
                        {validationResults.length} Total
                    </span>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="bcp-bulk-filters">
                {(['all', 'valid', 'invalid'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        className={`bcp-bulk-filter-btn ${filter === f ? 'bcp-bulk-filter-active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' && `All (${validationResults.length})`}
                        {f === 'valid' && `Valid (${validCount})`}
                        {f === 'invalid' && `Invalid (${invalidCount})`}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            <div className="bcp-bulk-table-scroll">
                <table className="bcp-bulk-table">
                    <thead>
                        <tr>
                            <th>Row</th>
                            <th className="bcp-bulk-cover-cell">Cover</th>
                            <th>Book Title</th>
                            <th>Main Author</th>
                            <th>ISBN</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="bcp-bulk-table-empty">
                                    No entries match the selected filter
                                </td>
                            </tr>
                        ) : (
                            filtered.map((result) => {
                                const entry = getEntry(result.rowNumber);
                                if (!entry) return null;

                                const isExpanded = expandedRow === result.rowNumber;
                                const errorCount = Object.keys(result.errors).length;

                                return (
                                    <React.Fragment key={result.rowNumber}>
                                        {/* ── Data row ── */}
                                        <tr
                                            className={`bcp-bulk-table-row ${!result.isValid ? 'bcp-bulk-row-invalid' : ''
                                                }`}
                                        >
                                            <td>{result.rowNumber}</td>

                                            {/* Cover thumbnail */}
                                            <td>
                                                {entry.matchedCoverImage ? (
                                                    <div className="bcp-bulk-cover-wrap">
                                                        <CoverPreview file={entry.matchedCoverImage} />
                                                        <button
                                                            className="bcp-bulk-crop-link"
                                                            onClick={() => onCrop(result.rowNumber)}
                                                            title="Crop this cover image"
                                                        >
                                                            ✂ Crop
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="bcp-bulk-cell-na">—</span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="bcp-bulk-cell-clip" title={entry.bookTitle}>
                                                    {entry.bookTitle || (
                                                        <span className="bcp-bulk-cell-na">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="bcp-bulk-cell-clip">
                                                    {entry.mainAuthor.firstName}{' '}
                                                    {entry.mainAuthor.lastName}
                                                    {entry.coAuthorsData.length > 0 && (
                                                        <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>
                                                            +{entry.coAuthorsData.length} Co-Author{entry.coAuthorsData.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="bcp-bulk-cell-clip">
                                                    {entry.isbn || (
                                                        <span className="bcp-bulk-cell-na">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <select
                                                    className={`bcp-bulk-category-select${result.errors['category'] ? ' bcp-bulk-category-invalid' : ''
                                                        }`}
                                                    value={entry.category || ''}
                                                    onChange={(e) => onUpdateCategory(result.rowNumber, e.target.value)}
                                                    title="Select a valid category"
                                                >
                                                    {!VALID_CATEGORIES.includes(entry.category as any) && entry.category && (
                                                        <option value={entry.category} disabled>
                                                            ⚠ {entry.category} (invalid)
                                                        </option>
                                                    )}
                                                    {!entry.category && (
                                                        <option value="" disabled>— Select category —</option>
                                                    )}
                                                    {VALID_CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                {result.isValid ? (
                                                    <span className="bcp-bulk-status bcp-bulk-status-ok">
                                                        ✓ Valid
                                                    </span>
                                                ) : (
                                                    <span className="bcp-bulk-status bcp-bulk-status-err">
                                                        ✗ {errorCount} error{errorCount !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="bcp-bulk-row-actions">
                                                    {!result.isValid && (
                                                        <button
                                                            className="bcp-bulk-action-btn"
                                                            onClick={() => toggleExpand(result.rowNumber)}
                                                        >
                                                            {isExpanded ? 'Hide' : 'Errors'}
                                                        </button>
                                                    )}
                                                    <button
                                                        className="bcp-bulk-action-btn bcp-bulk-action-del"
                                                        onClick={() => onRemoveEntry(result.rowNumber)}
                                                        title="Remove this entry"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* ── Expanded errors ── */}
                                        {isExpanded && !result.isValid && (
                                            <tr className="bcp-bulk-expand-row">
                                                <td colSpan={8}>
                                                    <div className="bcp-bulk-expand-box">
                                                        <h4>
                                                            Errors — Row {result.rowNumber}:
                                                        </h4>
                                                        <ul className="bcp-bulk-err-list">
                                                            {Object.entries(result.errors).map(
                                                                ([field, msg]) => (
                                                                    <li
                                                                        key={field}
                                                                        className="bcp-bulk-err-item"
                                                                    >
                                                                        <strong>{field}:</strong>{' '}
                                                                        {msg as string}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                        {result.warnings.length > 0 && (
                                                            <>
                                                                <h4>Warnings:</h4>
                                                                <ul className="bcp-bulk-warn-list">
                                                                    {result.warnings.map(
                                                                        (w: string, i: number) => (
                                                                            <li
                                                                                key={i}
                                                                                className="bcp-bulk-warn-item"
                                                                            >
                                                                                {w}
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BcpBulkValidationTable;
