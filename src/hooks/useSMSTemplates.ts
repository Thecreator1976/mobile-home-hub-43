import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export interface SMSTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  org_id: string;
  organization_id: string | null;
}

export interface CreateTemplateInput {
  name: string;
  category: string;
  content: string;
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

export function useSMSTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  // Fetch user's organization ID
  useEffect(() => {
    if (user?.id) {
      getUserOrganizationId(user.id).then(setUserOrgId);
    }
  }, [user?.id]);

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .order("category")
        .order("name");

      if (error) throw error;
      return data as unknown as SMSTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const organizationId = userOrgId || await getUserOrganizationId(user.id);
      if (!organizationId) throw new Error('User organization not found');

      const { data, error } = await supabase
        .from("sms_templates")
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
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast({
        title: "Template Created",
        description: "Your SMS template has been saved.",
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

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SMSTemplate> & { id: string }) => {
      // Remove org_id from updates
      const { org_id, organization_id, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from("sms_templates")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast({
        title: "Template Updated",
        description: "Your SMS template has been updated.",
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

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sms_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast({
        title: "Template Deleted",
        description: "The template has been removed.",
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

  // Helper to replace placeholders in template
  const applyTemplate = (template: string, lead: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    asking_price?: number;
    target_offer?: number;
  }) => {
    const fullAddress = `${lead.address || ""}${lead.city ? `, ${lead.city}` : ""}${lead.state ? `, ${lead.state}` : ""}`;
    
    return template
      .replace(/\[NAME\]/g, lead.name || "")
      .replace(/\[ADDRESS\]/g, fullAddress)
      .replace(/\[ASKING_PRICE\]/g, lead.asking_price?.toLocaleString() || "")
      .replace(/\[OFFER_AMOUNT\]/g, lead.target_offer?.toLocaleString() || "");
  };

  return {
    templates: templates || [],
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  };
}
