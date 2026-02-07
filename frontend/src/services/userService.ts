import api from '@/lib/api';

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'ADMIN' | 'CHEF' | 'INVENTORY_MANAGER' | 'WAITER';
    isActive: boolean;
    phone?: string;
    salary?: number;
    timings?: string;
    address?: string;
}

export interface UserDTO {
    username: string;
    email: string;
    password?: string;
    role: string;
    phone?: string;
    salary?: number;
    timings?: string;
    address?: string;
}

export const userService = {
    getAllUsers: async () => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    createUser: async (user: UserDTO) => {
        const response = await api.post<User>('/users', user);
        return response.data;
    },

    updateUser: async (id: number, user: Partial<UserDTO>) => {
        const response = await api.put<User>(`/users/${id}`, user);
        return response.data;
    },

    deleteUser: async (id: number) => {
        await api.delete(`/users/${id}`);
    }
};
