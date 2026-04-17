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
  org_id?: string;
  organization_id?: string | null;
  source: string | null;
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


// Helper to trigger webhooks via edge function
async function triggerLeadWebhooks(event: string, lead: SellerLead, oldStatus?: string, newStatus?: string) {
  try {
    const { error } = await supabase.functions.invoke("trigger-webhooks", {
      body: { event, lead, old_status: oldStatus, new_status: newStatus },
    });
    if (error) {
      console.error("Webhook trigger error:", error);
    } else {
      console.log(`Webhooks triggered for ${event}`);
    }
  } catch (err) {
    console.error("Failed to trigger webhooks:", err);
  }
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
      // Use the secure view for reading
      const { data, error } = await supabase
        .from("secure_seller_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as SellerLead[];
    },
    enabled: !!user,
  });

  const createLead = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc("insert_seller_lead", {
        p_name: input.name,
        p_address: input.address,
        p_asking_price: input.asking_price,
        p_phone: input.phone || null,
        p_email: input.email || null,
        p_city: input.city || null,
        p_state: input.state || null,
        p_zip: input.zip || null,
        p_home_type: input.home_type || 'single',
        p_year_built: input.year_built || null,
        p_condition: input.condition || null,
        p_length_ft: input.length_ft || null,
        p_width_ft: input.width_ft || null,
        p_park_owned: input.park_owned ?? false,
        p_lot_rent: input.lot_rent || null,
        p_owed_amount: input.owed_amount || null,
        p_estimated_value: input.estimated_value || null,
        p_target_offer: input.target_offer || null,
        p_notes: input.notes || null,
      });

      if (error) throw error;
      return data as unknown as SellerLead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["seller-leads"] });
      toast({
        title: "Lead Created",
        description: "The seller lead has been added successfully.",
      });
      triggerLeadWebhooks("new_lead", data);
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
      // Get current lead to check for status change
      const { data: currentLead } = await supabase
        .from("secure_seller_leads")
        .select("status")
        .eq("id", id)
        .single();
      
      const oldStatus = currentLead?.status;

      const { data, error } = await supabase.rpc("update_seller_lead", {
        p_id: id,
        p_name: updates.name || null,
        p_address: updates.address || null,
        p_asking_price: updates.asking_price || null,
        p_phone: updates.phone || null,
        p_email: updates.email || null,
        p_city: updates.city || null,
        p_state: updates.state || null,
        p_zip: updates.zip || null,
        p_home_type: updates.home_type || null,
        p_year_built: updates.year_built || null,
        p_condition: updates.condition || null,
        p_length_ft: updates.length_ft || null,
        p_width_ft: updates.width_ft || null,
        p_park_owned: updates.park_owned ?? null,
        p_lot_rent: updates.lot_rent || null,
        p_owed_amount: updates.owed_amount || null,
        p_estimated_value: updates.estimated_value || null,
        p_target_offer: updates.target_offer || null,
        p_status: updates.status || null,
        p_notes: updates.notes || null,
      });

      if (error) throw error;
      return { lead: data as unknown as SellerLead, oldStatus, newStatus: updates.status };
    },
    onSuccess: ({ lead, oldStatus, newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["seller-leads"] });
      toast({
        title: "Lead Updated",
        description: "The seller lead has been updated successfully.",
      });
      if (newStatus && oldStatus !== newStatus) {
        triggerLeadWebhooks("status_change", lead, oldStatus, newStatus);
      }
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
      const { error } = await supabase.rpc("delete_seller_lead", {
        p_id: id,
      });

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
        .from("secure_seller_leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as SellerLead;
    },
    enabled: !!user && !!id,
  });
}
