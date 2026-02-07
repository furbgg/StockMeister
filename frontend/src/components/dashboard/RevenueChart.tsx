import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import {
  revenueChartData,
  revenueChartDataLastYear,
  netProfitChartData,
  netProfitChartDataLastWeek,
  revenueSummary,
} from '@/data/mockDashboardData';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

// Count-up animation hook
const useCountUp = (end: number, duration: number = 1500, delay: number = 0) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, delay]);

  return count;
};

// Custom tooltip for revenue chart
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-[#16213e] px-4 py-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200">
        <p className="text-xs text-slate-300 mb-1">{label}</p>
        <p className="text-lg font-bold text-white">
          €{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for net profit
const NetProfitTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-[#16213e] px-4 py-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200">
        <p className="text-xs text-slate-300 mb-1">{label}</p>
        <p className="text-lg font-bold text-white">
          €{payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export const NetProfitChart = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const { t } = useTranslation();

  // Data State
  const [timeframe, setTimeframe] = useState<'ThisWeek' | 'LastWeek'>('ThisWeek');
  const [data, setData] = useState(netProfitChartData);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Handle data switch with simulated loading/delay if desired, but instant is fine
  const handleTimeframeChange = (newTimeframe: 'ThisWeek' | 'LastWeek') => {
    setTimeframe(newTimeframe);
    setData(newTimeframe === 'ThisWeek' ? netProfitChartData : netProfitChartDataLastWeek);
  };

  return (
    <Card
      className={cn(
        "h-full border border-purple-100/50 bg-purple-50/60 shadow-sm transition-all duration-500 cursor-default overflow-hidden relative rounded-lg",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        isHovered ? "shadow-md scale-[1.01] border-blue-200" : "hover:shadow-md"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6 relative z-10">
        <CardTitle className={cn(
          "text-base font-bold transition-colors duration-300 text-slate-800",
          isHovered ? "text-[#16213e]" : ""
        )}>{t('dashboard.net_profit')}</CardTitle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-normal bg-white/50 border-blue-100 text-[#16213e] transition-all duration-300 hover:scale-105 hover:bg-blue-100/50 hover:border-blue-200"
            >
              <Calendar className="h-3.5 w-3.5" />
              {timeframe === 'ThisWeek' ? t('dashboard.this_week') : t('dashboard.last_week')}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleTimeframeChange('ThisWeek')}>
              {t('dashboard.this_week')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTimeframeChange('LastWeek')}>
              {t('dashboard.last_week')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0 relative z-10">
        <div className={cn(
          "w-full h-[200px] transition-all duration-500",
          isHovered ? "scale-105" : ""
        )}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 30, right: 5, left: 5, bottom: 5 }}
              barCategoryGap="25%"
              onMouseMove={(state) => {
                if (state.activeTooltipIndex !== undefined) {
                  setHoveredBar(Number(state.activeTooltipIndex));
                }
              }}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <defs>
                <linearGradient id="netProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16213e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#16213e" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                dy={8}
                tickFormatter={(value) => {
                  const dayMap: { [key: string]: string } = {
                    'Mo': 'mo', 'Di': 'tu', 'Mi': 'we', 'Do': 'th', 'Fr': 'fr', 'Sa': 'sa', 'So': 'su'
                  };
                  // Handle both English and German inputs just in case
                  const key = dayMap[value] || value.toLowerCase().slice(0, 2);
                  return t(`dashboard.days.${key}`);
                }}
              />
              <YAxis hide />
              <Tooltip content={<NetProfitTooltip />} cursor={{ fill: 'rgba(124, 49, 118, 0.05)', radius: 8 }} />
              <Bar
                dataKey="profit"
                radius={[8, 8, 8, 8]}
                barSize={14}
                animationDuration={1000}
                animationBegin={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="url(#netProfitGradient)"
                    fillOpacity={hoveredBar === index ? 1 : entry.isHighlighted ? 1 : 0.5}
                    className="transition-all duration-300"
                    style={{
                      filter: hoveredBar === index ? 'brightness(1.2) drop-shadow(0 4px 6px rgba(22, 33, 62, 0.3))' : 'none',
                      transform: hoveredBar === index ? 'scaleY(1.05)' : 'scaleY(1)',
                      transformOrigin: 'bottom'
                    }}
                  />
                ))}
                <LabelList
                  dataKey="profit"
                  position="top"
                  content={({ x, y, value, index }: any) => {
                    const entry = data[index];
                    if (entry?.isHighlighted) {
                      return (
                        <g className="animate-in fade-in zoom-in duration-500 delay-300">
                          <rect
                            x={(x as number) - 16}
                            y={(y as number) - 24}
                            width={32}
                            height={20}
                            rx={6}
                            fill="#16213e" // Brand blue badge for highlighted items
                            className="drop-shadow-sm"
                          />
                          <text
                            x={x}
                            y={(y as number) - 10}
                            fill="white"
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="700"
                          >
                            {value}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Star indicators */}
        <div className="flex justify-around px-4 -mt-2 opacity-50">
          {/* Just visual decoration, kept from previous iteration but cleaner */}
        </div>
      </CardContent>
    </Card>
  );
};

export const RevenueChart = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  // Data State
  const [timeframe, setTimeframe] = useState<'2025' | '2024'>('2025');
  const [chartData, setChartData] = useState(revenueChartData);
  const [totalRevenue, setTotalRevenue] = useState(revenueSummary.total);
  const [growth, setGrowth] = useState(revenueSummary.change);

  const animatedTotal = useCountUp(isVisible ? totalRevenue : 0, 2000, 300);
  const animatedChange = useCountUp(isVisible ? Math.abs(growth) : 0, 1500, 800);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleTimeframeChange = (newTimeframe: '2025' | '2024') => {
    setTimeframe(newTimeframe);
    if (newTimeframe === '2025') {
      setChartData(revenueChartData);
      setTotalRevenue(12458);
      setGrowth(23.5);
    } else {
      setChartData(revenueChartDataLastYear);
      setTotalRevenue(9850);
      setGrowth(-5.2);
    }
  };

  return (
    <Card
      className={cn(
        "h-full border border-purple-100/50 bg-purple-50/60 shadow-sm transition-all duration-500 cursor-default overflow-hidden relative rounded-lg",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        isHovered ? "shadow-md scale-[1.01] border-blue-200" : "hover:shadow-md"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6 relative z-10">
        <CardTitle className={cn(
          "text-base font-bold transition-colors duration-300 text-slate-800",
          isHovered ? "text-[#16213e]" : ""
        )}>{t('dashboard.revenue')}</CardTitle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-normal bg-white/50 border-blue-100 text-[#16213e] transition-all duration-300 hover:scale-105 hover:bg-blue-100/50 hover:border-blue-200"
            >
              <Calendar className="h-3.5 w-3.5" />
              {timeframe}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleTimeframeChange('2025')}>
              2025 (Projected)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTimeframeChange('2024')}>
              2024 (Historical)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0 relative z-10">
        {/* Revenue Summary */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-bold tabular-nums transition-all duration-300",
              isHovered ? "text-[#16213e] scale-105 origin-left" : "text-gray-900"
            )}>
              €{animatedTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className={cn(
              "flex items-center text-sm font-medium tabular-nums px-2 py-0.5 rounded-full transition-all duration-300",
              growth >= 0 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100",
              isHovered ? "scale-105" : ""
            )}>
              {growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {growth >= 0 ? '+' : '-'}{animatedChange}%
            </span>
            <span className="text-sm text-slate-400 ml-2">{t('dashboard.from_last_year')}</span>
          </div>
        </div>

        {/* Chart */}
        <div className={cn(
          "w-full h-[220px] transition-all duration-500",
          isHovered ? "scale-[1.01]" : ""
        )}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}

            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16213e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#16213e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                dy={10}
                tickFormatter={(value) => t(`dashboard.months.${value.toLowerCase()}`)}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(value) => `€${value / 1000}k`}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#16213e', strokeWidth: 2, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#16213e"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;

