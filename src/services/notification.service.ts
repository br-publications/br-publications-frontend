import { API_BASE_URL, getAuthHeaders } from './api.config';
import type { NotificationResponse } from '../types/notificationTypes';

// Define Notification Response Wrapper
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

const notificationService = {
    getUserNotifications: async (page = 1, limit = 20): Promise<ApiResponse<NotificationResponse>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch notifications');
            }

            return result;
        } catch (error) {
            console.error('Error in getUserNotifications service:', error);
            throw error;
        }
    },

    markAsRead: async (notificationId: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to mark notification as read');
            }

            return result;
        } catch (error) {
            console.error('Error in markAsRead service:', error);
            throw error;
        }
    },

    markAllAsRead: async (): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to mark all notifications as read');
            }

            return result;
        } catch (error) {
            console.error('Error in markAllAsRead service:', error);
            throw error;
        }
    },

    deleteNotification: async (notificationId: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete notification');
            }

            return result;
        } catch (error) {
            console.error('Error in deleteNotification service:', error);
            throw error;
        }
    },
};

export default notificationService;
