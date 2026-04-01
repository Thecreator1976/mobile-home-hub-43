import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export type POStatus = "draft" | "sent" | "received" | "paid";

export interface POItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  seller_lead_id: string | null;
  vendor: string;
  items: POItem[];
  total_amount: number;
  status: POStatus;
  due_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  org_id: string;
  organization_id: string | null;
  // Joined data
  seller_lead?: {
    name: string;
    address: string;
  } | null;
}

export interface CreatePOInput {
  po_number: string;
  vendor: string;
  seller_lead_id?: string;
  items: POItem[];
  total_amount: number;
  due_date?: string;
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

export function usePurchaseOrders() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  // Fetch user's organization ID
  useEffect(() => {
    if (user?.id) {
      getUserOrganizationId(user.id).then(setUserOrgId);
    }
  }, [user?.id]);

  const { data: purchaseOrders, isLoading, error } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      // Fetch purchase orders without problematic join
      const { data: ordersData, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch seller leads separately if needed
      const ordersWithLeads = await Promise.all(
        (ordersData || []).map(async (po) => {
          let sellerLead = null;
          if (po.seller_lead_id) {
            const { data } = await supabase
              .from("secure_seller_leads")
              .select("name, address")
              .eq("id", po.seller_lead_id)
              .single();
            sellerLead = data;
          }
          return {
            ...po,
            seller_lead: sellerLead,
            items: po.items || [],
          };
        })
      );

      return ordersWithLeads as unknown as PurchaseOrder[];
    },
    enabled: !!user,
  });

  const createPO = useMutation({
    mutationFn: async (input: CreatePOInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const organizationId = userOrgId || await getUserOrganizationId(user.id);
      if (!organizationId) throw new Error('User organization not found');

      const insertData = {
        po_number: input.po_number,
        vendor: input.vendor,
        seller_lead_id: input.seller_lead_id,
        items: input.items as unknown,
        total_amount: input.total_amount,
        due_date: input.due_date,
        notes: input.notes,
        created_by: user.id,
        org_id: organizationId,
        organization_id: organizationId,
      };

      const { data, error } = await supabase
        .from("purchase_orders")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Purchase Order Created",
        description: "The purchase order has been created successfully.",
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

  const updatePO = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrder> & { id: string }) => {
      // Remove org_id and seller_lead from updates
      const { org_id, organization_id, seller_lead, ...safeUpdates } = updates;
      const updateData = { ...safeUpdates };
      
      const { data, error } = await supabase
        .from("purchase_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Purchase Order Updated",
        description: "The purchase order has been updated successfully.",
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

  const deletePO = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Purchase Order Deleted",
        description: "The purchase order has been removed.",
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
    purchaseOrders: purchaseOrders || [],
    isLoading,
    error,
    createPO,
    updatePO,
    deletePO,
  };
}

export function generatePONumber(): string {
  return `PO-${Date.now().toString().slice(-8)}`;
}
