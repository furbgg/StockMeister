import api from './api';

/**
 * Ingredient data nested inside RecipeIngredient response
 */
export interface RecipeIngredientData {
  id: number;
  name: string;
  unit: string;
  unitPrice: string | number;
  currentStock?: string | number;
  category?: string;
}

/**
 * RecipeIngredient - represents one ingredient line in a recipe
 * This matches the backend RecipeIngredient entity JSON response
 */
export interface RecipeIngredient {
  id: number;
  amount: string | number;
  ingredient: RecipeIngredientData;
}

/**
 * Recipe - represents a menu item
 */
export interface Recipe {
  id?: number;
  name: string;
  description?: string;
  sellingPrice: string | number;
  imagePath?: string;
  category?: string;
  sendToKitchen?: boolean;
  ingredients?: RecipeIngredient[];
  totalCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request payload for adding/updating recipe ingredients
 * Matches RecipeIngredientRequest DTO in backend
 */
export interface RecipeIngredientRequest {
  ingredientId: number;
  amount: number;
}

/** Converts a relative image path to a full URL */
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE || '';

export const getImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${UPLOADS_BASE}${cleanPath}`;
};

export const recipeService = {

  /**
   * Get all recipes
   */
  getAll: async (withIngredients = false): Promise<Recipe[]> => {
    const params = withIngredients ? '?withIngredients=true' : '';
    const response = await api.get(`/recipes${params}`);
    return response.data;
  },

  /**
   * Get a single recipe by ID
   */
  getById: async (id: number, withIngredients = true): Promise<Recipe> => {
    const params = `?withIngredients=${withIngredients}`;
    const response = await api.get(`/recipes/${id}${params}`);
    return response.data;
  },

  /**
   * Create a new recipe
   */
  create: async (data: Partial<Recipe>, image: File | null): Promise<Recipe> => {
    const formData = new FormData();
    formData.append(
      'recipe',
      new Blob([JSON.stringify(data)], { type: 'application/json' })
    );
    if (image) {
      formData.append('image', image);
    }
    const response = await api.post('/recipes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update an existing recipe
   */
  update: async (id: number, data: Partial<Recipe>, image: File | null): Promise<Recipe> => {
    const formData = new FormData();
    formData.append(
      'recipe',
      new Blob([JSON.stringify(data)], { type: 'application/json' })
    );
    if (image) {
      formData.append('image', image);
    }
    const response = await api.put(`/recipes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete a recipe
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/recipes/${id}`);
  },

  /**
   * Get all ingredients for a recipe
   * GET /api/recipes/{recipeId}/ingredients
   */
  getRecipeIngredients: async (recipeId: number): Promise<RecipeIngredient[]> => {
    const response = await api.get(`/recipes/${recipeId}/ingredients`);
    return response.data || [];
  },

  /**
   * Update recipe ingredients (bulk replace)
   * POST /api/recipes/{recipeId}/ingredients
   * Body: [{ingredientId, amount}]
   *
   * IMPORTANT: Backend expects exactly { ingredientId: Long, amount: BigDecimal }
   */
  updateRecipeIngredients: async (
    recipeId: number,
    items: RecipeIngredientRequest[]
  ): Promise<Recipe> => {
    // Ensure payload matches backend DTO exactly
    const payload = items.map(item => ({
      ingredientId: Number(item.ingredientId),
      amount: Number(item.amount)
    }));



    const response = await api.post(`/recipes/${recipeId}/ingredients`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  /**
   * Sell a recipe (deducts stock from all ingredients)
   * POST /api/recipes/{id}/sell?quantity=N
   */
  sell: async (recipeId: number, quantity = 1): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/recipes/${recipeId}/sell?quantity=${quantity}`);
    return response.data;
  },

  /**
   * Check if a recipe can be sold
   * GET /api/recipes/{id}/can-sell?quantity=N
   */
  canSell: async (recipeId: number, quantity = 1): Promise<{ canSell: boolean; maxSellableQuantity: number }> => {
    const response = await api.get(`/recipes/${recipeId}/can-sell?quantity=${quantity}`);
    return response.data;
  },

  /**
   * Get the cost of a recipe
   * GET /api/recipes/{id}/cost
   */
  getCost: async (recipeId: number): Promise<{ cost: number }> => {
    const response = await api.get(`/recipes/${recipeId}/cost`);
    return response.data;
  },
};

export default recipeService;
