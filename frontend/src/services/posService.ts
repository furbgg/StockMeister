import api from './api';

// ==================== TYPE DEFINITIONS ====================

/**
 * Order status enum matching backend
 */
export type OrderStatus = 'PENDING' | 'IN_PROCESS' | 'READY' | 'COMPLETED' | 'CANCELLED';

/**
 * Payment method enum matching backend
 */
export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'E_WALLET' | 'UNPAID';

/**
 * Order item request - for creating orders
 */
export interface OrderItemRequest {
  recipeId: number;
  quantity: number;
  notes?: string;
}

/**
 * Order request - for creating new orders
 */
export interface OrderRequest {
  tableNumber: string;
  customerName?: string;
  items: OrderItemRequest[];
  paymentMethod?: PaymentMethod;
  tip?: number;
  amountReceived?: number;
  notes?: string;
}

/**
 * Order item response - from API
 */
export interface OrderItemResponse {
  id: number;
  recipeId: number;
  recipeName: string;
  recipeImagePath?: string;
  sendToKitchen: boolean;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  itemNotes?: string;
  createdAt: string;
}

/**
 * Order response - from API
 */
export interface OrderResponse {
  id: number;
  tableNumber: string;
  customerName?: string;
  status: OrderStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  tip: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  changeAmount?: number;
  waiterId: number;
  waiterName: string;
  items: OrderItemResponse[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Menu product - recipe formatted for POS
 */
export interface MenuProduct {
  id: number;
  name: string;
  description?: string;
  sellingPrice: number;
  imagePath?: string;
  totalCost?: number;
  category: string;
  sendToKitchen: boolean;
}

/**
 * Stock shortage info from API error
 */
export interface StockShortage {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  required: number;
  available: number;
  shortfall: number;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Converts a relative image path to a full URL.
 */
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE || '';

export const getImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${UPLOADS_BASE}${cleanPath}`;
};

// ==================== API SERVICE ====================

export const posService = {
  // -------------------- Order Operations --------------------

  /**
   * Create a new order
   */
  createOrder: async (orderRequest: OrderRequest): Promise<OrderResponse> => {
    const response = await api.post('/pos/orders', orderRequest);
    return response.data;
  },

  /**
   * Get all orders
   */
  getAllOrders: async (): Promise<OrderResponse[]> => {
    const response = await api.get('/pos/orders');
    return response.data;
  },

  /**
   * Get order by ID
   */
  getOrderById: async (id: number): Promise<OrderResponse> => {
    const response = await api.get(`/pos/orders/${id}`);
    return response.data;
  },

  /**
   * Get active orders (not completed/cancelled)
   */
  getActiveOrders: async (): Promise<OrderResponse[]> => {
    const response = await api.get('/pos/orders/active');
    return response.data;
  },

  /**
   * Get orders by status
   */
  getOrdersByStatus: async (status: OrderStatus): Promise<OrderResponse[]> => {
    const response = await api.get(`/pos/orders/status/${status}`);
    return response.data;
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (id: number, status: OrderStatus): Promise<OrderResponse> => {
    const response = await api.patch(`/pos/orders/${id}/status?status=${status}`);
    return response.data;
  },

  /**
   * Complete payment for an order
   */
  completePayment: async (
    id: number,
    paymentMethod: PaymentMethod,
    amountReceived?: number,
    tip?: number
  ): Promise<OrderResponse> => {
    const params = new URLSearchParams();
    params.append('paymentMethod', paymentMethod);
    if (amountReceived !== undefined) params.append('amountReceived', amountReceived.toString());
    if (tip !== undefined) params.append('tip', tip.toString());

    const response = await api.post(`/pos/orders/${id}/pay?${params.toString()}`);
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (id: number): Promise<OrderResponse> => {
    const response = await api.post(`/pos/orders/${id}/cancel`);
    return response.data;
  },

  /**
   * Delete an order (admin only)
   */
  deleteOrder: async (id: number): Promise<void> => {
    await api.delete(`/pos/orders/${id}`);
  },

  // -------------------- Product Operations --------------------

  /**
   * Get all menu products (recipes)
   */
  getMenuProducts: async (): Promise<MenuProduct[]> => {
    const response = await api.get('/pos/products');
    return response.data;
  },

  /**
   * Get product by ID
   */
  getProductById: async (id: number): Promise<MenuProduct> => {
    const response = await api.get(`/pos/products/${id}`);
    return response.data;
  },

  /**
   * Check if product can be sold
   */
  canSellProduct: async (id: number, quantity: number = 1): Promise<boolean> => {
    const response = await api.get(`/pos/products/${id}/can-sell?quantity=${quantity}`);
    return response.data;
  },

  /**
   * Get maximum sellable quantity
   */
  getMaxSellableQuantity: async (id: number): Promise<number> => {
    const response = await api.get(`/pos/products/${id}/max-quantity`);
    return response.data;
  },
};

export default posService;
