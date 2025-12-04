-- Create personal_advances table
CREATE TABLE public.personal_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_lead_id UUID REFERENCES public.seller_leads(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  purpose TEXT NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  repayment_terms TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'defaulted')),
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  repaid_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_advances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view personal advances"
  ON public.personal_advances FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Agents and admins can create personal advances"
  ON public.personal_advances FOR INSERT
  WITH CHECK (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Agents and admins can update personal advances"
  ON public.personal_advances FOR UPDATE
  USING (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Agents and admins can delete personal advances"
  ON public.personal_advances FOR DELETE
  USING (public.is_admin_or_agent(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_personal_advances_updated_at
  BEFORE UPDATE ON public.personal_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();