import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

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
  org_id: string;
  organization_id: string | null;
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  category?: ExpenseCategory;
  receipt_url?: string;
  seller_lead_id?: string;
  expense_date?: string;
}

// Helper to get user's organization_id
const getUserOrganizationId = async (userId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', userId)
    .single();
  return data?.organization_id || null;
};

export function useExpenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  // Fetch user's organization ID
  useEffect(() => {
    if (user?.id) {
      getUserOrganizationId(user.id).then(setUserOrgId);
    }
  }, [user?.id]);

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (error) throw error;
      return data as unknown as Expense[];
    },
    enabled: !!user,
  });

  const createExpense = useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const organizationId = userOrgId || await getUserOrganizationId(user.id);
      if (!organizationId) throw new Error('User organization not found');

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...input,
          created_by: user.id,
          org_id: organizationId,
          organization_id: organizationId,
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
