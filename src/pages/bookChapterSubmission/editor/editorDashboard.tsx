import React, { useState, useMemo, useCallback } from 'react';
import { Filter, TrendingUp } from 'lucide-react';
import { useEditorAssignedSubmissions, useSubmissionFilters } from '../../../utils/bookChapterSubmission.hooks';
import { bookChapterEditorService } from '../../../services/bookChapterSumission.service';
import EditorSubmissionCard from './editorSubmissionCard';
import EditorFilterPanel from './editorFilterPanel';
import EditorSubmissionDetailView from './editorSubmissionDetailView';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import type { BookChapterSubmission, SubmissionStatus } from '../../../types/submissionTypes';
import { CardSkeleton } from '../common/ui/skeletons';
import styles from './editorDashboard.module.css';

type EditorTab = 'assigned' | 'reviewing' | 'active' | 'completed';

/**
 * Status grouping for Editor Dashboard tabs
 */
const TAB_STATUS_MAPPING: Record<EditorTab, SubmissionStatus[]> = {
    assigned: [
        'ABSTRACT_SUBMITTED',
        'MANUSCRIPTS_PENDING',
    ],
    reviewing: [
        'REVIEWER_ASSIGNMENT',
        'UNDER_REVIEW',
        'EDITORIAL_REVIEW',
    ],
    active: [
        'APPROVED',
        'ISBN_APPLIED',
        'PUBLICATION_IN_PROGRESS',
    ],
    completed: [
        'PUBLISHED',
        'REJECTED',
        'WITHDRAWN' as SubmissionStatus,
    ],
};

export const EditorDashboard: React.FC = () => {
    const { submissions, isLoading, error, refetch } = useEditorAssignedSubmissions(1, 20);
    const { filters, updateFilters } = useSubmissionFilters();

    const [activeTab, setActiveTab] = useState<EditorTab>('assigned');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<BookChapterSubmission | null>(null);
    const [initialDetailTab, setInitialDetailTab] = useState<'overview' | 'discussions' | 'workflow' | 'history' | 'actions' | 'reviewers'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
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

    const handleViewDetails = (submission: BookChapterSubmission, tab: 'overview' | 'discussions' | 'workflow' | 'history' | 'actions' | 'reviewers' = 'overview') => {
        setInitialDetailTab(tab);
        setSelectedSubmission(submission);
    };

    // Keep selectedSubmission in sync with submissions list (for status updates)
    React.useEffect(() => {
        if (selectedSubmission) {
            const updated = submissions.find(s => s.id === selectedSubmission.id);
            // Shallow comparison - only update if status or key fields changed
            if (updated && (updated.status !== selectedSubmission.status || updated.updatedAt !== selectedSubmission.updatedAt)) {
                setSelectedSubmission(updated);
            }
        }
    }, [submissions, selectedSubmission]);

    // Background polling for live data updates
    React.useEffect(() => {
        const intervalId = setInterval(() => {
            refetch(true); // silent fetch
        }, 45000); // 45 seconds

        return () => clearInterval(intervalId);
    }, [refetch]);

    // Memoize filtered submissions to avoid recalculating on every render
    const filteredSubmissions = useMemo((): BookChapterSubmission[] => {
        let filtered = submissions;
        const tabStatuses = TAB_STATUS_MAPPING[activeTab];
        filtered = filtered.filter(s => tabStatuses.includes(s.status));

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.bookTitle.toLowerCase().includes(query) ||
                s.mainAuthor.firstName.toLowerCase().includes(query) ||
                s.mainAuthor.lastName.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [submissions, activeTab, searchQuery]);

    // Memoize stats calculation to avoid recalculating on every render
    const stats = useMemo(() => {
        return {
            assigned: submissions.filter(s => TAB_STATUS_MAPPING.assigned.includes(s.status)).length,
            reviewing: submissions.filter(s => TAB_STATUS_MAPPING.reviewing.includes(s.status)).length,
            active: submissions.filter(s => TAB_STATUS_MAPPING.active.includes(s.status)).length,
            completed: submissions.filter(s => TAB_STATUS_MAPPING.completed.includes(s.status)).length,
        };
    }, [submissions]);

    /**
     * Make editorial decision using the correct service method
     * Memoized to prevent unnecessary re-renders of child components
     */
    const handleMakeDecision = useCallback(async (submissionId: number, decision: 'accept' | 'reject', notes?: string) => {
        try {
            if (decision === 'accept') {
                await bookChapterEditorService.acceptAbstract(submissionId, { notes: notes || '' });
            } else {
                await bookChapterEditorService.makeEditorDecision(submissionId, {
                    decision,
                    notes: notes || '',
                });
            }
            // Show alert then reload window to firmly reset UI state
            setAlert({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: `Abstract ${decision}ed successfully.`,
            });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            console.error('Error making decision:', error);

            const isConflict = error?.status === 409 || error?.message?.toLowerCase().includes('already');
            const errorMessage = error?.message || 'Failed to make decision. Please try again.';

            setAlert({
                isOpen: true,
                type: 'error',
                title: isConflict ? 'Conflict' : 'Error',
                message: errorMessage
            });

            if (isConflict) {
                setTimeout(() => {
                    window.location.reload();
                }, 2500);
            }
        }
    }, [refetch]);


    const handleMakeFinalDecision = useCallback(async (submissionId: number, decision: 'approve' | 'reject', notes?: string) => {
        try {
            await bookChapterEditorService.makeFinalDecision(submissionId, {
                decision,
                notes: notes || '',
            });

            // On success, show an alert and reload
            setAlert({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: `Final decision (${decision}) submitted successfully.`,
            });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            console.error('Error making final decision:', error);

            // Check if it's a 409 Conflict (concurrency error)
            const isConflict = error?.status === 409 || error?.response?.status === 409 || error?.message?.includes('already taken');
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to make final decision. Please try again.';

            setAlert({
                isOpen: true,
                type: 'error',
                title: isConflict ? 'Conflict' : 'Error',
                message: errorMessage
            });

            // If it's a conflict, reload the page after a short delay so the user sees the latest state
            if (isConflict) {
                setTimeout(() => {
                    window.location.reload();
                }, 2500);
            }
        }
    }, [refetch]);



    const avgDaysInReview = filteredSubmissions.length > 0
        ? Math.round(
            filteredSubmissions.reduce((acc, s) => {
                const days = Math.floor(
                    (new Date().getTime() - new Date(s.submissionDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                return acc + days;
            }, 0) / filteredSubmissions.length
        )
        : 0;

    return (
        <div className={styles.container}>
            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search by title, author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Tabs Row */}
            <div className={styles.tabsRow}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'assigned' ? styles.active : ''}`}
                        onClick={() => setActiveTab('assigned')}
                    >
                        New Assignments
                        <span className={styles.count}>{stats.assigned}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'reviewing' ? styles.active : ''}`}
                        onClick={() => setActiveTab('reviewing')}
                    >
                        Under Review
                        <span className={styles.count}>{stats.reviewing}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active
                        <span className={styles.count}>{stats.active}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed
                        <span className={styles.count}>{stats.completed}</span>
                    </button>
                </div>

                {/* <div className={styles.tabActions}>
                    <button className={styles.filterToggle} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                        <Filter size={14} /> Filters
                    </button>
                </div> */}
            </div>

            <EditorFilterPanel
                filters={filters}
                onFilterChange={updateFilters}
                onClose={() => setIsFilterOpen(false)}
                isOpen={isFilterOpen}
            />

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total in {activeTab}:</span>
                    <span className={styles.statValue}>{filteredSubmissions.length}</span>
                </div>
                <div className={styles.statItem}>
                    <TrendingUp size={14} className={styles.statIcon} />
                    <span className={styles.statLabel}>Avg. days in review:</span>
                    <span className={styles.statValue}>{avgDaysInReview}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Showing:</span>
                    <span className={styles.statValue}>
                        {filteredSubmissions.slice(0, 20).length} of {filteredSubmissions.length}
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
                {isLoading ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : error ? (
                    <div className={styles.error}>
                        <p>Error loading submissions: {error}</p>
                        <button onClick={() => refetch()} className={styles.retryButton}>Retry</button>
                    </div>
                ) : filteredSubmissions.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No submissions found</p>
                        <span>
                            {activeTab === 'assigned'
                                ? 'You have no new assignments at the moment'
                                : activeTab === 'active'
                                    ? 'No active submissions (approved, rejected, or in production) found'
                                    : 'No submissions in this category'}
                        </span>
                    </div>
                ) : (
                    filteredSubmissions.map(submission => (
                        <EditorSubmissionCard
                            key={submission.id}
                            submission={submission}
                            onView={(sub, tab) => handleViewDetails(sub, tab as any)}
                            tab={activeTab}
                        />
                    ))
                )}
            </div>

            {/* Detail View Panel */}
            {selectedSubmission && (
                <EditorSubmissionDetailView
                    submission={selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    onUpdate={() => refetch()}
                    onMakeDecision={(decision, notes) => selectedSubmission && handleMakeDecision(selectedSubmission.id, decision, notes)}
                    onMakeFinalDecision={(decision, notes) => selectedSubmission && handleMakeFinalDecision(selectedSubmission.id, decision, notes)}
                    initialTab={initialDetailTab}
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

export default EditorDashboard;