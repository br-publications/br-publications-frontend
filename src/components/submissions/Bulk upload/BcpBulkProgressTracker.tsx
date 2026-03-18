import React, { useEffect, useRef } from 'react';
import type { BcpPublishingProgress } from './bcpBulkPublisher';
import { bcpFormatTime, bcpCalculateETA } from './bcpBulkPublisher';
import './bookChapterBulkUpload.css';

interface BcpBulkProgressTrackerProps {
    progress: BcpPublishingProgress;
}

const BcpBulkProgressTracker: React.FC<BcpBulkProgressTrackerProps> = ({ progress }) => {
    const logRef = useRef<HTMLDivElement>(null);

    // Auto-scroll log to bottom
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [progress.logs.length]);

    const percentage =
        progress.total > 0
            ? Math.round((progress.completed / progress.total) * 100)
            : 0;

    const successCount = progress.completed - progress.failed;

    return (
        <div className="bcp-bulk-progress-wrap">
            {/* ── Progress bar ── */}
            <div>
                <div className="bcp-bulk-progress-head">
                    <h3>Publishing Progress</h3>
                    <span className="bcp-bulk-progress-pct">{percentage}%</span>
                </div>

                <div className="bcp-bulk-progress-track">
                    <div
                        className="bcp-bulk-progress-fill"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* ── Stats grid ── */}
                <div className="bcp-bulk-stats-grid">
                    <div className="bcp-bulk-stat-card">
                        <span className="bcp-bulk-stat-lbl">Total</span>
                        <span className="bcp-bulk-stat-num">{progress.total}</span>
                    </div>
                    <div className="bcp-bulk-stat-card">
                        <span className="bcp-bulk-stat-lbl">Completed</span>
                        <span className="bcp-bulk-stat-num">{progress.completed}</span>
                    </div>
                    <div className="bcp-bulk-stat-card">
                        <span className="bcp-bulk-stat-lbl">Success</span>
                        <span className="bcp-bulk-stat-num bcp-bulk-ok">{successCount}</span>
                    </div>
                    <div className="bcp-bulk-stat-card">
                        <span className="bcp-bulk-stat-lbl">Failed</span>
                        <span className="bcp-bulk-stat-num bcp-bulk-err">{progress.failed}</span>
                    </div>
                </div>
            </div>

            {/* ── Time tracking ── */}
            <div className="bcp-bulk-time-grid">
                <div className="bcp-bulk-time-item">
                    <span className="bcp-bulk-time-lbl">Elapsed</span>
                    <span className="bcp-bulk-time-val">{bcpFormatTime(progress.elapsed)}</span>
                </div>
                <div className="bcp-bulk-time-item">
                    <span className="bcp-bulk-time-lbl">Remaining</span>
                    <span className="bcp-bulk-time-val">{bcpFormatTime(progress.remaining)}</span>
                </div>
                <div className="bcp-bulk-time-item">
                    <span className="bcp-bulk-time-lbl">ETA</span>
                    <span className="bcp-bulk-time-val">{bcpCalculateETA(progress.remaining)}</span>
                </div>
            </div>

            {/* ── Currently publishing ── */}
            {progress.current && (
                <div className="bcp-bulk-current-banner">
                    <div className="bcp-bulk-spinner" />
                    <span>
                        Publishing: <strong>{progress.current}</strong>
                    </span>
                </div>
            )}

            {/* ── Log ── */}
            <div className="bcp-bulk-log-section">
                <p className="bcp-bulk-log-title">Publishing Log</p>
                <div className="bcp-bulk-log-box" ref={logRef}>
                    {progress.logs.length === 0 ? (
                        <p className="bcp-bulk-log-empty">No logs yet…</p>
                    ) : (
                        progress.logs.map((log, i) => (
                            <div
                                key={`${log.rowNumber}-${i}`}
                                className={`bcp-bulk-log-entry ${log.status === 'success'
                                        ? 'bcp-bulk-log-ok'
                                        : 'bcp-bulk-log-err'
                                    }`}
                            >
                                <div className="bcp-bulk-log-head">
                                    <span className="bcp-bulk-log-row">Row {log.rowNumber}</span>
                                    <span className="bcp-bulk-log-book">{log.bookTitle}</span>
                                    <span
                                        className={`bcp-bulk-log-icon ${log.status === 'success'
                                                ? 'bcp-bulk-ok'
                                                : 'bcp-bulk-err'
                                            }`}
                                    >
                                        {log.status === 'success' ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="bcp-bulk-log-foot">
                                    <span>{log.message}</span>
                                    <span>{bcpFormatTime(log.duration)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BcpBulkProgressTracker;
