/**
 * ConfBulkProgressTracker.tsx
 *
 * Live progress display during and after a conference bulk upload.
 */
import React from 'react';
import type { ConfPublishingProgress } from './confBulkPublisher';
import { confFormatTime } from './confBulkPublisher';

interface Props {
    progress: ConfPublishingProgress;
}

const ConfBulkProgressTracker: React.FC<Props> = ({ progress }) => {
    const { total, completed, failed, current, elapsed, remaining, logs } = progress;
    const successCount = completed - failed;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isDone = completed >= total;

    return (
        <div className="cbulk-progress-wrap">
            {/* Counters */}
            <div className="cbulk-progress-counters">
                <div className="cbulk-counter cbulk-counter-total">
                    <div className="cbulk-counter-num">{total}</div>
                    <div className="cbulk-counter-label">Total</div>
                </div>
                <div className="cbulk-counter cbulk-counter-done">
                    <div className="cbulk-counter-num">{completed}</div>
                    <div className="cbulk-counter-label">Processed</div>
                </div>
                <div className="cbulk-counter cbulk-counter-ok">
                    <div className="cbulk-counter-num">{successCount}</div>
                    <div className="cbulk-counter-label">Success</div>
                </div>
                <div className="cbulk-counter cbulk-counter-fail">
                    <div className="cbulk-counter-num">{failed}</div>
                    <div className="cbulk-counter-label">Failed</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="cbulk-progress-bar-wrap">
                <div
                    className={`cbulk-progress-bar ${isDone ? (failed > 0 ? 'cbulk-bar-warn' : 'cbulk-bar-success') : 'cbulk-bar-active'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="cbulk-progress-pct">{pct}%</div>

            {/* Time info */}
            <div className="cbulk-progress-time">
                <span>Elapsed: {confFormatTime(elapsed)}</span>
                {!isDone && remaining > 0 && (
                    <span>· Remaining: ~{confFormatTime(remaining)}</span>
                )}
            </div>

            {/* Current item */}
            {current && (
                <div className="cbulk-progress-current">
                    ⏳ Publishing: <strong>{current}</strong>
                </div>
            )}

            {/* Log */}
            {logs.length > 0 && (
                <div className="cbulk-log-wrap">
                    <div className="cbulk-log-header">Publishing Log</div>
                    <div className="cbulk-log-body">
                        {logs.map(log => (
                            <div
                                key={log.rowNumber}
                                className={`cbulk-log-row ${log.status === 'success' ? 'cbulk-log-ok' : 'cbulk-log-err'}`}
                            >
                                <span className="cbulk-log-icon">
                                    {log.status === 'success' ? '✓' : '✕'}
                                </span>
                                <div className="cbulk-log-detail">
                                    <div className="cbulk-log-title">
                                        Row {log.rowNumber}: {log.conferenceTitle}
                                    </div>
                                    <div className="cbulk-log-msg">
                                        {log.message}
                                        {log.status === 'success' && (
                                            <span className="cbulk-log-art"> · {log.articlesCreated} article(s) created</span>
                                        )}
                                        <span className="cbulk-log-time"> ({confFormatTime(log.duration)})</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfBulkProgressTracker;
