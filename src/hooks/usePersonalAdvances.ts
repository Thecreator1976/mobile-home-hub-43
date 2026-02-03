import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

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
  org_id: string;
  organization_id: string | null;
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

// Helper to get user's organization_id
const getUserOrganizationId = async (userId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', userId)
    .single();
  return data?.organization_id || null;
};

export function usePersonalAdvances() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  // Fetch user's organization ID
  useEffect(() => {
    if (user?.id) {
      getUserOrganizationId(user.id).then(setUserOrgId);
    }
  }, [user?.id]);

  const { data: advances = [], isLoading, error } = useQuery({
    queryKey: ['personal-advances'],
    queryFn: async () => {
      // Fetch advances without problematic join
      const { data: advancesData, error } = await supabase
        .from('personal_advances')
        .select('*')
        .order('issued_date', { ascending: false });

      if (error) throw error;

      // Fetch seller leads separately if needed
      const advancesWithLeads = await Promise.all(
        (advancesData || []).map(async (advance) => {
          if (advance.seller_lead_id) {
            const { data: sellerLead } = await supabase
              .from("secure_seller_leads")
              .select("name, address")
              .eq("id", advance.seller_lead_id)
              .single();
            
            return { ...advance, seller_leads: sellerLead };
          }
          return { ...advance, seller_leads: null };
        })
      );

      return advancesWithLeads as unknown as PersonalAdvance[];
    },
    enabled: !!user,
  });

  const createAdvance = useMutation({
    mutationFn: async (input: CreateAdvanceInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const organizationId = userOrgId || await getUserOrganizationId(user.id);
      if (!organizationId) throw new Error('User organization not found');

      const { data, error } = await supabase
        .from('personal_advances')
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
      // Remove org_id and seller_leads from updates
      const { org_id, organization_id, seller_leads, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from('personal_advances')
        .update(safeUpdates)
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
