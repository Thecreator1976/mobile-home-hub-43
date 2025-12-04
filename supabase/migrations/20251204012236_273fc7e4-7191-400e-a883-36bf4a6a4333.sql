-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'purchase',
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view contract templates"
  ON public.contract_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create contract templates"
  ON public.contract_templates FOR INSERT
  WITH CHECK (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins can update contract templates"
  ON public.contract_templates FOR UPDATE
  USING (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Admins can delete contract templates"
  ON public.contract_templates FOR DELETE
  USING (public.is_admin_or_agent(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();