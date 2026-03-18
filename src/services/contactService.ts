import { API_BASE_URL, getAuthToken } from './api.config';

export interface ContactDetails {
    id?: number;
    phoneNumbers?: string[];
    email?: string;
    officeAddress?: string;
    timings?: string;
    whatsapp?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
}

export const contactService = {
    // Get contact details
    getContactDetails: async (): Promise<{ success: boolean; data: ContactDetails }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.warn('Failed to fetch contact details from API, using fallback.');
                const { defaultContactDetails } = await import('../assets/defaultContact');
                return { success: true, data: defaultContactDetails };
            }

            const result = await response.json();

            // Check if DB was empty (e.g., missing data or email is mapped to fallback)
            if (result.success && (!result.data || Object.keys(result.data).length === 0 || !result.data.email)) {
                const { defaultContactDetails } = await import('../assets/defaultContact');
                return { success: true, data: defaultContactDetails };
            }

            return result;
        } catch (error) {
            console.error('Error fetching contact details, using fallback:', error);
            const { defaultContactDetails } = await import('../assets/defaultContact');
            return { success: true, data: defaultContactDetails };
        }
    },

    // Update contact details (Admin only)
    updateContactDetails: async (data: ContactDetails): Promise<{ success: boolean; message: string; data: ContactDetails }> => {
        try {
            const token = getAuthToken();

            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to update contact details');
            }

            return responseData;
        } catch (error) {
            console.error('Error updating contact details:', error);
            throw error;
        }
    },
};
