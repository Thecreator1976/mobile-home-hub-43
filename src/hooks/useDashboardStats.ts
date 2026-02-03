import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, startOfDay, endOfDay } from "date-fns";

export interface DashboardStats {
  totalRevenue: number;
  newLeads: number;
  activeBuyers: number;
  todayAppointments: number;
  leadsUnderContract: number;
  closedDeals: number;
  conversionRate: number;
  revenueChange: number;
  leadsChange: number;
}

interface SellerLead {
  id: string;
  created_at: string | null;
  status: string | null;
  target_offer: number | null;
  estimated_value: number | null;
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      const sixtyDaysAgo = subDays(today, 60);

      // Fetch all leads using secure view
      const { data: leadsData, error: leadsError } = await supabase
        .from("secure_seller_leads")
        .select("id, created_at, status, target_offer, estimated_value");

      if (leadsError) throw leadsError;
      
      const leads = (leadsData || []) as SellerLead[];

      // Fetch active buyers
      const { data: buyers, error: buyersError } = await supabase
        .from("buyers")
        .select("id")
        .eq("status", "active");

      if (buyersError) throw buyersError;

      // Fetch today's appointments
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      
      const { data: todayAppts, error: apptsError } = await supabase
        .from("appointments")
        .select("id")
        .gte("start_time", todayStart)
        .lte("start_time", todayEnd);

      if (apptsError) throw apptsError;

      // Calculate stats
      const allLeads = leads;
      const newLeadsThisMonth = allLeads.filter(
        (lead) => lead.created_at && new Date(lead.created_at) >= thirtyDaysAgo
      );
      const newLeadsLastMonth = allLeads.filter(
        (lead) => lead.created_at && 
          new Date(lead.created_at) >= sixtyDaysAgo && 
          new Date(lead.created_at) < thirtyDaysAgo
      );

      const closedLeads = allLeads.filter((lead) => lead.status === "closed");
      const underContract = allLeads.filter((lead) => lead.status === "under_contract");

      // Calculate revenue from closed deals
      const totalRevenue = closedLeads.reduce(
        (sum, lead) => sum + (Number(lead.target_offer) || Number(lead.estimated_value) || 0),
        0
      );

      // Calculate conversion rate
      const totalLeads = allLeads.length;
      const conversionRate = totalLeads > 0 
        ? (closedLeads.length / totalLeads) * 100 
        : 0;

      // Calculate leads change
      const currentLeadsCount = newLeadsThisMonth.length;
      const lastMonthLeadsCount = newLeadsLastMonth.length;
      const leadsChange = lastMonthLeadsCount > 0
        ? ((currentLeadsCount - lastMonthLeadsCount) / lastMonthLeadsCount) * 100
        : currentLeadsCount > 0 ? 100 : 0;

      return {
        totalRevenue,
        newLeads: currentLeadsCount,
        activeBuyers: buyers?.length || 0,
        todayAppointments: todayAppts?.length || 0,
        leadsUnderContract: underContract.length,
        closedDeals: closedLeads.length,
        conversionRate,
        revenueChange: 0, // Would need historical data to calculate
        leadsChange,
      };
    },
    enabled: !!user,
  });
}

export function usePipelineData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pipeline-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secure_seller_leads")
        .select("status");

      if (error) throw error;

      const statusCounts = {
        new: 0,
        contacted: 0,
        offer_made: 0,
        under_contract: 0,
        closed: 0,
        lost: 0,
      };

      (data || []).forEach((lead) => {
        if (lead.status && lead.status in statusCounts) {
          statusCounts[lead.status as keyof typeof statusCounts]++;
        }
      });

      return [
        { name: "New", value: statusCounts.new, color: "hsl(199, 89%, 48%)" },
        { name: "Contacted", value: statusCounts.contacted, color: "hsl(263, 70%, 50%)" },
        { name: "Offer Made", value: statusCounts.offer_made, color: "hsl(24, 95%, 53%)" },
        { name: "Contract", value: statusCounts.under_contract, color: "hsl(172, 66%, 42%)" },
        { name: "Closed", value: statusCounts.closed, color: "hsl(142, 71%, 45%)" },
      ];
    },
    enabled: !!user,
  });
}
