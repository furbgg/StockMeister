import api from './api';

// Waste log entry from backend
export interface WasteLog {
  id: number;
  ingredientId: number;
  ingredientName: string;
  ingredientUnit: string;
  ingredientCategory: string;
  quantity: number;
  reason: string;
  date: string;
}


export interface CreateWasteRequest {
  ingredientId: number;
  quantity: number;
  reason: string;
}


export const wasteService = {
  /** Get all waste logs */
  getAll: async (): Promise<WasteLog[]> => {
    const response = await api.get('/waste');
    return response.data;
  },


  create: async (data: CreateWasteRequest): Promise<WasteLog> => {
    const response = await api.post('/waste', data);
    return response.data;
  },


  delete: async (id: number): Promise<void> => {
    await api.delete(`/waste/${id}`);
  },
};