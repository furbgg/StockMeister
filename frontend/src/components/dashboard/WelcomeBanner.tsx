import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { dashboardSummary } from '@/data/mockDashboardData';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns';
import { useTranslation, Trans } from 'react-i18next';
import { enUS, de, tr, hr } from 'date-fns/locale';

// Count-up hook for orders
const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

export const WelcomeBanner = () => {
  const { user } = useAuth();
  const displayName = user?.username || dashboardSummary.userName;
  const [isVisible, setIsVisible] = useState(false);
  const { t, i18n } = useTranslation();

  // Date state
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  });

  const animatedOrders = useCountUp(61, 1500);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDateChange = (type: 'this-week' | 'last-week') => {
    const today = new Date();
    if (type === 'this-week') {
      setDateRange({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
      });
    } else {
      const lastWeek = subWeeks(today, 1);
      setDateRange({
        start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        end: endOfWeek(lastWeek, { weekStartsOn: 1 })
      });
    }
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'de': return de;
      case 'tr': return tr;
      case 'hr': return hr;
      default: return enUS;
    }
  };

  const formattedDateRange = `${format(dateRange.start, 'd MMM yyyy', { locale: getDateLocale() })} - ${format(dateRange.end, 'd MMM yyyy', { locale: getDateLocale() })}`;

  return (
    <div className={cn(
      "relative bg-purple-50 dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-purple-100 dark:border-slate-700 transition-all duration-700 overflow-hidden",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-100 to-rose-100 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <img
              src="/logo.png"
              alt="StockMeister"
              className="relative h-14 w-auto drop-shadow-sm transform transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {t('dashboard.welcome', { name: displayName }).split(',')[0]}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3176] to-[#9b4d94]">{displayName}</span>
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Trans i18nKey="dashboard.orders_today" count={animatedOrders}>
                You have
                <span className="font-bold text-[#7c3176] bg-purple-50 px-2 py-0.5 rounded-full text-sm border border-purple-100 tabular-nums">
                  +{animatedOrders}
                </span>
                Orders, Today
              </Trans>
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-blue-50/50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-[#7c3176] hover:border-purple-100 transition-all duration-300 shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">{formattedDateRange}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleDateChange('this-week')}>
              {t('dashboard.this_week')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDateChange('last-week')}>
              {t('dashboard.last_week')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default WelcomeBanner;
