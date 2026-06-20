// src/hooks/usePublishingDraft.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { publishDraftService } from '../services/publishDraftService';

interface UsePublishingDraftProps {
    submissionId?: string | number;
    wizardType: 'CHAPTER' | 'INDIVIDUAL';
    enabled: boolean;
    onDraftLoaded?: (payload: any) => void;
}

export const usePublishingDraft = ({
    submissionId,
    wizardType,
    enabled,
    onDraftLoaded
}: UsePublishingDraftProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasDraft, setHasDraft] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Store the latest state in a ref to avoid re-triggering the effect
    const stateRef = useRef<any>(null);

    /**
     * Update the reference to the current state
     */
    const updateState = useCallback((state: any) => {
        stateRef.current = state;
    }, []);

    /**
     * Manually save the draft
     */
    const saveDraft = useCallback(async (customName?: string) => {
        if (!stateRef.current) return;

        setIsSaving(true);
        setError(null);
        try {
            await publishDraftService.upsertDraft({
                submissionId,
                wizardType,
                draftName: customName || stateRef.current?.form?.title || 'Unnamed Draft',
                payload: stateRef.current
            });
            setLastSavedAt(new Date());
        } catch (err: any) {
            console.error('Failed to save draft:', err);
            setError('Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    }, [submissionId, wizardType]);

    /**
     * Check if a draft exists on mount/id change (Submission Locked)
     */
    useEffect(() => {
        if (!enabled || !submissionId) return;

        const checkDraft = async () => {
            try {
                const draft = await publishDraftService.getDraftBySubmission(submissionId);
                if (draft) {
                    setHasDraft(true);
                }
            } catch (err) {
                console.error('Failed to check for draft:', err);
            }
        };

        checkDraft();
    }, [enabled, submissionId]);

    /**
     * Restore a draft content (Supports both ID and SubmissionID)
     */
    const restoreDraft = useCallback(async (draftId?: number) => {
        setIsRestoring(true);
        try {
            let draft = null;
            if (draftId) {
                draft = await publishDraftService.getDraftById(draftId);
            } else if (submissionId) {
                draft = await publishDraftService.getDraftBySubmission(submissionId);
            }

            if (draft && onDraftLoaded) {
                // Robustly handle stringified payload from DB
                let payload = draft.payload;
                if (typeof payload === 'string' && (payload.startsWith('{') || payload.startsWith('['))) {
                    try {
                        payload = JSON.parse(payload);
                    } catch (e) {
                        console.error('Failed to parse draft payload string:', e);
                    }
                }
                
                onDraftLoaded(payload);
                setLastSavedAt(new Date(draft.updatedAt));
                setHasDraft(false); // Clear the prompt after restoration
            }
        } catch (err) {
            console.error('Failed to restore draft:', err);
            setError('Failed to restore draft');
        } finally {
            setIsRestoring(false);
        }
    }, [submissionId, onDraftLoaded]);

    /**
     * Auto-save effect (debounced) - DISABLED by user request
     */
    /*
    useEffect(() => {
        if (!enabled) return;
        // Linked drafts save automatically if ID exists. Standalone drafts only auto-save if they have a payload.
        if (wizardType === 'CHAPTER' && !submissionId) return;

        const timer = setTimeout(() => {
            // Only auto-save if we have something to save and we're not currently restoring
            if (stateRef.current && !isRestoring && changeCount > 0) {
                saveDraft();
            }
        }, 10000); // 10 second debounce for auto-save

        return () => clearTimeout(timer);
    }, [enabled, submissionId, saveDraft, isRestoring, wizardType, changeCount]);
    */

    /**
     * Delete the draft (cleanup)
     */
    const deleteDraft = useCallback(async (draftId?: number) => {
        try {
            if (draftId) {
                // Manual deletion of a specific draft
                await publishDraftService.deleteDraft(draftId);
                setHasDraft(false);
                return;
            }

            if (!submissionId) return;

            // Cleanup for linked draft
            const draft = await publishDraftService.getDraftBySubmission(submissionId);
            if (draft) {
                await publishDraftService.deleteDraft(draft.id);
                setHasDraft(false);
                setLastSavedAt(null);
            }
        } catch (err) {
            console.error('Failed to delete draft:', err);
        }
    }, [submissionId]);

    return {
        isSaving,
        lastSavedAt,
        error,
        hasDraft,
        isRestoring,
        updateState,
        saveDraft,
        restoreDraft,
        deleteDraft
    };
};
