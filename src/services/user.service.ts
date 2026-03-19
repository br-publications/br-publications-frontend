import { API_BASE_URL as BASE_URL, getAuthHeaders } from './api.config';


const API_BASE_URL = `${BASE_URL}/api/users`;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type UserRole =
    | 'user'
    | 'author'
    | 'student'
    | 'admin'
    | 'editor'
    | 'reviewer'
    | 'developer';

export interface User {
    id: number;
    email: string;
    username: string;
    fullName: string;
    role: UserRole;
    profilePicture?: string;
    phoneNumber?: string;
    gender?: string;
    nationality?: string;
    dateOfBirth?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    bio?: string;
    designation?: string;
    organization?: string;
    department?: string;
    orcidId?: string;
    experienceYears?: number;
    qualification?: string;
    specialization?: string;
    researchInterests?: string[];
    linkedinProfile?: string;
    twitterProfile?: string;
    website?: string;
    scopusLink?: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        total: number;
        perPage: number;
    };
}

export interface UserPaginatedResponse {
    users: User[];
    pagination: {
        currentPage: number;
        totalPages: number;
        total: number;
        perPage: number;
    };
}

export interface UpdateProfilePayload {
    fullName?: string;
    username?: string;
    email?: string;
    profilePicture?: string;
    phoneNumber?: string;
    gender?: string;
    nationality?: string;
    dateOfBirth?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    bio?: string;
    designation?: string;
    organization?: string;
    department?: string;
    orcidId?: string;
    experienceYears?: number;
    qualification?: string;
    specialization?: string;
    researchInterests?: string[];
    linkedinProfile?: string;
    twitterProfile?: string;
    website?: string;
    scopusLink?: string;
}

export interface UpdateRolePayload {
    role: UserRole;
}

export interface VerifyEmailPayload {
    otp: string;
}

export interface UserFilters {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================





/**
 * Handle API errors
 */
const handleResponse = async (response: Response): Promise<ApiResponse> => {
    const data = await response.json();

    if (!response.ok) {
        throw {
            status: response.status,
            ...data
        };
    }

    return data;
};

// ============================================================================
// USER SERVICE
// ============================================================================

export const userService = {
    // ===========================
    // CURRENT USER
    // ===========================

    /**
     * Get current authenticated user profile
     * GET /api/users/me
     */
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Update own profile
     * PUT /api/users/me/update
     */
    updateCurrentUser: async (payload: UpdateProfilePayload): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_BASE_URL}/me/update`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        return handleResponse(response);
    },

    /**
     * Verify new email with OTP
     * POST /api/users/me/verify-email
     */
    verifyEmailChange: async (otp: string): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/me/verify-email`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ otp }),
        });

        return handleResponse(response);
    },

    /**
     * Resend email verification OTP
     * POST /api/users/me/resend-verification
     */
    resendVerification: async (): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/me/resend-verification`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    // ===========================
    // ADMIN / USER MANAGEMENT
    // ===========================

    /**
     * Get all users (Admin/Developer/Editor/Reviewer depending on implementation)
     * GET /api/users
     */
    getAllUsers: async (filters?: UserFilters): Promise<ApiResponse<UserPaginatedResponse>> => {
        const queryParams = new URLSearchParams();
        if (filters?.page) queryParams.append('page', filters.page.toString());
        if (filters?.limit) queryParams.append('limit', filters.limit.toString());
        if (filters?.search) queryParams.append('search', filters.search);
        if (filters?.role) queryParams.append('role', filters.role);
        if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

        const url = `${API_BASE_URL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get reviewers (Editor specific)
     * GET /api/users/reviewers
     */
    getReviewers: async (page = 1, limit = 10, search?: string, status: 'active' | 'inactive' | 'all' = 'active'): Promise<ApiResponse<{ users: User[], pagination: any }>> => {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (search) query += `&search=${encodeURIComponent(search)}`;

            // Map status to boolean or 'all'
            if (status === 'active') query += `&isActive=true`;
            else if (status === 'inactive') query += `&isActive=false`;
            // if 'all', we don't send isActive param, backend returns all

            const response = await fetch(`${API_BASE_URL}/reviewers${query}`, {
                headers: getAuthHeaders(),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get reviewers error:', error);
            return {
                success: false,
                message: 'Failed to fetch reviewers',
            };
        }
    },

    /**
     * Get user by ID
     * GET /api/users/id/:id
     */
    getUserById: async (id: number): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_BASE_URL}/id/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get user by Email
     * GET /api/users/email/:email
     */
    getUserByEmail: async (email: string): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_BASE_URL}/email/${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get user permissions
     * GET /api/users/:id/permissions
     */
    getUserPermissions: async (id: number): Promise<ApiResponse<string[]>> => {
        const response = await fetch(`${API_BASE_URL}/${id}/permissions`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Update user profile (Admin)
     * PUT /api/users/:id
     */
    updateUserProfile: async (id: number, payload: UpdateProfilePayload): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        return handleResponse(response);
    },

    /**
     * Update user role (Admin)
     * PUT /api/users/:id/role
     */
    updateUserRole: async (id: number, role: UserRole): Promise<ApiResponse<User>> => {
        const response = await fetch(`${API_BASE_URL}/${id}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role }),
        });

        return handleResponse(response);
    },

    /**
     * Deactivate user (Soft Delete)
     * DELETE /api/users/:id
     */
    deleteUser: async (id: number): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Permanently delete user (Developer only)
     * DELETE /api/users/:id/permanent
     */
    deleteUserPermanent: async (id: number): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/${id}/permanent`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Reactivate user account
     * POST /api/users/:id/reactivate
     */
    reactivateUser: async (id: number): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/${id}/reactivate`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Impersonate user (Login as User)
     * POST /api/users/:id/impersonate
     */
    impersonateUser: async (id: number): Promise<ApiResponse<{ user: User, token: string }>> => {
        const response = await fetch(`${API_BASE_URL}/${id}/impersonate`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Get Reviewer Stats (Editor)
     * GET /api/users/:id/stats
     */
    getReviewerStats: async (id: number): Promise<ApiResponse<any>> => {
        const response = await fetch(`${API_BASE_URL}/${id}/stats`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Email Reviewer (Editor)
     * POST /api/users/:id/email
     */
    emailReviewer: async (id: number, subject: string, message: string): Promise<ApiResponse> => {
        const response = await fetch(`${API_BASE_URL}/${id}/email`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ subject, message }),
        });

        return handleResponse(response);
    },
};

export default userService;
