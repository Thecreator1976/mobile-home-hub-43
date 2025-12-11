import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Contract {
  id: string;
  seller_lead_id: string | null;
  template_id: string | null;
  template_name: string;
  content: string;
  status: string;
  contract_type: string | null;
  offer_data: Record<string, any> | null;
  docusign_envelope_id: string | null;
  sent_at: string | null;
  signed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  seller_lead?: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    state: string | null;
  } | null;
}

export interface CreateContractInput {
  seller_lead_id: string;
  template_id?: string | null;
  template_name: string;
  content: string;
  status?: string;
  contract_type?: string;
  offer_data?: Record<string, any>;
}

export function useContracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          seller_lead:seller_leads(id, name, address, city, state)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (input: CreateContractInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("contracts")
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
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Contract Saved",
        description: "Contract has been saved to your contracts.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save contract.",
        variant: "destructive",
      });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from("contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Contract Updated",
        description: "Contract has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contract.",
        variant: "destructive",
      });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Contract Deleted",
        description: "Contract has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contract.",
        variant: "destructive",
      });
    },
  });

  return {
    contracts: contractsQuery.data || [],
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    createContract: createContractMutation.mutateAsync,
    updateContract: updateContractMutation.mutateAsync,
    deleteContract: deleteContractMutation.mutateAsync,
    isCreating: createContractMutation.isPending,
    isUpdating: updateContractMutation.isPending,
    isDeleting: deleteContractMutation.isPending,
  };
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          seller_lead:seller_leads(id, name, address, city, state, phone, email)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Contract;
    },
    enabled: !!id,
  });
}
