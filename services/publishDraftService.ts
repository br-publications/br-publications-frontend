// src/services/publishDraftService.ts
// ============================================================
// Service for managing temporary publication drafts (Aligned with Backend API)
// ============================================================

import { API_BASE_URL as BASE_URL, getAuthToken } from './api.config';

const API_BASE = `${BASE_URL}/api/drafts`;

function getJsonHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
    };
}

async function handleResponse(response: Response) {
    let json;
    const text = await response.text();
    try {
        json = text ? JSON.parse(text) : {};
    } catch (e) {
        if (!response.ok) throw { status: response.status, message: text || response.statusText };
        return text;
    }
    if (!response.ok) throw { status: response.status, ...json, message: json.message || response.statusText };
    return json.data !== undefined ? json.data : json;
}

export interface PublishingDraft {
    id: number;
    submissionId?: number | string;
    wizardType: 'CHAPTER' | 'INDIVIDUAL';
    draftName?: string;
    payload: any;
    updatedAt: string;
}

export const publishDraftService = {
    /**
     * List all standalone ("handy") drafts for the user
     */
    async listHandyDrafts(): Promise<PublishingDraft[]> {
        const response = await fetch(`${API_BASE}`, {
            headers: getJsonHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * List drafts filtered by wizard type
     */
    async getDraftsByWizard(wizardType: 'CHAPTER' | 'INDIVIDUAL'): Promise<PublishingDraft[]> {
        const drafts = await this.listHandyDrafts();
        return drafts.filter(d => d.wizardType === wizardType);
    },

    /**
     * Get a draft by its unique database ID
     */
    async getDraftById(id: string | number): Promise<PublishingDraft | null> {
        const response = await fetch(`${API_BASE}/${id}`, {
            headers: getJsonHeaders(),
        });
        try {
            return await handleResponse(response);
        } catch (err: any) {
            if (err.status === 404) return null;
            throw err;
        }
    },

    /**
     * Get a draft for a specific submission ID
     */
    async getDraftBySubmission(submissionId: string | number): Promise<PublishingDraft | null> {
        const response = await fetch(`${API_BASE}/submission/${submissionId}`, {
            headers: getJsonHeaders(),
        });
        try {
            return await handleResponse(response);
        } catch (err: any) {
            if (err.status === 404) return null;
            throw err;
        }
    },

    /**
     * Create or update a draft.
     * Backend uses submissionId + userId for uniqueness if provided, 
     * or creates a new "handy" draft if submissionId is missing.
     */
    async upsertDraft(data: {
        submissionId?: number | string;
        wizardType: 'CHAPTER' | 'INDIVIDUAL';
        draftName?: string;
        payload: any;
    }): Promise<PublishingDraft> {
        const response = await fetch(`${API_BASE}`, {
            method: 'POST',
            headers: getJsonHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    /**
     * Delete a draft by its database ID
     */
    async deleteDraft(id: string | number): Promise<void> {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
            headers: getJsonHeaders(),
        });
        await handleResponse(response);
    }
};
