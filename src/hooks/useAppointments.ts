import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export type AppointmentType = "call" | "meeting" | "property_viewing" | "closing";

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  type: AppointmentType;
  start_time: string;
  end_time: string | null;
  location: string | null;
  seller_lead_id: string | null;
  buyer_id: string | null;
  status: "scheduled" | "completed" | "cancelled";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentInput {
  title: string;
  description?: string;
  type?: AppointmentType;
  start_time: string;
  end_time?: string;
  location?: string;
  seller_lead_id?: string;
  buyer_id?: string;
}

export function useAppointments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          console.log("Appointment update:", payload);
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
  });

  const createAppointment = useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const { data, error } = await supabase
        .from("appointments")
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
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Appointment Created",
        description: "The appointment has been scheduled.",
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

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Appointment Updated",
        description: "The appointment has been updated.",
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

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Appointment Deleted",
        description: "The appointment has been removed.",
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
    appointments: appointments || [],
    isLoading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
