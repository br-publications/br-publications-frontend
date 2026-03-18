/**
 * ConfBulkValidationTable.tsx
 *
 * Displays validation results for all parsed conference rows.
 * Each row expands to show per-article info and any errors/warnings.
 */
import React, { useState } from 'react';
import type { ParsedConfEntry, ConfValidationResult } from './confBulkValidator';

interface Props {
    entries: ParsedConfEntry[];
    validationResults: ConfValidationResult[];
    onRemoveEntry: (rowNumber: number) => void;
}

const ConfBulkValidationTable: React.FC<Props> = ({ entries, validationResults, onRemoveEntry }) => {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggle = (rn: number) =>
        setExpanded(s => {
            const n = new Set(s);
            n.has(rn) ? n.delete(rn) : n.add(rn);
            return n;
        });

    if (entries.length === 0) {
        return <p className="bcp-bulk-card-desc">No entries parsed.</p>;
    }

    const validCount = validationResults.filter(v => v.isValid).length;
    const invalidCount = validationResults.length - validCount;

    return (
        <div className="cbulk-table-wrap">
            {/* Summary bar */}
            <div className="cbulk-summary-bar">
                <span className="cbulk-badge cbulk-badge-valid">✓ {validCount} valid</span>
                {invalidCount > 0 && (
                    <span className="cbulk-badge cbulk-badge-invalid">✕ {invalidCount} invalid</span>
                )}
                <span className="cbulk-badge cbulk-badge-total">{entries.length} total</span>
            </div>

            <table className="cbulk-table">
                <thead>
                    <tr>
                        <th style={{ width: 36 }}>Row</th>
                        <th>Conference Title</th>
                        <th>Publisher</th>
                        <th style={{ width: 60 }}>Type</th>
                        <th style={{ width: 56, textAlign: 'center' }}>Articles</th>
                        <th style={{ width: 70, textAlign: 'center' }}>Status</th>
                        <th style={{ width: 80 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(entry => {
                        const result = validationResults.find(v => v.rowNumber === entry.rowNumber);
                        const isValid = result?.isValid ?? false;
                        const hasWarnings = (result?.warnings.length ?? 0) > 0;
                        const errorCount = Object.keys(result?.errors ?? {}).length;
                        const isExp = expanded.has(entry.rowNumber);

                        return (
                            <React.Fragment key={entry.rowNumber}>
                                <tr
                                    className={`cbulk-row ${isValid ? 'cbulk-row-valid' : 'cbulk-row-invalid'} ${isExp ? 'cbulk-row-expanded' : ''}`}
                                    onClick={() => toggle(entry.rowNumber)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td className="cbulk-td-mono">{entry.rowNumber}</td>
                                    <td>
                                        <span className="cbulk-title">
                                            {entry.conferenceTitle || <em className="cbulk-empty">—</em>}
                                        </span>
                                    </td>
                                    <td className="cbulk-td-sm">{entry.publisher || '—'}</td>
                                    <td className="cbulk-td-sm">
                                        <span className="cbulk-type-badge">{entry.type || '—'}</span>
                                    </td>
                                    <td className="cbulk-td-center">
                                        <strong>{entry.articles.length}</strong>
                                    </td>
                                    <td className="cbulk-td-center">
                                        {isValid ? (
                                            <span className="cbulk-status cbulk-ok">
                                                ✓ Valid{hasWarnings ? ' ⚠' : ''}
                                            </span>
                                        ) : (
                                            <span className="cbulk-status cbulk-err">
                                                ✕ {errorCount} error{errorCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <button
                                            className="cbulk-remove-btn"
                                            onClick={() => onRemoveEntry(entry.rowNumber)}
                                            title="Remove this entry"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>

                                {/* Expanded detail row */}
                                {isExp && (
                                    <tr className="cbulk-detail-row">
                                        <td colSpan={7}>
                                            <div className="cbulk-detail-inner">
                                                {/* Errors */}
                                                {errorCount > 0 && (
                                                    <div className="cbulk-detail-section">
                                                        <div className="cbulk-detail-label cbulk-label-err">Errors</div>
                                                        <ul className="cbulk-err-list">
                                                            {Object.entries(result!.errors).map(([k, v]) => (
                                                                <li key={k}><strong>{k}:</strong> {v}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Warnings */}
                                                {hasWarnings && (
                                                    <div className="cbulk-detail-section">
                                                        <div className="cbulk-detail-label cbulk-label-warn">Warnings</div>
                                                        <ul className="cbulk-warn-list">
                                                            {result!.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Conference info */}
                                                <div className="cbulk-detail-section">
                                                    <div className="cbulk-detail-label">Conference Info</div>
                                                    <div className="cbulk-info-grid">
                                                        <div><span>Code</span> {entry.code || '—'}</div>
                                                        <div><span>ISSN</span> {entry.issn || '—'}</div>
                                                        <div><span>DOI</span> {entry.doi || '—'}</div>
                                                        <div><span>Date</span> {entry.publishedDate || entry.dateRange || '—'}</div>
                                                        <div><span>Location</span> {entry.location || '—'}</div>
                                                        <div><span>Active</span> {entry.isActive ? 'Yes' : 'No'}</div>
                                                    </div>
                                                </div>

                                                {/* Articles */}
                                                {entry.articles.length > 0 && (
                                                    <div className="cbulk-detail-section">
                                                        <div className="cbulk-detail-label">Articles ({entry.articles.length})</div>
                                                        <div className="cbulk-art-list">
                                                            {entry.articles.map((art, i) => (
                                                                <div key={i} className="cbulk-art-item">
                                                                    <span className="cbulk-art-num">{i + 1}</span>
                                                                    <div>
                                                                        <div className="cbulk-art-title">{art.title}</div>
                                                                        <div className="cbulk-art-meta">
                                                                            {art.authorsRaw && <span>{art.authorsRaw}</span>}
                                                                            {art.year && <span>· {art.year}</span>}
                                                                            {art.pages && <span>· pp. {art.pages}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ConfBulkValidationTable;
