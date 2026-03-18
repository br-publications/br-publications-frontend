import axios from 'axios';
import type {
    CustomRole,
    SystemRole,
    PermissionCategory,
    CreateCustomRoleRequest,
    UpdateCustomRoleRequest,
    RoleWithPermissions,
} from '../types/customRoleTypes';
import { API_BASE_URL } from '../../services/api.config';


// Create axios instance with auth token
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,

    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Get all custom roles
 */
export const getAllCustomRoles = async (): Promise<CustomRole[]> => {
    const response = await apiClient.get('/custom-roles');
    return response.data.data.customRoles;
};

/**
 * Get all system roles (default roles)
 */
export const getAllSystemRoles = async (): Promise<SystemRole[]> => {
    const response = await apiClient.get('/system-roles');
    return response.data.data.systemRoles;
};

/**
 * Get custom role by ID with permissions
 */
export const getCustomRoleById = async (roleId: number): Promise<RoleWithPermissions> => {
    const response = await apiClient.get(`/custom-roles/${roleId}`);
    return response.data.data.role;
};

/**
 * Create new custom role
 */
export const createCustomRole = async (data: CreateCustomRoleRequest): Promise<CustomRole> => {
    const response = await apiClient.post('/custom-roles', data);
    return response.data.data.role;
};

/**
 * Update custom role
 */
export const updateCustomRole = async (
    roleId: number,
    data: UpdateCustomRoleRequest
): Promise<CustomRole> => {
    const response = await apiClient.put(`/custom-roles/${roleId}`, data);
    return response.data.data.role;
};

/**
 * Delete custom role
 */
export const deleteCustomRole = async (roleId: number): Promise<void> => {
    await apiClient.delete(`/custom-roles/${roleId}`);
};

/**
 * Get all permissions grouped by category
 */
export const getPermissionsByCategory = async (): Promise<PermissionCategory[]> => {
    const response = await apiClient.get('/permissions/categories');
    return response.data.data.permissions;
};

/**
 * Assign custom role to user
 */
export const assignRoleToUser = async (userId: number, roleId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/custom-roles`, { roleId });
};

/**
 * Remove custom role from user
 */
export const removeRoleFromUser = async (userId: number, roleId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/custom-roles/${roleId}`);
};

/**
 * Get user's custom roles
 */
export const getUserCustomRoles = async (userId: number): Promise<any[]> => {
    const response = await apiClient.get(`/users/${userId}/custom-roles`);
    return response.data.data.roles;
};

export default {
    getAllCustomRoles,
    getAllSystemRoles,
    getCustomRoleById,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
    getPermissionsByCategory,
    assignRoleToUser,
    removeRoleFromUser,
    getUserCustomRoles,
};
