import api, { apiMultipart } from './api';

export interface Ingredient {
  id?: number;
  name: string;
  category?: string;
  unit: string;
  currentStock?: string;
  minimumStock?: string;
  unitPrice: string;
  supplier?: string;
  nutritionInfo?: any;
  imagePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Convert relative imagePath to full URL
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE || '';

export const getImageUrl = (imagePath: string | undefined | null): string | null => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${UPLOADS_BASE}${cleanPath}`;
};

export const ingredientService = {

  getAll: async (): Promise<Ingredient[]> => {
    const response = await api.get('/ingredients');
    return response.data;
  },

  getById: async (id: number): Promise<Ingredient> => {
    const response = await api.get(`/ingredients/${id}`);
    return response.data;
  },


  getLowStock: async (multiplier: number = 1.0): Promise<Ingredient[]> => {
    const response = await api.get(`/ingredients/low-stock?thresholdMultiplier=${multiplier}`);
    return response.data;
  },


  create: async (data: Ingredient, image?: File | null): Promise<Ingredient> => {
    const formData = new FormData();


    const ingredientData = {
      ...data,

    };
    formData.append('ingredient', JSON.stringify(ingredientData));


    if (image) {
      formData.append('image', image);
    }

    const response = await apiMultipart.post('/ingredients', formData);
    return response.data;
  },


  update: async (id: number, data: Ingredient, image?: File | null): Promise<Ingredient> => {
    const formData = new FormData();


    const ingredientData = {
      ...data,
    };
    formData.append('ingredient', JSON.stringify(ingredientData));


    if (image) {
      formData.append('image', image);
    }

    const response = await apiMultipart.put(`/ingredients/${id}`, formData);
    return response.data;
  },



  delete: async (id: number): Promise<void> => {
    await api.delete(`/ingredients/${id}`);
  },


  getOutOfStock: async (): Promise<Ingredient[]> => {
    const response = await api.get('/ingredients/out-of-stock');
    return response.data;
  },

  /** Get ingredients with low stock (0 < currentStock < minimumStock) */
  getLowStockOnly: async (): Promise<Ingredient[]> => {
    const response = await api.get('/ingredients/low-stock-only');
    return response.data;
  },

  /** Quick stock update - only updates stock amount */
  updateStock: async (id: number, newStock: number): Promise<Ingredient> => {
    const response = await api.patch(`/ingredients/${id}/stock?newStock=${newStock}`);
    return response.data;
  },

  /** Bulk stock count update */
  updateStockCount: async (adjustments: { ingredientId: number; physicalCount: number }[]): Promise<void> => {
    await api.post('/ingredients/stock-count', adjustments);
  },
};
