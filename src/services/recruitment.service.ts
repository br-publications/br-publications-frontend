import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from './api.config';

export interface RecruitmentSubmissionData {
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
    instituteName: string;
    email: string;
    phoneNumber: string;
    city: string;
    state: string;
    country: string;
    highestQualification: string;
    scopusId: string;
    biography: string;
    appliedRole: 'editor' | 'reviewer';
    personalImage?: File | string | null;
}

export interface RecruitmentSubmissionResponse {
    id: number;
    submittedBy: number;
    firstName: string;
    lastName: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    appliedRole: string;
    applicationId: string | null;
    personalImage: string | null;
    adminNotes: string | null;
    createdAt: string;
    updatedAt: string;
}

class RecruitmentService {
    /**
     * Submit recruitment application
     */
    async submitApplication(data: RecruitmentSubmissionData): Promise<any> {
        try {
            // If there's a file, we might need FormData. 
            // For now assuming JSON or path string. 
            // If image is a File, we'd use FormData.

            let body: any = data;
            let headers: any = getAuthHeaders();

            if (data.personalImage instanceof File) {
                const formData = new FormData();
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        formData.append(key, value);
                    }
                });
                body = formData;
                // Fetch will set correct boundary if content-type is NOT manually set
                delete headers['Content-Type'];
            }

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RECRUITMENT.SUBMIT}`, {
                method: 'POST',
                headers: headers,
                body: body instanceof FormData ? body : JSON.stringify(body),
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
     * Get current user's applications
     */
    async getMyApplications(): Promise<RecruitmentSubmissionResponse[]> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RECRUITMENT.MY_SUBMISSIONS}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch applications');
            }
            return result.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all applications (Admin)
     */
    async getAllApplications(status?: string, role?: string): Promise<any> {
        try {
            let url = `${API_BASE_URL}${API_ENDPOINTS.RECRUITMENT.ADMIN_ALL}`;
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (role) params.append('role', role);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch applications');
            }
            return result.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get application by ID
     */
    async getApplicationById(id: string | number): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RECRUITMENT.BY_ID(id)}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch application details');
            }
            return result.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update application status
     */
    async updateStatus(id: number, status: string, adminNotes?: string, assignedRole?: string): Promise<RecruitmentSubmissionResponse> {
        const response = await fetch(`${API_BASE_URL}/api/recruitment/status/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status, adminNotes, assignedRole }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update status');
        }
        return response.json();
    }
}

export const recruitmentService = new RecruitmentService();
