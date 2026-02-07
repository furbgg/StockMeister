import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { recentSales, recentStockUpdates } from '@/data/mockDashboardData';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  showArrow?: boolean;
  variant?: 'purple' | 'rose' | 'blue';
}

const AnimatedListItem = ({ children, index, isHovered, onHover, showArrow = false, variant = 'purple' }: AnimatedListItemProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100 + 300);
    return () => clearTimeout(timer);
  }, [index]);

  const variantStyles = {
    purple: "bg-purple-100/50 ring-purple-200",
    rose: "bg-purple-100/50 ring-purple-200",
    blue: "bg-purple-100/50 ring-purple-200"
  };

  return (
    <div
      className={cn(
        "group relative transition-all duration-500 rounded-xl p-3 -mx-2",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
        isHovered ? `${variantStyles[variant]} scale-[1.02] shadow-sm ring-1` : "hover:bg-slate-50"
      )}
      style={{ transitionDelay: `${index * 50}ms` }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {children}
      {showArrow && (
        <div className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300",
          variant === 'rose' ? "text-rose-600" : "text-[#7c3176]",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
        )}>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export const RecentSales = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setCardVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className={cn(
      "h-full border border-purple-100 bg-purple-50 shadow-sm transition-all duration-500 hover:shadow-md overflow-hidden relative rounded-lg",
      cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6 relative z-10">
        <CardTitle className="text-base font-bold text-purple-950">{t('dashboard.recent_sales')}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 relative z-10">
        <div className="space-y-2">
          {recentSales.map((sale, index) => (
            <AnimatedListItem
              key={sale.id}
              index={index}
              isHovered={hoveredIndex === index}
              onHover={(h) => setHoveredIndex(h ? index : null)}
              showArrow
              variant="rose"
            >
              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-lg shrink-0 transition-all duration-300 shadow-sm border border-[#16213e]/10 bg-[#16213e] text-white',
                      hoveredIndex === index ? 'scale-110 rotate-6 shadow-md border-rose-100' : ''
                    )}
                  >
                    {sale.icon}
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <p className={cn(
                      "font-medium text-sm truncate transition-colors duration-200",
                      hoveredIndex === index ? "text-purple-700 font-semibold" : "text-gray-900"
                    )}>{sale.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-white border border-purple-100 px-1 py-0.5 rounded text-[#7c3176]/70">
                        {sale.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span>{sale.date}</span>
                    </p>
                  </div>
                </div>

                {/* Quantity */}
                <span className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-full border transition-all duration-300",
                  hoveredIndex === index
                    ? "bg-purple-100 text-[#7c3176] border-purple-200 shadow-sm"
                    : "bg-white text-slate-600 border-slate-100"
                )}>
                  +{sale.quantity}
                </span>
              </div>
            </AnimatedListItem>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const RecentStockUpdates = () => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setCardVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className={cn(
      "h-full border border-purple-100 bg-purple-50 shadow-sm transition-all duration-500 hover:shadow-md overflow-hidden relative rounded-lg",
      cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6 relative z-10">
        <CardTitle className="text-base font-bold text-purple-950">{t('dashboard.recent_stock_updates')}</CardTitle>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-muted-foreground hover:text-purple-700 text-xs transition-all duration-200 hover:scale-105"
          onClick={() => navigate('/stock-count')}
        >
          {t('dashboard.view_all')}
        </Button>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 relative z-10">
        <div className="space-y-2">
          {recentStockUpdates.map((update, index) => {
            const isPositive = update.amount.startsWith('+');
            const isNegative = update.amount.startsWith('-');

            return (
              <AnimatedListItem
                key={update.id}
                index={index}
                isHovered={hoveredIndex === index}
                onHover={(h) => setHoveredIndex(h ? index : null)}
                variant="blue"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl text-lg shrink-0 transition-all duration-300 shadow-sm border border-[#16213e]/10 bg-[#16213e] text-white',
                        hoveredIndex === index ? 'scale-110 rotate-6 shadow-md border-blue-100' : ''
                      )}
                    >
                      {update.icon}
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <p className={cn(
                        "font-medium text-sm truncate transition-colors duration-200",
                        hoveredIndex === index ? "text-purple-700 font-semibold" : "text-gray-900"
                      )}>{update.ingredientName}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <span className="text-slate-400">{t('dashboard.by')}</span>
                        <span>{update.updatedBy}</span>
                      </p>
                    </div>
                  </div>

                  {/* Amount Badge */}
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full border transition-all duration-300",
                    isPositive
                      ? "bg-blue-50 text-[#16213e] border-blue-100"
                      : isNegative
                        ? "bg-rose-50 text-rose-600 border-rose-100"
                        : "bg-slate-50 text-slate-600 border-slate-100",
                    hoveredIndex === index ? "scale-105 shadow-sm" : ""
                  )}>
                    {update.amount}
                  </span>
                </div>
              </AnimatedListItem>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const RecentActivity = () => {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <RecentSales />
      <RecentStockUpdates />
    </div>
  );
};

export default RecentActivity;
