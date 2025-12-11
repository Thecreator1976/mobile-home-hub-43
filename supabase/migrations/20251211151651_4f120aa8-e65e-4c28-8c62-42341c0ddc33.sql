-- Create contract status history table
CREATE TABLE public.contract_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins and agents can view status history"
ON public.contract_status_history
FOR SELECT
USING (is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins and agents can insert status history"
ON public.contract_status_history
FOR INSERT
WITH CHECK (is_admin_or_agent(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_contract_status_history_contract_id ON public.contract_status_history(contract_id);