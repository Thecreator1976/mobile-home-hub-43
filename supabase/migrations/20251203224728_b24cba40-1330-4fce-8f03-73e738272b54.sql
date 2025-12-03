-- Performance indexes for common queries

-- seller_leads: status and createdAt for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_seller_leads_status ON public.seller_leads(status);
CREATE INDEX IF NOT EXISTS idx_seller_leads_created_at ON public.seller_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_leads_created_by ON public.seller_leads(created_by);
CREATE INDEX IF NOT EXISTS idx_seller_leads_status_created ON public.seller_leads(status, created_at DESC);

-- buyers: status and createdAt for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_buyers_status ON public.buyers(status);
CREATE INDEX IF NOT EXISTS idx_buyers_created_at ON public.buyers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyers_status_created ON public.buyers(status, created_at DESC);

-- appointments: startTime and status for calendar queries
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_status ON public.appointments(start_time, status);

-- expenses: seller_lead_id and date for filtering
CREATE INDEX IF NOT EXISTS idx_expenses_seller_lead ON public.expenses(seller_lead_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);

-- lead_timeline: seller_lead_id for timeline queries
CREATE INDEX IF NOT EXISTS idx_lead_timeline_seller_lead ON public.lead_timeline(seller_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_timeline_created ON public.lead_timeline(created_at DESC);