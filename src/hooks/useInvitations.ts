import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SendInvitationParams {
  email: string;
  organization_id: string | null;
  organization_name: string;
  role: string;
}

interface CreateUserDirectParams {
  email: string;
  password: string;
  organization_id: string | null;
  role: string;
}

export function useInvitations() {
  const [sending, setSending] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

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
    } catch (error: unknown) {
      console.error("Error sending invitation:", error);
      const message = error instanceof Error ? error.message : "Failed to send invitation";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setSending(false);
    }
  };

  const createUserDirect = async (params: CreateUserDirectParams) => {
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user-with-password", {
        body: params,
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User Created",
        description: `Account created for ${params.email}. Share the credentials with them directly.`,
      });

      return { success: true };
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const message = error instanceof Error ? error.message : "Failed to create user";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setCreatingUser(false);
    }
  };

  return {
    sendInvitation,
    sending,
    createUserDirect,
    creatingUser,
  };
}
