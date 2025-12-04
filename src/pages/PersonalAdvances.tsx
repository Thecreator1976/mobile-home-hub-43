import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageLoader } from "@/components/ui/loading";
import {
  Plus,
  FileText,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import PersonalAdvanceForm from "@/components/advances/PersonalAdvanceForm";
import { usePersonalAdvances, PersonalAdvance } from "@/hooks/usePersonalAdvances";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function PersonalAdvances() {
  const { advances, isLoading, markAsRepaid, deleteAdvance } = usePersonalAdvances();
  const [showForm, setShowForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'repaid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'defaulted': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Clock;
      case 'repaid': return CheckCircle;
      case 'defaulted': return AlertCircle;
      default: return Clock;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalOutstanding = () => {
    return advances
      .filter(advance => advance.status === 'active')
      .reduce((sum, advance) => sum + Number(advance.amount), 0);
  };

  const calculateTotalInterest = () => {
    return advances
      .filter(advance => advance.status === 'active')
      .reduce((sum, advance) => {
        const months = advance.due_date ? 
          Math.max(0, (new Date(advance.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
        return sum + (Number(advance.amount) * Number(advance.interest_rate) / 100 * months / 12);
      }, 0);
  };

  const generatePromissoryNote = async (advance: PersonalAdvance) => {
    try {
      const response = await supabase.functions.invoke('generate-promissory-note', {
        body: {
          borrowerName: advance.seller_leads?.name || 'Borrower',
          lenderName: 'Your Company',
          amount: advance.amount,
          interestRate: advance.interest_rate,
          repaymentTerms: advance.repayment_terms || 'To be determined',
          issuedDate: advance.issued_date,
          dueDate: advance.due_date,
        },
      });

      if (response.error) throw response.error;

      const blob = new Blob([response.data.note], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Promissory_Note_${advance.seller_leads?.name?.replace(/\s+/g, '_') || 'Advance'}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Promissory note generated and downloaded.",
      });
    } catch (error) {
      console.error('Error generating promissory note:', error);
      toast({
        title: "Error",
        description: "Failed to generate promissory note.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading personal advances..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personal Advances</h1>
            <p className="text-muted-foreground mt-1">
              Track personal funds advanced for deals
            </p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                New Advance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Personal Advance</DialogTitle>
                <DialogDescription>
                  Record a personal advance for a deal
                </DialogDescription>
              </DialogHeader>
              <PersonalAdvanceForm
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Advances</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    advances.reduce((sum, advance) => sum + Number(advance.amount), 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Outstanding</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(calculateTotalOutstanding())}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Accrued Interest</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(calculateTotalInterest())}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Active Advances</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {advances.filter(a => a.status === 'active').length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advances Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Personal Advances</CardTitle>
            <CardDescription>
              {advances.length} advance{advances.length !== 1 ? 's' : ''} • {formatCurrency(calculateTotalOutstanding())} outstanding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No personal advances recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    advances.map((advance) => {
                      const StatusIcon = getStatusIcon(advance.status);

                      return (
                        <TableRow key={advance.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              {advance.seller_leads?.name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {advance.purpose}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                              {formatCurrency(Number(advance.amount))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <TrendingUp className="mr-1 h-4 w-4 text-muted-foreground" />
                              {advance.interest_rate}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(advance.status)}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {advance.status.charAt(0).toUpperCase() + advance.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              {format(new Date(advance.issued_date), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => generatePromissoryNote(advance)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Generate Note
                                </DropdownMenuItem>
                                {advance.status === 'active' && (
                                  <DropdownMenuItem onClick={() => markAsRepaid.mutate(advance.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Repaid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteAdvance.mutate(advance.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
