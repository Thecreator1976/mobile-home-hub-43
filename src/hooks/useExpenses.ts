import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ExpenseCategory = "marketing" | "travel" | "repairs" | "legal" | "closing" | "other";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  receipt_url: string | null;
  seller_lead_id: string | null;
  expense_date: string;
  created_by: string | null;
  created_at: string;
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  category?: ExpenseCategory;
  receipt_url?: string;
  seller_lead_id?: string;
  expense_date?: string;
}

export function useExpenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });

  const createExpense = useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense Created",
        description: "The expense has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense Deleted",
        description: "The expense has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    expenses: expenses || [],
    isLoading,
    error,
    createExpense,
    deleteExpense,
  };
}
