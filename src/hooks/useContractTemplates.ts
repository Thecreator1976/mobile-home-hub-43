import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// Helper to get user's organization_id
const getUserOrganizationId = async (userId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', userId)
    .single();
  return data?.organization_id || null;
};

export interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: string;
  content: string;
}

export function useContractTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ContractTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const organizationId = await getUserOrganizationId(user.id);
      if (!organizationId) throw new Error('User organization not found');

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          ...input,
          created_by: user.id,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({
        title: "Success",
        description: "Contract template created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create contract template.",
        variant: "destructive",
      });
      console.error('Error creating template:', error);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({
        title: "Success",
        description: "Contract template updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update contract template.",
        variant: "destructive",
      });
      console.error('Error updating template:', error);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({
        title: "Success",
        description: "Contract template deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete contract template.",
        variant: "destructive",
      });
      console.error('Error deleting template:', error);
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
