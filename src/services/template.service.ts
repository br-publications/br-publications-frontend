import { API_BASE_URL as BASE_URL, getAuthToken } from './api.config';

const API_BASE_URL = `${BASE_URL}/api/templates`;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommunicationTemplate {
    id: number;
    code: string;
    type: 'EMAIL' | 'NOTIFICATION';
    subject: string;
    content: string;
    htmlContent: string | null;
    contentMode: 'rich' | 'html';
    variables: string[];
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TemplateListResponse {
    templates: CommunicationTemplate[];
    grouped: Record<string, CommunicationTemplate[]>;
}

export interface TemplatePreview {
    subject: string;
    content: string;
}

export interface UpdateTemplatePayload {
    subject?: string;
    content?: string;
    htmlContent?: string | null;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface TemplateFilters {
    type?: 'EMAIL' | 'NOTIFICATION';
    search?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const getJsonHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
    const data = await response.json();
    if (!response.ok) {
        throw { status: response.status, ...data };
    }
    return data;
};

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

export const templateService = {
    /**
     * List all templates, optionally filtered
     * GET /api/templates?type=EMAIL&search=keyword
     */
    listTemplates: async (filters?: TemplateFilters): Promise<ApiResponse<TemplateListResponse>> => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.search) params.append('search', filters.search);
        const qs = params.toString();
        const response = await fetch(`${API_BASE_URL}${qs ? '?' + qs : ''}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse<TemplateListResponse>(response);
    },

    /**
     * Get a single template by ID
     * GET /api/templates/:id
     */
    getTemplate: async (id: number): Promise<ApiResponse<CommunicationTemplate>> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse<CommunicationTemplate>(response);
    },

    /**
     * Update template subject and/or content
     * PUT /api/templates/:id
     */
    updateTemplate: async (id: number, payload: UpdateTemplatePayload): Promise<ApiResponse<CommunicationTemplate>> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: getJsonHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse<CommunicationTemplate>(response);
    },

    /**
     * Toggle isActive flag
     * PATCH /api/templates/:id/toggle
     */
    toggleTemplate: async (id: number): Promise<ApiResponse<{ id: number; code: string; isActive: boolean }>> => {
        const response = await fetch(`${API_BASE_URL}/${id}/toggle`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        return handleResponse<{ id: number; code: string; isActive: boolean }>(response);
    },

    /**
     * Preview rendered template with sample variables
     * POST /api/templates/:id/preview
     */
    previewTemplate: async (id: number, variables?: Record<string, string>, mode?: 'rich' | 'html'): Promise<ApiResponse<TemplatePreview>> => {
        const qs = mode === 'html' ? '?mode=html' : '';
        const response = await fetch(`${API_BASE_URL}/${id}/preview${qs}`, {
            method: 'POST',
            headers: getJsonHeaders(),
            body: JSON.stringify({ variables: variables || {} }),
        });
        return handleResponse<TemplatePreview>(response);
    },

    /**
     * Toggle contentMode between 'rich' and 'html'
     * PATCH /api/templates/:id/toggle-mode
     */
    toggleContentMode: async (id: number): Promise<ApiResponse<{ id: number; code: string; contentMode: 'rich' | 'html' }>> => {
        const response = await fetch(`${API_BASE_URL}/${id}/toggle-mode`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        return handleResponse<{ id: number; code: string; contentMode: 'rich' | 'html' }>(response);
    },
};

export default templateService;
