import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { Users, DollarSign, Home, TrendingUp } from "lucide-react";

export default function Dashboard() {
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
          <StatCard
            title="Active Leads"
            value={35}
            change="+12% from last month"
            changeType="positive"
            icon={Users}
            iconColor="bg-primary"
          />
          <StatCard
            title="Properties Under Contract"
            value={8}
            change="+3 this week"
            changeType="positive"
            icon={Home}
            iconColor="bg-status-contract"
          />
          <StatCard
            title="Total Revenue (YTD)"
            value="$284,500"
            change="+18% from last year"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-status-closed"
          />
          <StatCard
            title="Conversion Rate"
            value="24%"
            change="+2% from last month"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-secondary"
          />
        </div>

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
                { label: "Import Buyers", href: "/buyers/import", color: "bg-secondary hover:bg-secondary/90" },
                { label: "Create Expense", href: "/expenses", color: "bg-accent hover:bg-accent/90" },
                { label: "Value Estimator", href: "/value-estimator", color: "bg-muted hover:bg-muted/80" },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`${action.color} text-center py-3 px-4 rounded-lg font-medium transition-all hover:shadow-md ${
                    action.color.includes("gradient") || action.color.includes("secondary") || action.color.includes("accent")
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
