import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface SMSTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  category: string;
  content: string;
}

export function useSMSTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .order("category")
        .order("name");

      if (error) throw error;
      return data as SMSTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data, error } = await supabase
        .from("sms_templates")
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
      const { data, error } = await supabase
        .from("sms_templates")
        .update(updates)
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
