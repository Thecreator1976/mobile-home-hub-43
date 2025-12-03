import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  month: string;
  leads: number;
  closed: number;
}

export function DashboardChart() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-chart"],
    queryFn: async (): Promise<ChartData[]> => {
      // Fetch all leads once
      const { data: leads, error } = await supabase
        .from("seller_leads")
        .select("created_at, status");

      if (error) throw error;

      const chartData: ChartData[] = [];

      // Process data for last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));

        const monthLeads = (leads || []).filter((lead) => {
          const createdAt = new Date(lead.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });

        const closedLeads = monthLeads.filter((lead) => lead.status === "closed");

        chartData.push({
          month: format(monthStart, "MMM"),
          leads: monthLeads.length,
          closed: closedLeads.length,
        });
      }

      return chartData;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="h-[350px]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const chartData = data || [];
  const hasData = chartData.some((d) => d.leads > 0 || d.closed > 0);

  if (!hasData) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        <p>No data yet. Add leads to see trends.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem",
            boxShadow: "var(--shadow-lg)",
          }}
          labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
          itemStyle={{ color: "hsl(var(--muted-foreground))" }}
          formatter={(value: number) => [value, ""]}
        />
        <Legend
          wrapperStyle={{ paddingTop: "1rem" }}
          formatter={(value) => (
            <span style={{ color: "hsl(var(--card-foreground))" }}>{value}</span>
          )}
        />
        <Bar
          dataKey="leads"
          name="New Leads"
          fill="hsl(199, 89%, 48%)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="closed"
          name="Closed Deals"
          fill="hsl(142, 71%, 45%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default DashboardChart;
