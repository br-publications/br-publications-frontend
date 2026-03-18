import React, { useState } from 'react';
import type { ParsedBookEntry, ValidationResult } from '../../../../utils/bulkUploadValidator';
import '../textBookBulkUpload.css';

interface BulkUploadValidationTableProps {
    entries: ParsedBookEntry[];
    validationResults: ValidationResult[];
    onRemoveEntry: (rowNumber: number) => void;
    onCrop: (rowNumber: number) => void;
}

type FilterType = 'all' | 'valid' | 'invalid';

const CoverImagePreview: React.FC<{ file: File }> = ({ file }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    React.useEffect(() => {
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    if (!previewUrl) return null;

    return (
        <img
            src={previewUrl}
            alt="Cover"
            className="textBookBulk-cover-thumbnail"
        />
    );
};

const BulkUploadValidationTable: React.FC<BulkUploadValidationTableProps> = ({
    entries,
    validationResults,
    onRemoveEntry,
    onCrop
}) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Filter results based on selected filter
    const filteredResults = validationResults.filter(result => {
        if (filter === 'valid') return result.isValid;
        if (filter === 'invalid') return !result.isValid;
        return true;
    });

    const validCount = validationResults.filter(r => r.isValid).length;
    const invalidCount = validationResults.filter(r => !r.isValid).length;

    const toggleExpand = (rowNumber: number) => {
        setExpandedRow(expandedRow === rowNumber ? null : rowNumber);
    };

    const getEntry = (rowNumber: number): ParsedBookEntry | undefined => {
        return entries.find(e => e.rowNumber === rowNumber);
    };

    return (
        <div className="textBookBulk-validation-container">
            {/* Summary */}
            <div className="textBookBulk-validation-summary">
                <h3>Validation Results</h3>
                <div className="textBookBulk-validation-stats">
                    <span className="textBookBulk-stat-badge textBookBulk-stat-success">
                        {validCount} Valid
                    </span>
                    <span className="textBookBulk-stat-badge textBookBulk-stat-error">
                        {invalidCount} Invalid
                    </span>
                    <span className="textBookBulk-stat-badge">
                        {validationResults.length} Total
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="textBookBulk-validation-filters">
                <button
                    className={`textBookBulk-filter-button ${filter === 'all' ? 'textBookBulk-filter-active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({validationResults.length})
                </button>
                <button
                    className={`textBookBulk-filter-button ${filter === 'valid' ? 'textBookBulk-filter-active' : ''}`}
                    onClick={() => setFilter('valid')}
                >
                    Valid Only ({validCount})
                </button>
                <button
                    className={`textBookBulk-filter-button ${filter === 'invalid' ? 'textBookBulk-filter-active' : ''}`}
                    onClick={() => setFilter('invalid')}
                >
                    Invalid Only ({invalidCount})
                </button>
            </div>

            {/* Table */}
            <div className="textBookBulk-table-container">
                <table className="textBookBulk-table">
                    <thead>
                        <tr>
                            <th>Row</th>
                            <th>Cover</th>
                            <th>Book Title</th>
                            <th>Main Author</th>
                            <th>ISBN</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredResults.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="textBookBulk-table-empty">
                                    No entries match the selected filter
                                </td>
                            </tr>
                        ) : (
                            filteredResults.map(result => {
                                const entry = getEntry(result.rowNumber);
                                if (!entry) return null;

                                const isExpanded = expandedRow === result.rowNumber;
                                const errorCount = Object.keys(result.errors).length;

                                return (
                                    <React.Fragment key={result.rowNumber}>
                                        <tr className={`textBookBulk-table-row ${!result.isValid ? 'textBookBulk-row-error' : ''}`}>
                                            <td>{result.rowNumber}</td>
                                            <td>
                                                <div className="textBookBulk-cell-cover">
                                                    {entry.matchedCoverImage ? (
                                                        <div className="textBookBulk-cover-preview">
                                                            <CoverImagePreview file={entry.matchedCoverImage} />
                                                            <button
                                                                className="textBookBulk-action-link"
                                                                onClick={() => onCrop(result.rowNumber)}
                                                                title="Crop Image"
                                                            >
                                                                Crop
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="textBookBulk-empty-value">Missing</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="textBookBulk-cell-content">
                                                    {entry.bookTitle || <span className="textBookBulk-empty-value">—</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="textBookBulk-cell-content">
                                                    <div>{entry.mainAuthor.firstName} {entry.mainAuthor.lastName}</div>
                                                    {entry.mainAuthor.phoneNumber && (
                                                        <div className="textBookBulk-cell-subtext">{entry.mainAuthor.phoneNumber}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="textBookBulk-cell-content">
                                                    {entry.isbn || <span className="textBookBulk-empty-value">—</span>}
                                                </div>
                                            </td>
                                            <td>
                                                {result.isValid ? (
                                                    <span className="textBookBulk-status-badge textBookBulk-status-valid">
                                                        ✓ Valid
                                                    </span>
                                                ) : (
                                                    <span className="textBookBulk-status-badge textBookBulk-status-invalid">
                                                        ✗ {errorCount} Error{errorCount !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="textBookBulk-actions">
                                                    {!result.isValid && (
                                                        <button
                                                            className="textBookBulk-action-button"
                                                            onClick={() => toggleExpand(result.rowNumber)}
                                                            title="View errors"
                                                        >
                                                            {isExpanded ? 'Hide' : 'View'} Errors
                                                        </button>
                                                    )}
                                                    <button
                                                        className="textBookBulk-action-button textBookBulk-action-remove"
                                                        onClick={() => onRemoveEntry(result.rowNumber)}
                                                        title="Remove entry"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Error Details */}
                                        {isExpanded && !result.isValid && (
                                            <tr className="textBookBulk-error-row">
                                                <td colSpan={7}>
                                                    <div className="textBookBulk-error-details">
                                                        <h4>Errors for Row {result.rowNumber}:</h4>
                                                        <ul className="textBookBulk-error-list">
                                                            {Object.entries(result.errors).map(([field, message]) => (
                                                                <li key={field} className="textBookBulk-error-item">
                                                                    <strong>{field}:</strong> {message}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {result.warnings.length > 0 && (
                                                            <>
                                                                <h4>Warnings:</h4>
                                                                <ul className="textBookBulk-warning-list">
                                                                    {result.warnings.map((warning: string, idx: number) => (
                                                                        <li key={idx} className="textBookBulk-warning-item">
                                                                            {warning}
                                                                        </li>
                                                                    ))}
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

export default BulkUploadValidationTable;
