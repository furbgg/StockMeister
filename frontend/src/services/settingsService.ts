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
    },

    // 2FA - Get status
    get2FAStatus: async (): Promise<{ enabled: boolean }> => {
        const response = await api.get<{ enabled: boolean }>('/auth/2fa/status');
        return response.data;
    },

    // 2FA - Start setup (generates QR + secret)
    setup2FA: async (): Promise<{ secret: string; qrUrl: string }> => {
        const response = await api.post<{ secret: string; qrUrl: string }>('/auth/2fa/setup');
        return response.data;
    },

    // 2FA - Confirm setup with code
    confirm2FA: async (code: number): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/auth/2fa/confirm-setup', { code });
        return response.data;
    },

    // 2FA - Disable
    disable2FA: async (): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/auth/2fa/disable');
        return response.data;
    }
};

export default settingsService;
