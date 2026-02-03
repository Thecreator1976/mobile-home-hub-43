import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface MessengerConversation {
  id: string;
  facebook_user_id: string;
  facebook_user_name: string | null;
  profile_pic_url: string | null;
  buyer_id: string | null;
  seller_lead_id: string | null;
  status: string;
  last_message_at: string | null;
  created_at: string;
  created_by: string | null;
  org_id: string;
  organization_id: string;
}

export interface MessengerMessage {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  content: string;
  message_type: string;
  facebook_message_id: string | null;
  read_at: string | null;
  created_at: string;
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

export function useConversations() {
  return useQuery({
    queryKey: ["messenger-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messenger_conversations")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as unknown as MessengerConversation[];
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messenger-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from("messenger_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as MessengerMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data, error } = await supabase.functions.invoke("facebook-send-message", {
        body: {
          conversationId,
          messageType: "text",
          content,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messenger-messages", variables.conversationId] });
      toast({ title: "Message sent" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendBuyerListLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      buyerListUrl, 
      templateText 
    }: { 
      conversationId: string; 
      buyerListUrl: string;
      templateText?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("facebook-send-message", {
        body: {
          conversationId,
          messageType: "button_template",
          buyerListUrl,
          templateText,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messenger-messages", variables.conversationId] });
      toast({ title: "Buyer list link sent!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send buyer list link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MessengerConversation> & { id: string }) => {
      // Remove org_id from updates
      const { org_id, organization_id, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from("messenger_conversations")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messenger-conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useConvertToBuyer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  // Fetch user's organization ID
  useEffect(() => {
    if (user?.id) {
      getUserOrganizationId(user.id).then(setUserOrgId);
    }
  }, [user?.id]);

  return useMutation({
    mutationFn: async ({ conversationId, name, phone }: { conversationId: string; name: string; phone?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const organizationId = userOrgId || await getUserOrganizationId(user.id);
      if (!organizationId) throw new Error('User organization not found');

      // Create buyer with required org_id
      const { data: buyer, error: buyerError } = await supabase
        .from("buyers")
        .insert({
          name,
          phone,
          notes: "Converted from Facebook Messenger",
          org_id: organizationId,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (buyerError) throw buyerError;

      // Link conversation to buyer
      const { error: updateError } = await supabase
        .from("messenger_conversations")
        .update({ buyer_id: buyer.id, status: "converted" })
        .eq("id", conversationId);

      if (updateError) throw updateError;

      return buyer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messenger-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({ title: "Contact converted to buyer!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to convert to buyer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
