import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export interface CartItem {
  recipeId: number;
  recipeName: string;
  recipeImagePath?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}


interface CartState {

  items: CartItem[];
  tableNumber: string;
  customerName: string;
  tip: number;


  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (recipeId: number) => void;
  updateQuantity: (recipeId: number, quantity: number) => void;
  updateNotes: (recipeId: number, notes: string) => void;
  clearCart: () => void;
  setTableNumber: (tableNumber: string) => void;
  setCustomerName: (customerName: string) => void;
  setTip: (tip: number) => void;


  getSubtotal: () => number;
  getTaxAmount: (taxRate?: number) => number;
  getTotal: (taxRate?: number) => number;
  getItemCount: () => number;
}



const DEFAULT_TAX_RATE = 0.05; // 5%
const STORAGE_KEY = 'pos-cart-storage';


export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({

      items: [],
      tableNumber: 'Table 01',
      customerName: '',
      tip: 0,

      addToCart: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.recipeId === item.recipeId);

        if (existingIndex >= 0) {

          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + (item.quantity || 1),
          };
          set({ items: updatedItems });
        } else {

          const newItem: CartItem = {
            recipeId: item.recipeId,
            recipeName: item.recipeName,
            recipeImagePath: item.recipeImagePath,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            notes: item.notes,
          };
          set({ items: [...items, newItem] });
        }
      },


      removeFromCart: (recipeId) => {
        set((state) => ({
          items: state.items.filter((item) => item.recipeId !== recipeId),
        }));
      },


      updateQuantity: (recipeId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(recipeId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.recipeId === recipeId ? { ...item, quantity } : item
          ),
        }));
      },

      updateNotes: (recipeId, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.recipeId === recipeId ? { ...item, notes } : item
          ),
        }));
      },

      /**
       * Clears all items from the cart.
       */
      clearCart: () => {
        set({
          items: [],
          tip: 0,
          customerName: '',
        });
      },

      /**
       * Sets the table number.
       */
      setTableNumber: (tableNumber) => {
        set({ tableNumber });
      },

      /**
       * Sets the customer name.
       */
      setCustomerName: (customerName) => {
        set({ customerName });
      },

      /**
       * Sets the tip amount.
       */
      setTip: (tip) => {
        set({ tip: Math.max(0, tip) }); // Ensure tip is non-negative
      },

      // --- Computed Values ---

      /**
       * Calculates subtotal (sum of item totals).
       */
      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },


      getTaxAmount: (taxRate = DEFAULT_TAX_RATE) => {
        return get().getSubtotal() * taxRate;
      },

      getTotal: (taxRate = DEFAULT_TAX_RATE) => {
        const { tip } = get();
        return get().getSubtotal() + get().getTaxAmount(taxRate) + tip;
      },


      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: STORAGE_KEY,

      partialize: (state) => ({
        items: state.items,
        tableNumber: state.tableNumber,
        customerName: state.customerName,
        tip: state.tip,
      }),
    }
  )
);

export default useCartStore;
