import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ExternalIntegration {
  id: string;
  user_id: string;
  service_name: string;
  webhook_url: string | null;
  config: Record<string, any>;
  is_active: boolean;
  last_sync: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  seller_lead_id: string;
  platform: string;
  content: string;
  media_urls: string[];
  scheduled_time: string | null;
  status: string;
  external_post_id: string | null;
  error_message: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateIntegrationInput {
  service_name: string;
  webhook_url?: string;
  config?: Record<string, any>;
}

export function useIntegrations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_integrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ExternalIntegration[];
    },
    enabled: !!user,
  });

  const createIntegration = useMutation({
    mutationFn: async (input: CreateIntegrationInput) => {
      const { data, error } = await supabase
        .from("external_integrations")
        .insert({
          ...input,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({
        title: "Integration Added",
        description: "Your integration has been configured successfully.",
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

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExternalIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from("external_integrations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({
        title: "Integration Updated",
        description: "Your integration has been updated.",
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

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("external_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({
        title: "Integration Removed",
        description: "Your integration has been removed.",
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

  const triggerWebhook = async (
    webhookUrl: string,
    payload: Record<string, any>
  ): Promise<boolean> => {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        }),
      });

      toast({
        title: "Request Sent",
        description: "The request was sent to your automation. Check Zapier/n8n history to confirm.",
      });
      return true;
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast({
        title: "Error",
        description: "Failed to trigger the webhook. Please check the URL.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    integrations: integrations || [],
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    triggerWebhook,
  };
}

export function useSocialPosts(sellerLeadId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["social-posts", sellerLeadId],
    queryFn: async () => {
      let query = supabase
        .from("social_posts_queue")
        .select("*")
        .order("created_at", { ascending: false });

      if (sellerLeadId) {
        query = query.eq("seller_lead_id", sellerLeadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialPost[];
    },
    enabled: !!user,
  });

  const createPost = useMutation({
    mutationFn: async (input: Omit<SocialPost, "id" | "created_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("social_posts_queue")
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
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    },
  });

  const updatePostStatus = useMutation({
    mutationFn: async ({ id, status, error_message }: { id: string; status: string; error_message?: string }) => {
      const { data, error } = await supabase
        .from("social_posts_queue")
        .update({ status, error_message })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    },
  });

  return {
    posts: posts || [],
    isLoading,
    createPost,
    updatePostStatus,
  };
}
