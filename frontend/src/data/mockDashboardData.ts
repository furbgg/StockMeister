import { LucideIcon, Smartphone, Briefcase, Package, Coins } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface StatCardData {
  id: string;
  title: string;
  value: string | number;
  change: number; // percentage change (+/-)
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
  iconBgColor: string;
  sparklineData: number[];
  sparklineColor: string;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface NetProfitDataPoint {
  day: string;
  profit: number;
  isHighlighted?: boolean;
}

export interface TopSellingRecipe {
  name: string;
  percentage: number;
  color: string;
}

export interface RecentSale {
  id: string;
  orderNumber: string;
  name: string;
  date: string;
  quantity: number;
  icon: string;
  iconBg: string;
}

export interface RecentStockUpdate {
  id: string;
  ingredientName: string;
  updatedBy: string;
  updateType: string;
  amount: string;
  icon: string;
  iconBg: string;
}

export interface DashboardSummary {
  totalOrders: number;
  dateRange: string;
  userName: string;
}

// ============================================
// 🏔️ GASTHAUS ZUM GOLDENEN ADLER - MOCK DATA
// Austrian Restaurant Dashboard Data
// ============================================

export const dashboardSummary: DashboardSummary = {
  totalOrders: 847,
  dateRange: '01 Jan 2025 - 30 Jan 2025',
  userName: 'Lukas',
};

// Stats Cards - Consistent with 28 ingredients, 8 recipes
// Stock Value calculated from ingredient prices * quantities
export const statsCardsData: StatCardData[] = [
  {
    id: 'total-revenue',
    title: 'Total Revenue',
    value: '€12,458',
    change: 23.5,
    changeType: 'increase',
    icon: Smartphone,
    iconBgColor: 'bg-slate-800',
    sparklineData: [35, 42, 38, 55, 52, 68, 75, 82, 78],
    sparklineColor: '#22c55e',
  },
  {
    id: 'net-profit',
    title: 'Net Profit',
    value: '€8,247',
    change: 18.2,
    changeType: 'increase',
    icon: Briefcase,
    iconBgColor: 'bg-slate-800',
    sparklineData: [45, 52, 48, 58, 62, 70, 68, 75, 82],
    sparklineColor: '#22c55e',
  },
  {
    id: 'low-stock-items',
    title: 'Low Stock Items',
    value: '4',
    change: 2,
    changeType: 'decrease',
    icon: Package,
    iconBgColor: 'bg-cyan-100',
    sparklineData: [8, 6, 7, 5, 6, 4, 5, 4, 4],
    sparklineColor: '#22c55e',
  },
  {
    id: 'stock-value',
    title: 'Stock Value',
    value: '€2,847.65',
    change: 8.4,
    changeType: 'increase',
    icon: Coins,
    iconBgColor: 'bg-amber-100',
    sparklineData: [2200, 2350, 2400, 2550, 2480, 2620, 2700, 2780, 2848],
    sparklineColor: '#22c55e',
  },
];

// Monthly Revenue for 2025 (EUR)
// Monthly Revenue for 2025 (EUR)
export const revenueChartData: RevenueDataPoint[] = [
  { month: 'Jan', revenue: 12458 },
  { month: 'Feb', revenue: 8500 },
  { month: 'Mar', revenue: 9200 },
  { month: 'Apr', revenue: 11000 },
  { month: 'May', revenue: 14500 },
  { month: 'Jun', revenue: 13200 },
  { month: 'Jul', revenue: 15800 },
  { month: 'Aug', revenue: 16900 },
  { month: 'Sep', revenue: 14200 },
  { month: 'Oct', revenue: 13500 },
  { month: 'Nov', revenue: 17500 },
  { month: 'Dec', revenue: 21000 },
];

export const revenueChartDataLastYear: RevenueDataPoint[] = [
  { month: 'Jan', revenue: 9500 },
  { month: 'Feb', revenue: 8200 },
  { month: 'Mar', revenue: 7800 },
  { month: 'Apr', revenue: 8900 },
  { month: 'May', revenue: 10500 },
  { month: 'Jun', revenue: 11200 },
  { month: 'Jul', revenue: 12800 },
  { month: 'Aug', revenue: 13500 },
  { month: 'Sep', revenue: 11200 },
  { month: 'Oct', revenue: 10500 },
  { month: 'Nov', revenue: 14500 },
  { month: 'Dec', revenue: 16000 },
];

// Weekly Net Profit (This Week)
export const netProfitChartData: NetProfitDataPoint[] = [
  { day: 'Mo', profit: 892 },
  { day: 'Di', profit: 1045 },
  { day: 'Mi', profit: 987 },
  { day: 'Do', profit: 1456, isHighlighted: true },
  { day: 'Fr', profit: 1678, isHighlighted: true },
  { day: 'Sa', profit: 1823 },
  { day: 'So', profit: 366 },
];

export const netProfitChartDataLastWeek: NetProfitDataPoint[] = [
  { day: 'Mo', profit: 650 },
  { day: 'Di', profit: 890 },
  { day: 'Mi', profit: 750 },
  { day: 'Do', profit: 1100 },
  { day: 'Fr', profit: 1350, isHighlighted: true },
  { day: 'Sa', profit: 1400 },
  { day: 'So', profit: 200 },
];

// Top Selling Recipes - Austrian Dishes
export const topSellingRecipes: TopSellingRecipe[] = [
  { name: 'Wiener Schnitzel', percentage: 35, color: '#7c3176' },
  { name: 'Tafelspitz', percentage: 22, color: '#eab308' },
  { name: 'Schweinsbraten', percentage: 18, color: '#3b82f6' },
  { name: 'Käsespätzle', percentage: 15, color: '#22c55e' },
  { name: 'Andere', percentage: 10, color: '#94a3b8' },
];

// Recent Sales - Austrian Menu Items
export const recentSales: RecentSale[] = [
  {
    id: '1',
    orderNumber: '#A-1247',
    name: 'Wiener Schnitzel',
    date: '30 Jan 2025',
    quantity: 4,
    icon: '🥩',
    iconBg: 'bg-amber-100',
  },
  {
    id: '2',
    orderNumber: '#A-1246',
    name: 'Tafelspitz',
    date: '30 Jan 2025',
    quantity: 2,
    icon: '🍖',
    iconBg: 'bg-red-100',
  },
  {
    id: '3',
    orderNumber: '#A-1245',
    name: 'Käsespätzle',
    date: '30 Jan 2025',
    quantity: 3,
    icon: '🧀',
    iconBg: 'bg-yellow-100',
  },
  {
    id: '4',
    orderNumber: '#A-1244',
    name: 'Wiener Saftgulasch',
    date: '29 Jan 2025',
    quantity: 2,
    icon: '🍲',
    iconBg: 'bg-orange-100',
  },
  {
    id: '5',
    orderNumber: '#A-1243',
    name: 'Topfenknödel',
    date: '29 Jan 2025',
    quantity: 5,
    icon: '🥟',
    iconBg: 'bg-purple-100',
  },
];

// Recent Stock Updates - Austrian Ingredients (German names)
export const recentStockUpdates: RecentStockUpdate[] = [
  {
    id: '1',
    ingredientName: 'Kalbfleisch',
    updatedBy: 'Markus Eder',
    updateType: 'Added',
    amount: '+5 kg',
    icon: '🥩',
    iconBg: 'bg-red-100',
  },
  {
    id: '2',
    ingredientName: 'Kartoffeln',
    updatedBy: 'Markus Eder',
    updateType: 'Added',
    amount: '+20 kg',
    icon: '🥔',
    iconBg: 'bg-amber-100',
  },
  {
    id: '3',
    ingredientName: 'Emmentaler Käse',
    updatedBy: 'Markus Eder',
    updateType: 'Added',
    amount: '+3 kg',
    icon: '🧀',
    iconBg: 'bg-yellow-100',
  },
  {
    id: '4',
    ingredientName: 'Butter',
    updatedBy: 'Sophie Berger',
    updateType: 'Used',
    amount: '-2 kg',
    icon: '🧈',
    iconBg: 'bg-yellow-50',
  },
  {
    id: '5',
    ingredientName: 'Eier',
    updatedBy: 'Sophie Berger',
    updateType: 'Used',
    amount: '-24 Stück',
    icon: '🥚',
    iconBg: 'bg-orange-100',
  },
];

// Revenue summary for chart header
export const revenueSummary = {
  total: 12458,
  change: 23.5,
  changeType: 'increase' as const,
  year: 2025,
};

// Net profit summary
export const netProfitSummary = {
  period: 'Diese Woche',
};
