import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { usePipelineData } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

export function PipelineChart() {
  const { data, isLoading } = usePipelineData();

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card shadow-card p-6 animate-slide-up">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-40 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const chartData = data || [];

  return (
    <div className="rounded-xl bg-card shadow-card p-6 animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Lead Pipeline</h3>
        <p className="text-sm text-muted-foreground">Current leads by status</p>
      </div>
      <div className="h-[300px]">
        {chartData.every(d => d.value === 0) ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No leads data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                width={90}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
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
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
