import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { startOfMonth, subMonths, isAfter, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Custom active shape for pie chart
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-lg transition-all duration-300"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        fillOpacity={0.3}
      />
    </g>
  );
};

const COLORS = ['#16213e', '#1a2a4e', '#2c3e6d', '#415a91', '#5d76ab']; // Brand Blue Tones

type DateRange = 'this-month' | 'last-month' | 'last-3-months';

export const TopSellingChart = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const { t } = useTranslation();

  // Fetch all orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: posService.getAllOrders,
  });

  // Process data based on date range
  const chartData = useMemo(() => {
    if (!orders.length) return [];

    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'this-month':
        startDate = startOfMonth(now);
        break;
      case 'last-month':
        startDate = startOfMonth(subMonths(now, 1)); // Actually includes this month too if simple filter
        // Logic: specific "Last Month" usually means *only* previous month, but for "Top Selling" usually means "Recent 30 days" or "From start of last month". 
        // Let's interpret as "From start of last month until now" based on common dashboard behavior, or we can make it strict.
        // User asked for "Last Month" and "Last 3 Months". 
        // "This Month" = 1st of current month -> Now
        // "Last Month" = 1st of previous month -> End of previous month? Or just 1st of previous month -> Now? 
        // Let's do: Start of Previous Month -> Now (Cumulative) usually implies trend.
        // Or better: strict ranges? 
        // Let's do: Start of selected period -> Now.
        startDate = startOfMonth(subMonths(now, 1));
        break;
      case 'last-3-months':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      default:
        startDate = startOfMonth(now);
    }

    // 1. Filter orders
    const filteredOrders = orders.filter(order => {
      // Only COMPLETED orders count for sales
      if (order.status !== 'COMPLETED') return false;
      const orderDate = parseISO(order.createdAt);
      return isAfter(orderDate, startDate);
    });

    // 2. Aggregate sales by recipe
    const salesMap = new Map<string, number>();
    let totalItems = 0;

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const current = salesMap.get(item.recipeName) || 0;
        salesMap.set(item.recipeName, current + item.quantity);
        totalItems += item.quantity;
      });
    });

    if (totalItems === 0) return [];

    // 3. Convert to array and sort
    const sortedStats = Array.from(salesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 4. Take top 4 and aggregate others
    const topItems = sortedStats.slice(0, 4);
    const othersValue = sortedStats.slice(4).reduce((sum, item) => sum + item.value, 0);

    const result = topItems.map((item, index) => ({
      name: item.name,
      value: item.value,
      percentage: Math.round((item.value / totalItems) * 100),
      color: COLORS[index % COLORS.length]
    }));

    if (othersValue > 0) {
      result.push({
        name: t('common.others') || 'Others',
        value: othersValue,
        percentage: Math.round((othersValue / totalItems) * 100),
        color: COLORS[4] // Slate
      });
    }

    return result;
  }, [orders, dateRange]);

  const maxPercentage = chartData.length > 0 ? Math.max(...chartData.map(r => r.percentage)) : 0;

  const getDisplayPercentage = () => {
    if (activeIndex !== null && chartData[activeIndex]) {
      return chartData[activeIndex].percentage;
    }
    if (hoveredLegend !== null && chartData[hoveredLegend]) {
      return chartData[hoveredLegend].percentage;
    }
    return maxPercentage;
  };

  const displayPercentage = getDisplayPercentage();



  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#16213e]" />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "h-full border border-purple-100 bg-purple-50 shadow-sm transition-all duration-500 cursor-default rounded-lg relative overflow-hidden",
        isHovered ? "shadow-md scale-[1.01] border-purple-200" : "hover:shadow-md"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6 relative z-10">
        <div>
          <CardTitle className={cn(
            "text-base font-bold transition-colors duration-300 text-slate-800",
            isHovered ? "text-[#16213e]" : ""
          )}>{t('dashboard.top_selling')}</CardTitle>
          <p className="text-xs text-slate-500 mt-1 font-medium">{t('dashboard.recipes_by_category')}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-normal"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {dateRange === 'this-month' ? t('dashboard.this_month') :
                  dateRange === 'last-month' ? t('dashboard.last_month') :
                    t('dashboard.last_3_months')}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDateRange('this-month')}>
              {t('dashboard.this_month')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange('last-month')}>
              {t('dashboard.last_month')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange('last-3-months')}>
              {t('dashboard.last_3_months')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0 relative z-10">
        {chartData.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <p>{t('dashboard.no_sales_data')}</p>
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className={cn(
              "w-full h-[160px] relative flex items-center justify-center transition-all duration-500",
              isHovered ? "scale-110" : ""
            )}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="percentage"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    // @ts-ignore
                    activeIndex={activeIndex !== null ? activeIndex : hoveredLegend !== null ? hoveredLegend : undefined}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    animationDuration={1500}
                    animationBegin={300}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          filter: (activeIndex === index || hoveredLegend === index) ? 'brightness(1.1)' : 'none',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  "text-xl font-bold text-slate-700 tabular-nums transition-all duration-300",
                  (isHovered || activeIndex !== null || hoveredLegend !== null) ? "scale-125 text-[#16213e]" : ""
                )}>
                  {displayPercentage}%
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 mt-4">
              {chartData.map((recipe, index) => (
                <div
                  key={recipe.name}
                  className={cn(
                    "flex items-center justify-between p-2 -mx-2 rounded-lg transition-all duration-300 cursor-pointer",
                    (hoveredLegend === index || activeIndex === index) ? "bg-gray-50 scale-[1.02]" : "hover:bg-gray-50/50"
                  )}
                  onMouseEnter={() => setHoveredLegend(index)}
                  onMouseLeave={() => setHoveredLegend(null)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition-all duration-300",
                        (hoveredLegend === index || activeIndex === index) ? "scale-150" : ""
                      )}
                      style={{ backgroundColor: recipe.color }}
                    />
                    <span className={cn(
                      "text-sm text-muted-foreground transition-colors duration-300",
                      (hoveredLegend === index || activeIndex === index) ? "text-gray-900 font-medium" : ""
                    )}>
                      {recipe.name}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium tabular-nums transition-all duration-300",
                    (hoveredLegend === index || activeIndex === index) ? "text-[#16213e] scale-110" : ""
                  )}>
                    {recipe.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSellingChart;
