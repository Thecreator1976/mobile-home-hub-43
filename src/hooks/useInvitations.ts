import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SendInvitationParams {
  email: string;
  organization_id: string | null;
  organization_name: string;
  role: string;
}

export function useInvitations() {
  const [sending, setSending] = useState(false);

  const sendInvitation = async (params: SendInvitationParams) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: params,
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.warning) {
        toast({
          title: "Invitation Created",
          description: data.warning,
        });
        return { success: true, inviteUrl: data.invite_url };
      }

      toast({
        title: "Invitation Sent",
        description: `Invitation email sent to ${params.email}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  };

  return {
    sendInvitation,
    sending,
  };
}
