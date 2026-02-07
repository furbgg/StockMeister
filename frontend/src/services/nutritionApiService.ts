import axios from 'axios';

export interface NutritionData {
  source: string;
  productName: string;
  brand?: string;
  allergens?: string[];
  nutriments?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  fetchedAt: string;
}

/**
 * BONUS FEATURE: Live nutrition/allergen lookup from OpenFoodFacts API
 * https://world.openfoodfacts.org/data
 */
export const nutritionApiService = {
  /**
   * Search for products by name
   * @param query Product name (e.g., "milk", "flour")
   * @returns Array of nutrition data
   */
  searchProduct: async (query: string): Promise<NutritionData[]> => {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/cgi/search.pl`,
        {
          params: {
            search_terms: query,
            search_simple: 1,
            action: 'process',
            json: 1,
            page_size: 5,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.data.products || response.data.products.length === 0) {
        return [];
      }

      // Transform OpenFoodFacts data to our format
      return response.data.products.map((product: any) => ({
        source: 'OpenFoodFacts',
        productName: product.product_name || 'Unknown Product',
        brand: product.brands || undefined,
        allergens: product.allergens_tags
          ? product.allergens_tags.map((tag: string) =>
              tag.replace('en:', '').replace(/-/g, ' ')
            )
          : [],
        nutriments: {
          calories: product.nutriments?.['energy-kcal_100g'],
          protein: product.nutriments?.proteins_100g,
          carbs: product.nutriments?.carbohydrates_100g,
          fat: product.nutriments?.fat_100g,
        },
        fetchedAt: new Date().toISOString(),
      }));
    } catch (error: any) {
      // Handle CORS or network errors gracefully
      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        throw new Error(
          'Unable to connect to nutrition API. Please check your internet connection or enter data manually.'
        );
      }
      throw new Error(
        `Nutrition lookup failed: ${error.message}. You can still enter data manually.`
      );
    }
  },
};
