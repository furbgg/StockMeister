import {
  WelcomeBanner,
  StatsCards,
  NetProfitChart,
  RevenueChart,
  TopSellingChart,
  RecentSales,
  RecentStockUpdates,
} from '@/components/dashboard';

const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-12 p-8 pt-6 w-full overflow-y-auto pb-20">
      <div className="w-full">
        <WelcomeBanner />
      </div>

      {/* 2. Kartlar */}
      <div className="w-full">
        <StatsCards />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7 w-full">
        <div className="col-span-2 flex flex-col">
          <NetProfitChart />
        </div>
        <div className="col-span-3 flex flex-col">
          <RevenueChart />
        </div>
        <div className="col-span-2 flex flex-col">
          <TopSellingChart />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 w-full">
        <RecentSales />
        <RecentStockUpdates />
      </div>

    </div>
  );
};

export default DashboardPage;