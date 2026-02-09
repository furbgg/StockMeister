import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, Cell } from 'recharts';
import { statsCardsData, type StatCardData } from '@/data/mockDashboardData';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ingredientService, Ingredient } from '@/services/ingredientService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  data: StatCardData;
  index: number;
  realLowStockData?: Ingredient[];
}

const StatCard = ({ data, index, realLowStockData }: StatCardProps) => {
  const Icon = data.icon;
  const isPositive = data.changeType === 'increase';
  const [isHovered, setIsHovered] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Determine value to display (Real data vs Mock data)
  const displayValue = realLowStockData
    ? realLowStockData.length
    : (typeof data.value === 'string'
      ? parseFloat(data.value.replace(/[^0-9.]/g, ''))
      : data.value);

  const prefix = typeof data.value === 'string' && data.value.includes('€') ? '€' : '';

  // Color and Style Configuration
  // Unified Lacivert Blue Theme for all cards
  const getCardStyle = () => {
    return {
      wrapper: "bg-purple-50/60 dark:bg-slate-900/60 border-purple-100/50 dark:border-slate-700 hover:border-[#16213e]/20 dark:hover:border-slate-600",
      iconBox: "bg-[#16213e] text-white shadow-lg shadow-blue-900/20",
      barColor: "#16213e",
      hoverText: "text-[#16213e]",
      pattern: "none" // We use absolute overlay instead
    };
  };

  const style = getCardStyle();

  const chartData = data.sparklineData.map((value, idx) => ({ index: idx, value }));

  // Popover Content based on card type
  const renderPopoverContent = () => {
    if (data.title.includes("Low Stock")) {
      const itemsToDisplay = realLowStockData
        ? realLowStockData.slice(0, 3)
        : [
          { name: 'Butter', currentStock: '2', unit: 'kg', minimumStock: '10' },
          { name: 'Eggs', currentStock: '15', unit: 'pcs', minimumStock: '50' },
          { name: 'Flour', currentStock: '5', unit: 'kg', minimumStock: '25' }
        ];

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-semibold text-white">{t('dashboard.critical_items')}</span>
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] bg-rose-500/20 text-rose-200 border-rose-500/20">{t('dashboard.action_needed')}</Badge>
          </div>
          <div className="space-y-2">
            {itemsToDisplay.map((item: any, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-200">{item.name}</span>
                <span className="text-rose-300 font-mono">
                  {item.currentStock} {item.unit} <span className="text-slate-400 text-xs">/ {item.minimumStock} {item.unit}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-white/10 text-center">
            <button
              className="text-xs text-amber-300 hover:text-amber-200 transition-colors w-full text-center"
              onClick={() => navigate('/low-stock')}
            >
              {t('dashboard.view_all_low_stock')}
            </button>
          </div>
        </div>
      );
    }
    if (data.title.includes("Stock Value") || data.id === 'stock-value') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-semibold text-white">{t('dashboard.value_distribution')}</span>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>{t('dashboard.meat_poultry')}</span>
                <span>45%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 w-[45%]" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>{t('dashboard.dairy')}</span>
                <span>30%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500/80 w-[30%]" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Vegetables</span>
                <span>25%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600/60 w-[25%]" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasPopover = data.title.includes("Low Stock") || data.title.includes("Stock Value");

  return (
    <div className="relative group">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card
          className={cn(
            "relative shadow-sm rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer z-10 border",
            style.wrapper,
            isHovered ? "shadow-xl -translate-y-1 ring-1 ring-black/5" : "hover:shadow-md"
          )}
          onMouseEnter={() => {
            setIsHovered(true);
            if (hasPopover) setShowPopover(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            if (hasPopover) setShowPopover(false);
          }}
          onClick={() => {
            if (data.title.includes("Low Stock")) {
              navigate('/low-stock');
            }
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/10 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/10 pointer-events-none" />
          <CardContent className="p-5 relative z-20">
            {/* Top Row: Title and Badge */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Icon className={cn(
                  "h-4 w-4 transition-all duration-500",
                  isHovered ? "text-[#16213e] dark:text-blue-300 scale-110" : "text-slate-400 dark:text-slate-500"
                )} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500/80 dark:text-slate-400">{t(`dashboard.${data.id.replace(/-/g, '_')}`)}</p>
              </div>
              <Badge
                className={cn(
                  "px-2 py-0.5 rounded-full font-bold text-[10px] transition-all duration-300 border-0",
                  isPositive ? "bg-blue-100/50 text-[#16213e]" : "bg-rose-100/50 text-rose-700",
                  isHovered ? "scale-105" : ""
                )}
              >
                {isPositive ? '↑' : '↓'}{data.change}%
              </Badge>
            </div>

            {/* Middle Row: Balanced Value */}
            <div className="flex flex-col mb-1">
              <div className={cn(
                "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none tabular-nums transition-all duration-500",
                isHovered ? "scale-105 transform-gpu" : ""
              )}>
                <CountUp
                  start={0}
                  end={displayValue}
                  duration={2.5}
                  separator="."
                  decimals={displayValue % 1 !== 0 ? 2 : 0}
                  prefix={prefix}
                />
              </div>
            </div>

            {/* Bottom Row: Enhanced Sparkline */}
            <div className="flex justify-end mt-1">
              <div className={cn(
                "h-[40px] w-[100px] transition-all duration-500 origin-right",
                isHovered ? "scale-110" : "opacity-40 grayscale"
              )}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar
                      dataKey="value"
                      fill={style.barColor}
                      radius={[1, 1, 0, 0]}
                      barSize={4}
                    >
                      {chartData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fillOpacity={isHovered ? 1 : 0.5}
                          className="transition-all duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interactive Popover */}
      <AnimatePresence>
        {showPopover && hasPopover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[85%] left-0 right-0 pt-2 z-50"
            style={{ width: '110%', left: '-5%' }}
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
          >
            <div className="bg-[#1e293b]/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10 text-white pointer-events-auto">
              {renderPopoverContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const StatsCards = () => {
  const { data: lowStockIngredients } = useQuery({
    queryKey: ['ingredients', 'low-stock-only'],
    queryFn: ingredientService.getLowStockOnly,
  });

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {statsCardsData.map((data, index) => (
        <StatCard
          key={data.id}
          data={data}
          index={index}
          realLowStockData={data.title.includes("Low Stock") ? lowStockIngredients : undefined}
        />
      ))}
    </div>
  );
};


