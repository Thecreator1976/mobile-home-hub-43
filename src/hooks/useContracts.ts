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
  seller_lead?: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    state: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface ContractStatusHistory {
  id: string;
  contract_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
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

      // Add initial status history entry
      await supabase
        .from("contract_status_history")
        .insert({
          contract_id: data.id,
          old_status: null,
          new_status: input.status || "draft",
          changed_by: user?.id,
          notes: "Contract created",
        });

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

export function useContractStatusHistory(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-status-history", contractId],
    queryFn: async () => {
      if (!contractId) return [];
      
      const { data, error } = await supabase
        .from("contract_status_history")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContractStatusHistory[];
    },
    enabled: !!contractId,
  });
}

export function useUpdateContractWithHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      _statusNotes,
      ...updates 
    }: Partial<Contract> & { id: string; _statusNotes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current contract to track status change
      const { data: currentContract } = await supabase
        .from("contracts")
        .select("status")
        .eq("id", id)
        .single();

      // Update contract
      const { data, error } = await supabase
        .from("contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Add status history if status changed or content was edited
      if (updates.status && updates.status !== currentContract?.status) {
        await supabase
          .from("contract_status_history")
          .insert({
            contract_id: id,
            old_status: currentContract?.status,
            new_status: updates.status,
            changed_by: user?.id,
            notes: _statusNotes || null,
          });
      } else if (updates.content && _statusNotes) {
        await supabase
          .from("contract_status_history")
          .insert({
            contract_id: id,
            old_status: currentContract?.status,
            new_status: currentContract?.status || "draft",
            changed_by: user?.id,
            notes: _statusNotes,
          });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["contract-status-history", variables.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contract.",
        variant: "destructive",
      });
    },
  });
}
