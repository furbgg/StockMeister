import {
  LayoutDashboard,
  ChefHat,
  Package,
  AlertTriangle,
  ClipboardList,
  Trash2,
  Monitor,
  Users,
  Shield,
  Settings,
  LogOut,
  LucideIcon,
  ShoppingCart,
} from 'lucide-react';

// Updated to match backend roles exactly
export type UserRole = 'ADMIN' | 'CHEF' | 'INVENTORY_MANAGER' | 'WAITER';

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
  badge?: string | number;
  children?: SidebarItem[];
}

export interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
}

// Config with specific roles
export const sidebarConfig: SidebarSection[] = [
  {
    id: 'main',
    title: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        // No roles = accessible by all
      },
    ],
  },
  {
    id: 'kitchen-menu',
    title: 'Kitchen & Menu',
    items: [
      {
        id: 'recipes',
        label: 'Recipes',
        href: '/recipes',
        icon: ChefHat,
        roles: ['ADMIN', 'CHEF'],
      },
      {
        id: 'ingredients',
        label: 'Ingredients',
        href: '/ingredients',
        icon: Package,
        roles: ['ADMIN', 'CHEF', 'INVENTORY_MANAGER'],
      },
      {
        id: 'low-stocks',
        label: 'Low Stocks',
        href: '/low-stocks',
        icon: AlertTriangle,
        roles: ['ADMIN', 'CHEF', 'INVENTORY_MANAGER'],
      },
    ],
  },
  {
    id: 'inventory-control',
    title: 'Inventory Control',
    items: [
      {
        id: 'stock-count',
        label: 'Stock Count',
        href: '/stock-count',
        icon: ClipboardList,
        roles: ['ADMIN', 'INVENTORY_MANAGER'],
      },
      {
        id: 'waste-management',
        label: 'Waste Management',
        href: '/waste-management',
        icon: Trash2,
        roles: ['ADMIN', 'CHEF', 'INVENTORY_MANAGER'],
      },
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    items: [
      {
        id: 'pos',
        label: 'POS',
        href: '/pos',
        icon: Monitor,
        roles: ['ADMIN', 'WAITER'],
      },
      {
        id: 'orders',
        label: 'Orders',
        href: '/orders',
        icon: ShoppingCart,
        roles: ['ADMIN', 'WAITER', 'CHEF'],
      },
    ],
  },
  {
    id: 'user-management',
    title: 'User Management',
    items: [
      {
        id: 'users',
        label: 'Users',
        href: '/users',
        icon: Users,
        roles: ['ADMIN'],
      },
      {
        id: 'roles-permissions',
        label: 'Roles & Permissions',
        href: '/roles',
        icon: Shield,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'settings-section',
    title: 'Settings',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
      },
      {
        id: 'logout',
        label: 'Logout',
        href: '/logout',
        icon: LogOut,
      },
    ],
  },
];

export const getMenuItemById = (id: string): SidebarItem | undefined => {
  for (const section of sidebarConfig) {
    const item = section.items.find((item) => item.id === id);
    if (item) return item;
  }
  return undefined;
};

export const filterMenuByRole = (role: string): SidebarSection[] => {
  // Normalize role to UPPERCASE for consistent comparison
  const normalizedRole = role.toUpperCase();

  // THE GOLDEN RULE: ADMIN sees EVERYTHING
  if (normalizedRole === 'ADMIN') {
    return sidebarConfig;
  }

  // For other roles, strict filtering
  return sidebarConfig.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      // If item has no roles defined, it's public (e.g. Dashboard)
      if (!item.roles || item.roles.length === 0) return true;

      // Check if user's role is in the allowed list
      return item.roles.includes(normalizedRole as UserRole);
    }),
  })).filter((section) => section.items.length > 0); // Remove empty sections
};
