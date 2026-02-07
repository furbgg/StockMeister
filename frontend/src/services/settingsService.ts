import api from '@/lib/api';

export interface RestaurantSettings {
    id?: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    currency: 'TL' | 'USD' | 'EUR';
    timezone: string;
}

export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
}

export interface SettingsResponse {
    restaurant: RestaurantSettings;
    message?: string;
}

export const settingsService = {
    // Get current settings
    getSettings: async (): Promise<RestaurantSettings> => {
        const response = await api.get<RestaurantSettings>('/settings');
        return response.data;
    },

    // Update restaurant settings
    updateSettings: async (settings: Partial<RestaurantSettings>): Promise<RestaurantSettings> => {
        const response = await api.put<RestaurantSettings>('/settings', settings);
        return response.data;
    },

    // Change user password
    changePassword: async (passwordData: PasswordChangeRequest): Promise<{ message: string }> => {
        const response = await api.put<{ message: string }>('/auth/change-password', passwordData);
        return response.data;
    }
};

export default settingsService;
