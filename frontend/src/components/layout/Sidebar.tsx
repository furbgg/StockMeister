import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  AlertTriangle,
  Trash2,
  ClipboardList,
  Calculator,
  LogOut,
  Settings,
  Users,
  ChevronRight
} from 'lucide-react';

// --- 1. MENU STRUCTURE (Hardcoded - Guaranteed to work) ---
// No external import to eliminate error risk.
const MENU_SECTIONS = [
  {
    id: 'main',
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    ]
  },
  {
    id: 'kitchen',
    title: 'Kitchen & Menu',
    items: [
      { id: 'recipes', label: 'Recipes', icon: UtensilsCrossed, href: '/recipes' },
      { id: 'ingredients', label: 'Ingredients', icon: ChefHat, href: '/ingredients' },
      { id: 'low-stock', label: 'Low Stocks', icon: AlertTriangle, href: '/low-stock' },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory Control',
    items: [
      { id: 'stock-count', label: 'Stock Count', icon: ClipboardList, href: '/stock-count' },
      { id: 'waste', label: 'Waste Management', icon: Trash2, href: '/waste' },
    ]
  },
  {
    id: 'sales',
    title: 'Sales',
    items: [
      { id: 'pos', label: 'POS System', icon: Calculator, href: '/pos' },
    ]
  },
  {
    id: 'users',
    title: 'User Management',
    items: [
      { id: 'staff', label: 'Staff / Users', icon: Users, href: '/staff' },
    ]
  },
  {
    id: 'settings',
    title: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
      { id: 'logout', label: 'Logout', icon: LogOut, href: '/logout' }, // Logout özel işlem
    ]
  }
];

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
  isOpen?: boolean;
}

export const Sidebar = ({ className, onItemClick, isOpen = true }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation();



  const handleNavigate = (href: string) => {
    if (href === '/logout') {
      logout();
      // AuthContext zaten redirect yapabilir ama garanti olsun
      navigate('/login');
    } else {
      navigate(href);
    }
    onItemClick?.();
  };

  // --- 2. VISIBILITY LOGIC (Simple and Clear) ---
  const isItemVisible = (itemId: string): boolean => {
    if (!user) return false;

    const role = user.role; // Role from AuthContext

    // RULE 1: ADMIN SEES EVERYTHING
    if (role === 'ADMIN') return true;

    // RULE 2: VISIBLE TO ALL
    if (['settings', 'logout'].includes(itemId)) return true;

    // RULE 3: ROLE SPECIFIC PERMISSIONS
    switch (role) {
      case 'CHEF':
        // Chef: Kitchen + Stock info
        return ['recipes', 'ingredients', 'low-stock', 'waste'].includes(itemId);

      case 'INVENTORY_MANAGER':
        // Inventory Manager: Stock Count + Waste + Ingredients
        return ['stock-count', 'waste', 'low-stock', 'ingredients'].includes(itemId);

      case 'WAITER':
        // Waiter: POS only
        return ['pos'].includes(itemId);

      default:
        return false;
    }
  };

  // Is there any visible item in a section?
  const isSectionVisible = (sectionItems: any[]) => {
    return sectionItems.some(item => isItemVisible(item.id));
  };

  return (
    <aside className={cn(
      'flex h-full flex-col border-r border-slate-200/60 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-900 transition-all duration-300 ease-in-out shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 z-20',
      isOpen ? 'w-72 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 overflow-hidden',
      className
    )}>
      {/* Logo Section - Command Center Redesign */}
      <div className="relative h-32 flex flex-col items-center justify-center border-b border-slate-200/40 dark:border-slate-700/40 bg-gradient-to-b from-slate-100/80 via-slate-100/40 to-slate-100/20 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-900/20 overflow-hidden px-2">
        {/* Ambient Deep Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-purple-100/20 blur-[50px] rounded-full pointer-events-none" />

        {/* Top System Metadata Bar */}
        <div className="absolute top-3 left-0 right-0 px-6 flex justify-between items-center opacity-40 pointer-events-none">
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Terminal v1.0.0</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Core: Active</span>
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-3 group mt-4">
          {/* Main Brand Plate */}
          <div className="relative">
            {/* Luminous Portal Effect */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-purple-100/50 to-indigo-50/30 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>

            {/* Logo Shield */}
            <div className="relative flex h-28 w-full items-center justify-center transition-all duration-500 overflow-hidden">
              <img
                src="/logo.png"
                alt="StockMeister"
                className="relative h-26 w-full object-contain transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          </div>

          {/* Brand Tagline Section */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-4 bg-gradient-to-r from-transparent to-[#7c3176]/20" />
              <span className="text-[9px] font-black text-[#7c3176] uppercase tracking-[0.3em] opacity-80">StockMeister</span>
              <div className="h-[1px] w-4 bg-gradient-to-l from-transparent to-[#7c3176]/20" />
            </div>
            <span className="text-[7px] font-bold text-slate-300 uppercase tracking-[0.4em] translate-y-[-2px]">Professional Series</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {MENU_SECTIONS.map((section, index) => {
            // Eğer bu bölümde kullanıcının göreceği hiçbir şey yoksa, bölümü gizle
            if (!isSectionVisible(section.items)) return null;

            return (
              <div key={section.id}>
                {index > 0 && <Separator className="my-2 mx-4" />}

                <div className="px-2 py-2">
                  <h4 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t(`sidebar.${section.id}`)}
                  </h4>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      // Eleman görünür mü?
                      if (!isItemVisible(item.id)) return null;

                      const isActive = location.pathname === item.href;

                      return (
                        <Button
                          key={item.id}
                          variant="ghost"
                          onClick={() => handleNavigate(item.href)}
                          className={cn(
                            'w-full justify-start gap-3 h-10 px-3 font-medium transition-all duration-200',
                            // Custom navigation styling
                            isActive
                              ? 'bg-blue-50 dark:bg-purple-900/30 text-[#7C3176] dark:text-purple-300 shadow-sm border border-blue-100 dark:border-purple-800/50 hover:bg-[#7C3176] hover:text-white hover:border-[#7C3176]'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#7C3176] dark:hover:text-purple-300 hover:translate-x-1'
                          )}
                        >
                          <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                          <span className="truncate font-medium">{t(`sidebar.${item.id}`)}</span>

                          {/* Arrow indicator for active state */}
                          {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-70 animate-in fade-in slide-in-from-left-1" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-slate-200/40 dark:border-slate-700/40 p-4 bg-transparent space-y-3">
        {/* Language Switcher */}
        <LanguageSwitcher />
        <div className="flex items-center gap-3 p-2 rounded-xl bg-purple-50/40 dark:bg-purple-900/20 backdrop-blur-sm border border-purple-100/30 dark:border-purple-800/30 transition-all hover:bg-purple-100/50 dark:hover:bg-purple-900/30 hover:shadow-sm cursor-pointer group">
          {/* Kullanıcı Bilgisi (Mini Profil) */}
          <div className="h-10 w-10 rounded-full bg-[#16213e] flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:scale-110 transition-transform duration-300">
            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#7C3176] transition-colors">{user?.username || 'User'}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</span>
          </div>
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" onClick={(e) => {
            e.stopPropagation();
            handleNavigate('/logout');
          }} />
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wide">
          STOCKMEISTER v1.0.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;