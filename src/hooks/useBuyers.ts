import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { HomeType } from "./useSellerLeads";
import { requirePermission } from "@/lib/permissions";

export interface Buyer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  min_price: number | null;
  max_price: number | null;
  home_types: HomeType[];
  locations: string[] | null;
  credit_score: number | null;
  notes: string | null;
  status: "active" | "inactive" | "closed";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBuyerInput {
  name: string;
  phone?: string;
  email?: string;
  min_price?: number;
  max_price?: number;
  home_types?: HomeType[];
  locations?: string[];
  credit_score?: number;
  notes?: string;
}

export function useBuyers() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: buyers, isLoading, error } = useQuery({
    queryKey: ["buyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Buyer[];
    },
    enabled: !!user,
  });

  const createBuyer = useMutation({
    mutationFn: async (input: CreateBuyerInput) => {
      // Server-side permission check
      const permission = await requirePermission("buyers", "insert");
      if (!permission.allowed) {
        throw new Error(permission.reason || "Permission denied");
      }

      const { data, error } = await supabase
        .from("buyers")
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
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({
        title: "Buyer Created",
        description: "The buyer has been added successfully.",
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

  const updateBuyer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Buyer> & { id: string }) => {
      // Server-side permission check with record ID
      const permission = await requirePermission("buyers", "update", id);
      if (!permission.allowed) {
        throw new Error(permission.reason || "Permission denied");
      }

      const { data, error } = await supabase
        .from("buyers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({
        title: "Buyer Updated",
        description: "The buyer has been updated successfully.",
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

  const deleteBuyer = useMutation({
    mutationFn: async (id: string) => {
      // Server-side permission check with record ID
      const permission = await requirePermission("buyers", "delete", id);
      if (!permission.allowed) {
        throw new Error(permission.reason || "Permission denied");
      }

      const { error } = await supabase
        .from("buyers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({
        title: "Buyer Deleted",
        description: "The buyer has been removed.",
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
    buyers: buyers || [],
    isLoading,
    error,
    createBuyer,
    updateBuyer,
    deleteBuyer,
  };
}
