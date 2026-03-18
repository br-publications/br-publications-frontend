import { API_BASE_URL, getAuthHeaders } from './api.config';

export interface ProjectInternshipData {
    submissionType: 'WEB' | 'MOBILE' | 'INTERNSHIP';
    data: any;
}

export type SubmissionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ProjectInternshipResponse {
    id: number;
    submittedBy: number;
    submissionType: 'WEB' | 'MOBILE' | 'INTERNSHIP';
    status: SubmissionStatus;
    data: any;
    adminNotes: string | null;
    applicationId: string | null;
    createdAt: string;
    updatedAt: string;
    applicant?: {
        fullName: string;
        email: string;
        phoneNumber: string;
    };
}

class ProjectInternshipService {
    private baseUrl = `${API_BASE_URL}/api/project-internship`;

    /**
     * Submit application
     */
    async submitApplication(data: ProjectInternshipData): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/submit`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to submit application');
            }
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get current user's submissions
     */
    async getMySubmissions(): Promise<ProjectInternshipResponse[]> {
        try {
            const response = await fetch(`${this.baseUrl}/my-submissions`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch submissions');
            }
            return result.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all submissions (Admin)
     */
    async getAllSubmissions(status?: string, type?: string): Promise<ProjectInternshipResponse[]> {
        try {
            let url = `${this.baseUrl}/admin/all`;
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (type) params.append('type', type);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch submissions');
            }
            return result.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get submission by ID
     */
    async getSubmissionById(id: string | number): Promise<ProjectInternshipResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch submission details');
            }
            return result.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update status
     */
    async updateStatus(id: number, status: string, adminNotes?: string): Promise<ProjectInternshipResponse> {
        const response = await fetch(`${this.baseUrl}/status/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, adminNotes }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update status');
        }
        return result.data;
    }
}

export const projectInternshipService = new ProjectInternshipService();
