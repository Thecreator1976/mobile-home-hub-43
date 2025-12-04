import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

export function usePurchaseOrders() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: purchaseOrders, isLoading, error } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          seller_leads (name, address)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((po: any) => ({
        ...po,
        seller_lead: po.seller_leads,
        items: po.items || [],
      })) as PurchaseOrder[];
    },
    enabled: !!user,
  });

  const createPO = useMutation({
    mutationFn: async (input: CreatePOInput) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .insert({
          ...input,
          items: JSON.stringify(input.items),
          created_by: user?.id,
        })
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
      const updateData: any = { ...updates };
      if (updates.items) {
        updateData.items = JSON.stringify(updates.items);
      }
      
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
