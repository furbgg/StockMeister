import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Monitor,
  ChevronDown,
  LogOut,
  User,
  Settings,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  PackageX,
  Package,
  Trash2,
  Check,
  Utensils,
  UserPlus,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationStore, Notification } from '@/stores/useNotificationStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  className?: string;
  onToggleSidebar?: () => void;
}

const kitchens = [
  { id: 'main', name: 'Main Kitchen', emoji: '🔥' },
  { id: 'prep', name: 'Prep Kitchen', emoji: '🥗' },
  { id: 'pastry', name: 'Pastry Kitchen', emoji: '🍰' },
];

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Get icon and colors for notification type
const getNotificationStyle = (type: Notification['type']) => {
  switch (type) {
    case 'low-stock':
      return { icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' };
    case 'out-of-stock':
      return { icon: PackageX, color: 'text-red-500', bg: 'bg-red-50' };
    case 'order':
      return { icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'success':
      return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' };
    case 'error':
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
    default:
      return { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50' };
  }
};

export const Header = ({ className, onToggleSidebar }: HeaderProps) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState(kitchens[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Notification store
  const {
    notifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotificationStore();

  const unreadCount = getUnreadCount();

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Search items
  const searchItems = [
    { label: t('sidebar.dashboard'), path: '/', keywords: ['dashboard', 'home', 'anasayfa', 'übersicht', 'startseite'], icon: '📊' },
    { label: t('sidebar.recipes'), path: '/recipes', keywords: ['recipe', 'rezept', 'tarif', 'menü', 'menu', 'schnitzel', 'gericht', 'yemek'], icon: '🍳' },
    { label: t('sidebar.ingredients'), path: '/ingredients', keywords: ['ingredient', 'zutat', 'malzeme', 'bestand', 'envanter', 'stok'], icon: '🥕' },
    { label: t('sidebar.low-stock'), path: '/low-stock', keywords: ['low', 'stock', 'alert', 'warnung', 'düşük', 'niedrig', 'uyarı'], icon: '⚠️' },
    { label: t('sidebar.stock-count'), path: '/stock-count', keywords: ['count', 'inventur', 'sayım', 'zählung', 'kontrol'], icon: '📋' },
    { label: t('sidebar.waste'), path: '/waste', keywords: ['waste', 'abfall', 'atık', 'israf', 'müll'], icon: '🗑️' },
    { label: t('sidebar.pos'), path: '/pos', keywords: ['pos', 'order', 'kasse', 'bestellung', 'sipariş', 'tisch', 'table', 'masa'], icon: '💳' },
    { label: t('sidebar.staff'), path: '/staff', keywords: ['staff', 'personal', 'user', 'admin', 'chef', 'waiter', 'mitarbeiter', 'kullanıcı', 'personel'], icon: '👥' },
    { label: t('sidebar.settings'), path: '/settings', keywords: ['settings', 'einstellung', 'ayar', 'config', 'sicherheit', 'güvenlik', '2fa'], icon: '⚙️' },
  ];

  const filteredItems = searchQuery.trim()
    ? searchItems.filter(item => {
        const q = searchQuery.trim().toLowerCase();
        return item.label.toLowerCase().includes(q) || item.keywords.some(k => k.includes(q));
      })
    : searchItems;

  const handleSearchNavigate = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setSearchFocused(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredItems.length > 0) {
      handleSearchNavigate(filteredItems[0].path);
    }
    if (e.key === 'Escape') {
      setSearchFocused(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.type === 'low-stock' || notification.type === 'out-of-stock') {
      navigate('/low-stock');
    } else if (notification.type === 'order') {
      navigate('/orders');
    }
  };

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between px-4 lg:px-6 sticky top-0 z-50 transition-all duration-300',
        'bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60',
        className
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:bg-slate-100">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <Sidebar onItemClick={() => setMobileMenuOpen(false)} isOpen={true} className="w-full shadow-none" />
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex text-slate-500 hover:bg-slate-100 hover:text-[#7C3176] transition-colors"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar with Dropdown */}
        <div ref={searchRef} className="relative hidden md:flex w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7C3176] transition-colors z-10" />
          <Input
            placeholder={t('header.search_placeholder')}
            className="w-full !pl-10 pr-4 h-10 bg-blue-50 border-blue-100 focus:bg-white focus:ring-[#7C3176]/20 focus:border-[#7C3176]/50 transition-all duration-300 rounded-xl shadow-sm"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); }}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden z-50">
              <div className="max-h-[320px] overflow-y-auto py-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <button
                      key={item.path}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      onMouseDown={() => handleSearchNavigate(item.path)}
                    >
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-300 dark:text-slate-500" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    {t('common.noData')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Kitchen/Location Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10 px-3 rounded-full hover:bg-white/60 transition-all">
              <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-sm">
                  {selectedKitchen.emoji}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-xs font-medium text-slate-500">{t('header.select_kitchen')}</p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  {t(`common.kitchens.${selectedKitchen.id}_kitchen`)}
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 mt-2 p-2">
            <DropdownMenuLabel className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 px-2">
              {t('header.select_kitchen')}
            </DropdownMenuLabel>
            {kitchens.map((kitchen) => (
              <DropdownMenuItem
                key={kitchen.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                  selectedKitchen.id === kitchen.id ? "bg-purple-50" : "hover:bg-slate-50"
                )}
                onClick={() => setSelectedKitchen(kitchen)}
              >
                <Avatar className="h-8 w-8 ring-1 ring-slate-100">
                  <AvatarFallback className="bg-slate-100 text-base">
                    {kitchen.emoji}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium text-sm",
                    selectedKitchen.id === kitchen.id ? "text-purple-700" : "text-slate-700"
                  )}>
                    {t(`common.kitchens.${kitchen.id}_kitchen`)}
                  </p>
                </div>
                {selectedKitchen.id === kitchen.id && (
                  <Check className="h-4 w-4 text-purple-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Add Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex border-blue-200/50 bg-blue-50 text-[#16213e] hover:bg-blue-100 hover:border-blue-300 hover:text-[#16213e] h-9 rounded-lg transition-all shadow-sm shadow-blue-100">
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">{t('header.quick_add')}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1">
            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">{t('header.quick_actions')}</DropdownMenuLabel>
            <DropdownMenuSeparator className="-mx-1 my-1 bg-slate-100" />
            <DropdownMenuItem onClick={() => navigate('/recipes')} className="cursor-pointer rounded-lg p-2 focus:bg-[#7C3176]/5 focus:text-[#7C3176]">
              <div className="p-1.5 rounded-md bg-orange-100 text-orange-600 mr-2">
                <Utensils className="h-4 w-4" />
              </div>
              <span className="font-medium">{t('header.add_recipe')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/ingredients')} className="cursor-pointer rounded-lg p-2 focus:bg-[#7C3176]/5 focus:text-[#7C3176]">
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 mr-2">
                <Package className="h-4 w-4" />
              </div>
              <span className="font-medium">{t('header.add_ingredient')}</span>
            </DropdownMenuItem>
            {user?.role === 'ADMIN' && (
              <DropdownMenuItem onClick={() => navigate('/staff')} className="cursor-pointer rounded-lg p-2 focus:bg-[#7C3176]/5 focus:text-[#7C3176]">
                <div className="p-1.5 rounded-md bg-purple-100 text-purple-600 mr-2">
                  <UserPlus className="h-4 w-4" />
                </div>
                <span className="font-medium">{t('header.add_user')}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        {/* POS */}
        <Button
          size="sm"
          className="gap-2 bg-blue-50 text-[#16213e] border border-blue-100 hover:bg-[#16213e] hover:text-white hover:border-[#16213e] h-9 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 px-4 font-semibold"
          onClick={() => navigate('/pos')}
        >
          <Monitor className="h-4 w-4" />
          <span className="hidden sm:inline">POS</span>
        </Button>

        {/* Notifications - Updated to use store */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-[#7C3176] transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#7C3176]" />
                <span className="font-semibold text-sm text-slate-800">{t('header.notifications.title')}</span>
                {unreadCount > 0 && (
                  <span className="bg-[#7C3176] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-slate-500 hover:text-[#7C3176] hover:bg-white rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      markAllAsRead();
                    }}
                  >
                    {t('header.notifications.mark_read')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-white rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      clearAllNotifications();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-[320px]">
              <div className="flex flex-col">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <div className="bg-slate-50 p-3 rounded-full mb-3">
                      <Bell className="h-6 w-6 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">{t('header.notifications.empty_title')}</p>
                    <p className="text-xs opacity-70 mt-1">{t('header.notifications.empty_desc')}</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const style = getNotificationStyle(notif.type);
                    const Icon = style.icon;

                    return (
                      <DropdownMenuItem
                        key={notif.id}
                        className={cn(
                          "flex items-start gap-3 p-4 cursor-pointer border-b border-slate-50 last:border-0 focus:bg-slate-50",
                          !notif.read ? "bg-[#7c3176]/5" : "hover:bg-slate-50"
                        )}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className={cn("rounded-full p-2 shrink-0 shadow-sm", style.bg)}>
                          <Icon className={cn("h-4 w-4", style.color)} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-sm truncate",
                              !notif.read ? "font-bold text-slate-900" : "font-medium text-slate-700"
                            )}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatRelativeTime(notif.time)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {notif.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <Button
                  variant="ghost"
                  className="w-full h-8 text-xs font-medium text-[#7c3176] hover:text-[#7c3176] hover:bg-[#7c3176]/10 rounded-lg"
                  onClick={() => navigate('/low-stock')}
                >
                  {t('header.notifications.view_all')}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 p-0.5 border border-slate-200 hover:border-[#7C3176] transition-colors focus:ring-2 focus:ring-[#7C3176]/20">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.username ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=16213e&color=fff&size=40` : undefined} />
                <AvatarFallback className="bg-[#16213e] text-white text-xs font-bold">
                  {getInitials(user?.username || '')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-2">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1 px-1">
                <p className="text-sm font-bold text-slate-900">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-500">admin@stockmeister.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2 bg-slate-100" />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg cursor-pointer py-2 focus:bg-slate-50 focus:text-[#7C3176] font-medium">
              <User className="mr-2 h-4 w-4 text-slate-400 group-hover:text-[#7C3176]" /> {t('header.profile.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg cursor-pointer py-2 focus:bg-slate-50 focus:text-[#7C3176] font-medium">
              <Settings className="mr-2 h-4 w-4 text-slate-400 group-hover:text-[#7C3176]" /> {t('header.profile.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-slate-100" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer py-2 text-red-600 focus:bg-red-50 focus:text-red-700 font-medium">
              <LogOut className="mr-2 h-4 w-4" /> {t('header.profile.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
