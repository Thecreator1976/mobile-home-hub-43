import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Expenses() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">Track and manage business expenses</p>
          </div>
        </div>

        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Expenses Page</h3>
          <p className="text-muted-foreground">Expense tracking will be available here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
