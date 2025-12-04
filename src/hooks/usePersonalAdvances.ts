import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type AdvanceStatus = 'active' | 'repaid' | 'defaulted';

export interface PersonalAdvance {
  id: string;
  seller_lead_id: string | null;
  amount: number;
  purpose: string;
  interest_rate: number;
  repayment_terms: string | null;
  status: AdvanceStatus;
  issued_date: string;
  due_date: string | null;
  repaid_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  seller_leads?: {
    name: string;
    address: string;
  } | null;
}

export interface CreateAdvanceInput {
  seller_lead_id?: string | null;
  amount: number;
  purpose: string;
  interest_rate?: number;
  repayment_terms?: string;
  issued_date?: string;
  due_date?: string | null;
  notes?: string;
}

export function usePersonalAdvances() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: advances = [], isLoading, error } = useQuery({
    queryKey: ['personal-advances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_advances')
        .select(`
          *,
          seller_leads (
            name,
            address
          )
        `)
        .order('issued_date', { ascending: false });

      if (error) throw error;
      return data as PersonalAdvance[];
    },
    enabled: !!user,
  });

  const createAdvance = useMutation({
    mutationFn: async (input: CreateAdvanceInput) => {
      const { data, error } = await supabase
        .from('personal_advances')
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
      queryClient.invalidateQueries({ queryKey: ['personal-advances'] });
      toast({
        title: "Success",
        description: "Personal advance recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record personal advance.",
        variant: "destructive",
      });
      console.error('Error creating advance:', error);
    },
  });

  const updateAdvance = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PersonalAdvance> & { id: string }) => {
      const { data, error } = await supabase
        .from('personal_advances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-advances'] });
      toast({
        title: "Success",
        description: "Personal advance updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update personal advance.",
        variant: "destructive",
      });
      console.error('Error updating advance:', error);
    },
  });

  const deleteAdvance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_advances')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-advances'] });
      toast({
        title: "Success",
        description: "Personal advance deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete personal advance.",
        variant: "destructive",
      });
      console.error('Error deleting advance:', error);
    },
  });

  const markAsRepaid = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('personal_advances')
        .update({
          status: 'repaid',
          repaid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-advances'] });
      toast({
        title: "Success",
        description: "Advance marked as repaid.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark advance as repaid.",
        variant: "destructive",
      });
      console.error('Error marking advance as repaid:', error);
    },
  });

  return {
    advances,
    isLoading,
    error,
    createAdvance,
    updateAdvance,
    deleteAdvance,
    markAsRepaid,
  };
}
