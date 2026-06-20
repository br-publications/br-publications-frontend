import { API_BASE_URL, getAuthHeaders } from './api.config';

export type InquiryStatus = 'PENDING' | 'ACKNOWLEDGED';

export interface ContactInquirySubmit {
    name: string;
    email: string;
    phone?: string;
    message: string;
}

export interface ContactInquiryResponse {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    status: InquiryStatus;
    adminNotes: string | null;
    reviewedBy: number | null;
    createdAt: string;
    updatedAt: string;
    reviewer?: {
        fullName: string;
        email: string;
    };
}

class ContactInquiryService {
    private baseUrl = `${API_BASE_URL}/api/contact-inquiry`;

    /**
     * Submit a contact inquiry — public, no auth required
     */
    async submitInquiry(data: ContactInquirySubmit): Promise<{ id: number }> {
        const response = await fetch(`${this.baseUrl}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to submit inquiry');
        }
        return result.data;
    }

    /**
     * Get all inquiries (Admin)
     */
    async getAllInquiries(status?: string, search?: string): Promise<ContactInquiryResponse[]> {
        const params = new URLSearchParams();
        if (status && status !== 'ALL') params.append('status', status);
        if (search) params.append('search', search);

        const url = `${this.baseUrl}/admin/all${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch inquiries');
        }
        return result.data;
    }

    /**
     * Get a single inquiry (Admin)
     */
    async getInquiryById(id: number): Promise<ContactInquiryResponse> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch inquiry');
        }
        return result.data;
    }

    /**
     * Acknowledge an inquiry (Admin) — sends email to submitter
     */
    async acknowledgeInquiry(id: number, adminNotes: string): Promise<ContactInquiryResponse> {
        const response = await fetch(`${this.baseUrl}/acknowledge/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ adminNotes }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to acknowledge inquiry');
        }
        return result.data;
    }
}

export const contactInquiryService = new ContactInquiryService();
