import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/ui/loading";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Filter,
} from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { useSellerLeads } from "@/hooks/useSellerLeads";
import { useExpenses } from "@/hooks/useExpenses";

interface DealProfit {
  leadId: string;
  sellerName: string;
  address: string;
  salePrice: number;
  purchasePrice: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  closedDate: Date;
}

export default function ProfitLoss() {
  const { leads, isLoading: leadsLoading } = useSellerLeads();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const [timeFilter, setTimeFilter] = useState('all');

  const isLoading = leadsLoading || expensesLoading;

  const { deals, summary } = useMemo(() => {
    if (!leads || !expenses) {
      return { deals: [], summary: { totalRevenue: 0, totalExpenses: 0, netProfit: 0, averageMargin: 0, dealCount: 0 } };
    }

    // Calculate date range based on filter
    let startDate: Date | null = null;
    const now = new Date();

    switch (timeFilter) {
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = null;
    }

    // Filter closed deals
    const closedLeads = leads.filter(lead => lead.status === 'closed');

    const dealsData: DealProfit[] = closedLeads
      .filter(lead => {
        if (!startDate) return true;
        const closedDate = new Date(lead.updated_at);
        return closedDate >= startDate;
      })
      .map(lead => {
        // Calculate expenses for this lead
        const leadExpenses = expenses
          .filter(exp => exp.seller_lead_id === lead.id)
          .reduce((sum, exp) => sum + Number(exp.amount), 0);

        const salePrice = Number(lead.estimated_value) || 0;
        const purchasePrice = Number(lead.target_offer) || 0;
        const grossProfit = salePrice - purchasePrice;
        const netProfit = grossProfit - leadExpenses;
        const profitMargin = purchasePrice > 0 ? (netProfit / purchasePrice) * 100 : 0;

        return {
          leadId: lead.id,
          sellerName: lead.name,
          address: lead.address,
          salePrice,
          purchasePrice,
          expenses: leadExpenses,
          netProfit,
          profitMargin,
          closedDate: new Date(lead.updated_at),
        };
      })
      .sort((a, b) => b.closedDate.getTime() - a.closedDate.getTime());

    // Calculate summary
    const totalRevenue = dealsData.reduce((sum, deal) => sum + deal.salePrice, 0);
    const totalExpenses = dealsData.reduce((sum, deal) => sum + deal.expenses, 0);
    const netProfit = dealsData.reduce((sum, deal) => sum + deal.netProfit, 0);
    const averageMargin = dealsData.length > 0
      ? dealsData.reduce((sum, deal) => sum + deal.profitMargin, 0) / dealsData.length
      : 0;

    return {
      deals: dealsData,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        averageMargin,
        dealCount: dealsData.length,
      },
    };
  }, [leads, expenses, timeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Seller', 'Address', 'Sale Price', 'Purchase Price', 'Expenses', 'Net Profit', 'Profit Margin', 'Closed Date'];
    const csvData = deals.map(deal => [
      deal.sellerName,
      `"${deal.address}"`,
      deal.salePrice,
      deal.purchasePrice,
      deal.expenses,
      deal.netProfit,
      `${deal.profitMargin.toFixed(1)}%`,
      format(deal.closedDate, 'yyyy-MM-dd'),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit_loss_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading profit/loss data..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profit & Loss Statement</h1>
            <p className="text-muted-foreground mt-1">
              Track profitability of closed deals
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="year">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.totalRevenue)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(summary.totalExpenses)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Net Profit</div>
                <div className={`text-2xl font-bold flex items-center ${summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(summary.netProfit)}
                  {summary.netProfit >= 0 ? (
                    <TrendingUp className="ml-2 h-5 w-5" />
                  ) : (
                    <TrendingDown className="ml-2 h-5 w-5" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Avg. Margin</div>
                <div className={`text-2xl font-bold ${summary.averageMargin >= 20 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {summary.averageMargin.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Profitability</CardTitle>
            <CardDescription>
              {deals.length} closed deal{deals.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Closed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No closed deals found for the selected period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deals.map((deal) => (
                      <TableRow key={deal.leadId} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {deal.sellerName}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {deal.address}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(deal.salePrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(deal.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400">
                          {formatCurrency(deal.expenses)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`font-medium ${deal.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(deal.netProfit)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={deal.profitMargin >= 20 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}>
                            {deal.profitMargin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {format(deal.closedDate, 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Profit Analysis */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profit Distribution</CardTitle>
              <CardDescription>
                How profits are distributed across deals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals.slice(0, 5).map((deal) => {
                  const percentage = summary.netProfit > 0
                    ? (deal.netProfit / summary.netProfit) * 100
                    : 0;

                  return (
                    <div key={deal.leadId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{deal.sellerName}</span>
                        <span>{formatCurrency(deal.netProfit)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${deal.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, Math.abs(percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {deals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deals to display
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Average Deal Size</div>
                  <div className="text-lg font-bold">
                    {deals.length > 0 ? formatCurrency(summary.totalRevenue / deals.length) : '$0'}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Average Expenses per Deal</div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {deals.length > 0 ? formatCurrency(summary.totalExpenses / deals.length) : '$0'}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Average Profit per Deal</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {deals.length > 0 ? formatCurrency(summary.netProfit / deals.length) : '$0'}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Return on Investment</div>
                  <div className="text-lg font-bold">
                    {summary.totalExpenses > 0
                      ? `${((summary.netProfit / summary.totalExpenses) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
