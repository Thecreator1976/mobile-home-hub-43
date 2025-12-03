import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export type LeadStatus = "new" | "contacted" | "offer_made" | "under_contract" | "closed" | "lost";
export type HomeType = "single" | "double" | "triple";

export interface SellerLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  home_type: HomeType;
  year_built: number | null;
  condition: number | null;
  length_ft: number | null;
  width_ft: number | null;
  park_owned: boolean;
  lot_rent: number | null;
  asking_price: number;
  owed_amount: number | null;
  estimated_value: number | null;
  target_offer: number | null;
  status: LeadStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  name: string;
  phone?: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  home_type?: HomeType;
  year_built?: number;
  condition?: number;
  length_ft?: number;
  width_ft?: number;
  park_owned?: boolean;
  lot_rent?: number;
  asking_price: number;
  owed_amount?: number;
  estimated_value?: number;
  target_offer?: number;
  notes?: string;
}

export function useSellerLeads() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("seller-leads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seller_leads",
        },
        (payload) => {
          console.log("Real-time update:", payload);
          queryClient.invalidateQueries({ queryKey: ["seller-leads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["seller-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SellerLead[];
    },
    enabled: !!user,
  });

  const createLead = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const { data, error } = await supabase
        .from("seller_leads")
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
      queryClient.invalidateQueries({ queryKey: ["seller-leads"] });
      toast({
        title: "Lead Created",
        description: "The seller lead has been added successfully.",
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

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SellerLead> & { id: string }) => {
      const { data, error } = await supabase
        .from("seller_leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-leads"] });
      toast({
        title: "Lead Updated",
        description: "The seller lead has been updated successfully.",
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

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("seller_leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-leads"] });
      toast({
        title: "Lead Deleted",
        description: "The seller lead has been removed.",
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
    leads: leads || [],
    isLoading,
    error,
    createLead,
    updateLead,
    deleteLead,
  };
}

export function useSellerLead(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-lead", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("seller_leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as SellerLead;
    },
    enabled: !!user && !!id,
  });
}
