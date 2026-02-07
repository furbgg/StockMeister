import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingDown, AlertTriangle, Euro, Sparkles, TrendingUp, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation, Trans } from 'react-i18next';

// Mock Data


const mockWasteCostData = [
  { name: 'Kalbfleisch', cost: 85.50, quantity: 3.0, color: '#7c3176' }, // Brand Burgundy
  { name: 'Schlagobers', cost: 8.70, quantity: 1.5, color: '#9b4d94' }, // Lighter Burgundy
  { name: 'Butter', cost: 4.25, quantity: 0.5, color: '#b96bb2' }, // Soft Purple
  { name: 'Eier', cost: 2.10, quantity: 6, color: '#d88ad0' }, // Pale Purple
  { name: 'Kartoffeln', cost: 3.60, quantity: 2.0, color: '#f6a8ee' }, // Lightest Pink/Purple
];

const mockCategoryData = [
  { name: 'Expired', value: 45, color: '#7c3176' },
  { name: 'Damaged', value: 25, color: '#b96bb2' },
  { name: 'Quality Issue', value: 20, color: '#9ca3af' }, // Gray for neutral
  { name: 'Overproduction', value: 10, color: '#d1d5db' }, // Light Gray
];

const mockSummaryStats = {
  totalWasteCost: 104.15,
  totalWasteItems: 8,
  avgWastePerDay: 14.88,
  topWastedCategory: 'Meat',
};

// Custom Tooltip Components

interface TooltipPayload {
  name: string;
  value: number;
  payload: {
    cost?: number;
    quantity?: number;
    color?: string;
  };
}

const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/20 bg-[#16213e] px-4 py-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200">
        <p className="text-xs text-slate-300 mb-1">{payload[0].name}</p>
        <p className="text-lg font-bold text-white">
          €{data.cost?.toFixed(2)}
        </p>
        <p className="text-xs text-slate-400 mt-1">{data.quantity} units</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-[#16213e] px-4 py-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200">
        <p className="text-xs text-slate-300 mb-1">{payload[0].name}</p>
        <p className="text-lg font-bold text-white">
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

// Animated Stat Card Component

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'up' | 'down';
  delay?: number;
}

const StatCard = ({ title, value, icon, trend, trendType, delay = 0 }: StatCardProps) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-purple-100/50 bg-purple-50/60 shadow-sm transition-all duration-500 hover:shadow-md hover:border-purple-200 group",
        "animate-in fade-in slide-in-from-bottom-4 duration-700"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

      <CardContent className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 rounded-lg bg-white shadow-sm text-[#7c3176] ring-1 ring-purple-100 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-bold px-2 py-1 rounded-full",
              "text-[#16213e] bg-blue-50 border border-blue-100/50"
            )}>
              {trendType === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
              {trend}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-2xl font-bold text-[#2d1b2d]">{value}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component

const WasteAnalyticsSection = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  try {
    return (
      <div className={`space-y-6 transition-all duration-700 pb-6 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Section Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#7c3176]/10 rounded-lg">
            <TrendingDown className="h-6 w-6 text-[#7c3176]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('waste_management.analytics.title')}</h2>
            <p className="text-gray-500 text-sm">{t('waste_management.analytics.description')}</p>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('waste_management.analytics.total_cost')}
            value={`€${mockSummaryStats.totalWasteCost.toFixed(2)}`}
            icon={<Euro className="h-5 w-5" />}
            trend={`-12% ${t('waste_management.analytics.vs_last_week')}`}
            trendType="down"
            delay={100}
          />
          <StatCard
            title={t('waste_management.analytics.waste_items')}
            value={mockSummaryStats.totalWasteItems.toString()}
            icon={<Package className="h-5 w-5" />}
            delay={200}
          />
          <StatCard
            title={t('waste_management.analytics.avg_per_day')}
            value={`€${mockSummaryStats.avgWastePerDay.toFixed(2)}`}
            icon={<TrendingDown className="h-5 w-5" />}
            delay={300}
          />
          <StatCard
            title={t('waste_management.analytics.top_category')}
            value={mockSummaryStats.topWastedCategory}
            icon={<AlertTriangle className="h-5 w-5" />}
            trend={t('waste_management.analytics.high_priority')}
            trendType="up"
            delay={400}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar Chart - Top Waste Costs */}
          <Card className="relative border border-purple-100/50 bg-purple-50/60 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
            <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                <Euro className="h-5 w-5 text-[#7c3176]" />
                {t('waste_management.charts.top_waste_costs')}
              </CardTitle>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t('waste_management.charts.product_by_cost')}</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px] min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mockWasteCostData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `€${value}`} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={100} fontSize={13} fontWeight={500} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar
                      dataKey="cost"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    >
                      {mockWasteCostData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                          className="transition-all duration-300 cursor-pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Waste Categories */}
          <Card className="relative border border-purple-100/50 bg-purple-50/60 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
            <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#7c3176]" />
                {t('waste_management.charts.waste_categories')}
              </CardTitle>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t('waste_management.charts.breakdown_by_reason')}</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px] min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      animationBegin={200}
                      animationDuration={1000}
                    >
                      {mockCategoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                          className="cursor-pointer hover:opacity-80 transition-opacity outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-slate-600 text-sm font-medium ml-1">{t(`waste_management.categories.${value.toLowerCase().replace(' ', '_')}`)}</span>}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Insight Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#7c3176] to-[#4a1d46] p-[1px] shadow-lg shadow-purple-900/10">
          <div className="absolute inset-0 bg-white/10 opacity-50" />
          <div className="relative bg-purple-50/90 backdrop-blur-md rounded-[11px] p-6 flex flex-col sm:flex-row items-center gap-5 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-purple-100/20 pointer-events-none" />

            {/* Background Decoration */}
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-purple-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="h-12 w-12 shrink-0 rounded-full bg-purple-50 flex items-center justify-center text-[#7c3176] shadow-sm ring-4 ring-purple-50/50">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="flex-1 text-center sm:text-left z-10">
              <h3 className="text-lg font-bold text-slate-800 mb-1">{t('waste_management.ai_recommendation.title')}</h3>
              <p className="text-slate-600 leading-relaxed">
                <Trans i18nKey="waste_management.ai_recommendation.text" values={{ product: 'Kalbfleisch', percent: 82, reduction: 20 }}>
                  <span className="font-bold text-[#7c3176]">Kalbfleisch</span> accounts for <span className="font-bold text-slate-800">82%</span> of total waste costs.
                  Consider checking storage temperature and reducing order quantity by <span className="font-bold text-slate-800">20%</span>.
                </Trans>
              </p>
            </div>

            <button className="z-10 px-5 py-2.5 bg-[#7c3176] hover:bg-[#60265b] text-white text-sm font-bold rounded-lg shadow-md shadow-purple-900/20 active:scale-95 transition-all whitespace-nowrap">
              {t('waste_management.ai_recommendation.apply_action')}
            </button>
          </div>
        </div>

      </div>
    );
  } catch (error) {
    return null;
  }
};

export default WasteAnalyticsSection;
