import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "New", value: 12, color: "hsl(199, 89%, 48%)" },
  { name: "Contacted", value: 8, color: "hsl(263, 70%, 50%)" },
  { name: "Offer Made", value: 5, color: "hsl(24, 95%, 53%)" },
  { name: "Contract", value: 3, color: "hsl(172, 66%, 42%)" },
  { name: "Closed", value: 7, color: "hsl(142, 71%, 45%)" },
];

export function PipelineChart() {
  return (
    <div className="rounded-xl bg-card shadow-card p-6 animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Lead Pipeline</h3>
        <p className="text-sm text-muted-foreground">Current leads by status</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
