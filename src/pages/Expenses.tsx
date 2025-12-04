import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, DollarSign, Receipt, TrendingUp, Calendar, Loader2, Filter, Eye } from "lucide-react";
import { format, parseISO, startOfMonth, startOfWeek, startOfYear, subDays } from "date-fns";
import { useExpenses, ExpenseCategory, CreateExpenseInput } from "@/hooks/useExpenses";
import { useSellerLeads } from "@/hooks/useSellerLeads";
import { Link } from "react-router-dom";

const categoryColors: Record<ExpenseCategory, string> = {
  marketing: "bg-blue-100 text-blue-800",
  travel: "bg-yellow-100 text-yellow-800",
  repairs: "bg-orange-100 text-orange-800",
  legal: "bg-purple-100 text-purple-800",
  closing: "bg-green-100 text-green-800",
  other: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<ExpenseCategory, string> = {
  marketing: "Marketing",
  travel: "Travel",
  repairs: "Repairs",
  legal: "Legal",
  closing: "Closing",
  other: "Other",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);

export default function Expenses() {
  const { expenses, isLoading, createExpense } = useExpenses();
  const { leads } = useSellerLeads();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "other" as ExpenseCategory,
    seller_lead_id: "",
    notes: "",
  });

  // Filtering logic
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((e) =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = startOfWeek(now);
          break;
        case "month":
          startDate = startOfMonth(now);
          break;
        case "year":
          startDate = startOfYear(now);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((e) => {
        const expenseDate = parseISO(e.expense_date);
        return expenseDate >= startDate;
      });
    }

    return filtered;
  }, [expenses, searchTerm, categoryFilter, dateFilter]);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const thisMonthExpenses = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    return expenses
      .filter((e) => parseISO(e.expense_date) >= monthStart)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const thisWeekExpenses = useMemo(() => {
    const weekStart = subDays(new Date(), 7);
    return expenses
      .filter((e) => parseISO(e.expense_date) >= weekStart)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const topCategory = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    let top = { category: "none", amount: 0 };
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > top.amount) {
        top = { category: cat, amount: amt };
      }
    });
    return top;
  }, [expenses]);

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.amount) {
      return;
    }

    const input: CreateExpenseInput = {
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      seller_lead_id: formData.seller_lead_id || undefined,
      expense_date: new Date().toISOString().split("T")[0],
    };

    createExpense.mutate(input, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          description: "",
          amount: "",
          category: "other",
          seller_lead_id: "",
          notes: "",
        });
      },
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setDateFilter("all");
  };

  // Get lead name by ID
  const getLeadName = (leadId: string | null) => {
    if (!leadId) return null;
    const lead = leads.find((l) => l.id === leadId);
    return lead ? lead.name : leadId;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">Track and manage all business expenses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Enter the details of your expense below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Gas for property viewing"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        value={formData.amount}
                        onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v: ExpenseCategory) => setFormData((p) => ({ ...p, category: v }))}
                    >
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
                  <Select
                    value={formData.seller_lead_id}
                    onValueChange={(v) => setFormData((p) => ({ ...p, seller_lead_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional details..."
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createExpense.isPending}>
                  {createExpense.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Expense"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(thisMonthExpenses)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(thisWeekExpenses)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
              <Receipt className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600 capitalize">
                {topCategory.category !== "none" ? categoryLabels[topCategory.category as ExpenseCategory] : "-"}
              </p>
              <p className="text-sm text-muted-foreground">{formatCurrency(topCategory.amount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by category" />
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

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""} found • Total:{" "}
              {formatCurrency(filteredTotal)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No expenses found. Log your first expense to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium">{expense.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={categoryColors[expense.category]}>
                              {categoryLabels[expense.category]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">{formatCurrency(Number(expense.amount))}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              {format(parseISO(expense.expense_date), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {expense.seller_lead_id ? (
                              <Link
                                to={`/seller-leads/${expense.seller_lead_id}`}
                                className="text-primary hover:underline text-sm"
                              >
                                {getLeadName(expense.seller_lead_id)}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {expense.receipt_url ? (
                              <a
                                href={expense.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-primary hover:underline"
                              >
                                <Receipt className="mr-1 h-4 w-4" />
                                View
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">No receipt</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
