import { DashboardStats } from "@/components/dashboard-stats";
import { RecentOrders } from "@/components/recent-orders";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Lanka Shop store
        </p>
      </div>
      <DashboardStats />
      <RecentOrders />
    </div>
  );
}
