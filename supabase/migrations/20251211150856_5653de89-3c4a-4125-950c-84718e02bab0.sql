-- Create contracts table for storing generated contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_lead_id UUID REFERENCES public.seller_leads(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  contract_type TEXT,
  offer_data JSONB,
  docusign_envelope_id TEXT,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins and agents can manage contracts"
ON public.contracts
FOR ALL
USING (is_admin_or_agent(auth.uid()));

CREATE POLICY "Users can view contracts they created"
ON public.contracts
FOR SELECT
USING ((created_by = auth.uid()) OR is_admin_or_agent(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();