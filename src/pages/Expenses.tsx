import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, DollarSign, Receipt, Upload, TrendingUp } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: "marketing" | "travel" | "repairs" | "legal" | "closing" | "other";
  date: string;
  leadName?: string;
  receiptUrl?: string;
}

const mockExpenses: Expense[] = [
  { id: "1", description: "Facebook Ads Campaign", amount: 250, category: "marketing", date: "2024-01-15" },
  { id: "2", description: "Gas for property viewings", amount: 45, category: "travel", date: "2024-01-14", leadName: "John Smith" },
  { id: "3", description: "Title search fee", amount: 150, category: "legal", date: "2024-01-12", leadName: "Sarah Wilson" },
  { id: "4", description: "Minor plumbing repairs", amount: 320, category: "repairs", date: "2024-01-10", leadName: "Robert Davis" },
  { id: "5", description: "Closing costs", amount: 1200, category: "closing", date: "2024-01-08", leadName: "Michael Brown" },
  { id: "6", description: "Bandit signs", amount: 85, category: "marketing", date: "2024-01-05" },
];

const categoryColors: Record<Expense["category"], string> = {
  marketing: "bg-status-new/10 text-status-new",
  travel: "bg-status-contacted/10 text-status-contacted",
  repairs: "bg-status-offer/10 text-status-offer",
  legal: "bg-status-contract/10 text-status-contract",
  closing: "bg-status-closed/10 text-status-closed",
  other: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<Expense["category"], string> = {
  marketing: "Marketing",
  travel: "Travel",
  repairs: "Repairs",
  legal: "Legal",
  closing: "Closing",
  other: "Other",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function Expenses() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredExpenses = mockExpenses.filter(
    (expense) => categoryFilter === "all" || expense.category === categoryFilter
  );

  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyExpenses = mockExpenses.filter((e) => e.date.startsWith("2024-01")).reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = mockExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">Track and manage your business expenses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Enter the details of your expense below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="e.g., Gas for property viewing" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input id="amount" type="number" placeholder="0" className="pl-7" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="repairs">Repairs</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="closing">Closing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead">Associated Lead (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Smith</SelectItem>
                      <SelectItem value="2">Mary Johnson</SelectItem>
                      <SelectItem value="3">Robert Davis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt (Optional)</Label>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional details..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button variant="gradient" onClick={() => setIsDialogOpen(false)}>Save Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses (YTD)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-status-closed" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(monthlyExpenses)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Closing</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(categoryTotals.closing || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="repairs">Repairs</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="closing">Closing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Description
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Category
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Associated Lead
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Date
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium">{expense.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={categoryColors[expense.category]}>
                          {categoryLabels[expense.category]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {expense.leadName || "-"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{expense.date}</td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
