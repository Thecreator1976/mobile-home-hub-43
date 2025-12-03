import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Home, TrendingUp, Calendar, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD", 
      maximumFractionDigits: 0 
    }).format(value);

  const formatChange = (value: number) => {
    if (value === 0) return null;
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}% from last month`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your CRM overview.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                title="New Leads (30d)"
                value={stats?.newLeads || 0}
                change={formatChange(stats?.leadsChange || 0) || undefined}
                changeType={stats?.leadsChange && stats.leadsChange >= 0 ? "positive" : "negative"}
                icon={Users}
                iconColor="bg-primary"
              />
              <StatCard
                title="Under Contract"
                value={stats?.leadsUnderContract || 0}
                icon={Home}
                iconColor="bg-status-contract"
              />
              <StatCard
                title="Total Revenue (Closed)"
                value={formatCurrency(stats?.totalRevenue || 0)}
                icon={DollarSign}
                iconColor="bg-status-closed"
              />
              <StatCard
                title="Conversion Rate"
                value={`${(stats?.conversionRate || 0).toFixed(1)}%`}
                icon={TrendingUp}
                iconColor="bg-secondary"
              />
            </>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                title="Active Buyers"
                value={stats?.activeBuyers || 0}
                icon={UserCheck}
                iconColor="bg-status-contacted"
              />
              <StatCard
                title="Today's Appointments"
                value={stats?.todayAppointments || 0}
                icon={Calendar}
                iconColor="bg-status-offer"
              />
              <StatCard
                title="Closed Deals"
                value={stats?.closedDeals || 0}
                icon={DollarSign}
                iconColor="bg-status-closed"
              />
            </>
          )}
        </div>

        {/* Sales Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Lead acquisition and closed deals over the past 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart />
          </CardContent>
        </Card>

        {/* Charts & Tables Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentLeadsTable />
          </div>
          <div>
            <PipelineChart />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingAppointments />
          <div className="rounded-xl bg-card shadow-card p-6 animate-slide-up">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Common tasks at your fingertips</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add New Lead", href: "/seller-leads/new", color: "btn-gradient-primary" },
                { label: "Import Buyers", href: "/buyers", color: "bg-secondary hover:bg-secondary/90" },
                { label: "Create Expense", href: "/expenses", color: "bg-accent hover:bg-accent/90" },
                { label: "Value Estimator", href: "/value-estimator", color: "bg-muted hover:bg-muted/80" },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className={`${action.color} text-center py-3 px-4 rounded-lg font-medium transition-all hover:shadow-md ${
                    action.color.includes("gradient") || action.color.includes("secondary") || action.color.includes("accent")
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
