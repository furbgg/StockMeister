import { create } from 'zustand';
import { persist } from 'zustand/middleware';



export type NotificationType = 'low-stock' | 'out-of-stock' | 'order' | 'info' | 'success' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

interface NotificationState {

  notifications: Notification[];
  lowStockNotifyEnabled: boolean;


  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toggleLowStockNotify: () => void;
  setLowStockNotify: (enabled: boolean) => void;


  getUnreadCount: () => number;
  getUnreadNotifications: () => Notification[];
}



const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;



export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({

      notifications: [],
      lowStockNotifyEnabled: true,




      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          time: new Date(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50 notifications
        }));
      },


      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },


      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },


      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },


      clearAllNotifications: () => {
        set({ notifications: [] });
      },


      toggleLowStockNotify: () => {
        set((state) => ({
          lowStockNotifyEnabled: !state.lowStockNotifyEnabled,
        }));
      },


      setLowStockNotify: (enabled) => {
        set({ lowStockNotifyEnabled: enabled });
      },


      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },


      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        lowStockNotifyEnabled: state.lowStockNotifyEnabled,
      }),

      onRehydrateStorage: () => (state) => {
        if (state) {
          state.notifications = state.notifications.map((n) => ({
            ...n,
            time: new Date(n.time),
          }));
        }
      },
    }
  )
);


export const useLowStockNotification = () => {
  const { addNotification, lowStockNotifyEnabled } = useNotificationStore();

  const notifyLowStock = (ingredientName: string, currentStock: number, unit: string, ingredientId?: number) => {
    if (!lowStockNotifyEnabled) return;

    addNotification({
      type: 'low-stock',
      title: 'Low Stock Alert',
      description: `${ingredientName} is running low (${currentStock} ${unit} left)`,
      data: ingredientId ? { ingredientId } : undefined,
    });
  };

  const notifyOutOfStock = (ingredientName: string, ingredientId?: number) => {
    if (!lowStockNotifyEnabled) return;

    addNotification({
      type: 'out-of-stock',
      title: 'Out of Stock!',
      description: `${ingredientName} is completely out of stock`,
      data: ingredientId ? { ingredientId } : undefined,
    });
  };

  return { notifyLowStock, notifyOutOfStock, lowStockNotifyEnabled };
};

export default useNotificationStore;
