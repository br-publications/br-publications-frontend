import React, { useEffect, useRef } from 'react';
import type { PublishingProgress } from '../../../../utils/bulkPublisher';
import { formatTime, calculateETA } from '../../../../utils/bulkPublisher';
import '../textBookBulkUpload.css';

interface PublishingProgressTrackerProps {
    progress: PublishingProgress;
}

const PublishingProgressTracker: React.FC<PublishingProgressTrackerProps> = ({ progress }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [progress.logs.length]);

    const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    const successCount = progress.completed - progress.failed;

    return (
        <div className="textBookBulk-progress-container">
            {/* Progress Bar */}
            <div className="textBookBulk-progress-section">
                <div className="textBookBulk-progress-header">
                    <h3>Publishing Progress</h3>
                    <span className="textBookBulk-progress-percentage">{percentage}%</span>
                </div>

                <div className="textBookBulk-progress-bar-container">
                    <div
                        className="textBookBulk-progress-bar-fill"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="textBookBulk-progress-stats">
                    <div className="textBookBulk-stat">
                        <span className="textBookBulk-stat-label">Total:</span>
                        <span className="textBookBulk-stat-value">{progress.total}</span>
                    </div>
                    <div className="textBookBulk-stat">
                        <span className="textBookBulk-stat-label">Completed:</span>
                        <span className="textBookBulk-stat-value textBookBulk-stat-success">{progress.completed}</span>
                    </div>
                    <div className="textBookBulk-stat">
                        <span className="textBookBulk-stat-label">Success:</span>
                        <span className="textBookBulk-stat-value textBookBulk-stat-success">{successCount}</span>
                    </div>
                    <div className="textBookBulk-stat">
                        <span className="textBookBulk-stat-label">Failed:</span>
                        <span className="textBookBulk-stat-value textBookBulk-stat-error">{progress.failed}</span>
                    </div>
                </div>
            </div>

            {/* Time Tracking */}
            <div className="textBookBulk-time-section">
                <div className="textBookBulk-time-item">
                    <span className="textBookBulk-time-label">Elapsed:</span>
                    <span className="textBookBulk-time-value">{formatTime(progress.elapsed)}</span>
                </div>
                <div className="textBookBulk-time-item">
                    <span className="textBookBulk-time-label">Remaining:</span>
                    <span className="textBookBulk-time-value">{formatTime(progress.remaining)}</span>
                </div>
                <div className="textBookBulk-time-item">
                    <span className="textBookBulk-time-label">ETA:</span>
                    <span className="textBookBulk-time-value">{calculateETA(progress.remaining)}</span>
                </div>
            </div>

            {/* Current Book */}
            {progress.current && (
                <div className="textBookBulk-current-book">
                    <div className="textBookBulk-spinner" />
                    <span>Publishing: <strong>{progress.current}</strong></span>
                </div>
            )}

            {/* Publishing Log */}
            <div className="textBookBulk-log-section">
                <h4>Publishing Log</h4>
                <div className="textBookBulk-log-container" ref={logContainerRef}>
                    {progress.logs.length === 0 ? (
                        <p className="textBookBulk-log-empty">No logs yet...</p>
                    ) : (
                        progress.logs.map((log, index) => (
                            <div
                                key={`${log.rowNumber}-${index}`}
                                className={`textBookBulk-log-entry ${log.status === 'success'
                                    ? 'textBookBulk-log-success'
                                    : 'textBookBulk-log-error'
                                    }`}
                            >
                                <div className="textBookBulk-log-header">
                                    <span className="textBookBulk-log-row">Row {log.rowNumber}</span>
                                    <span className="textBookBulk-log-title">{log.bookTitle}</span>
                                    <span className={`textBookBulk-log-status ${log.status === 'success'
                                        ? 'textBookBulk-status-success'
                                        : 'textBookBulk-status-error'
                                        }`}>
                                        {log.status === 'success' ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="textBookBulk-log-details">
                                    <span className="textBookBulk-log-message">{log.message}</span>
                                    <span className="textBookBulk-log-duration">
                                        {formatTime(log.duration)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublishingProgressTracker;
