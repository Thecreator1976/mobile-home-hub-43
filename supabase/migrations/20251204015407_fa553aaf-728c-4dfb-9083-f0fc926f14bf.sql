-- Create SMS templates table
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view templates"
ON public.sms_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Agents and admins can manage templates"
ON public.sms_templates FOR ALL
USING (is_admin_or_agent(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.sms_templates (name, category, content, is_default) VALUES
('Initial Contact', 'follow_up', 'Hi [NAME], thank you for your interest in selling your mobile home at [ADDRESS]. I''d love to discuss this with you. When would be a good time to talk?', true),
('Follow Up', 'follow_up', 'Hi [NAME], just following up on our conversation about your property at [ADDRESS]. Do you have any questions I can help answer?', true),
('Offer Made', 'offers', 'Hi [NAME], great news! I''ve prepared an offer for your property at [ADDRESS]. The offer is $[OFFER_AMOUNT]. Please let me know if you''d like to discuss the details.', true),
('Under Contract', 'status', 'Hi [NAME], congratulations! Your property at [ADDRESS] is now under contract. I''ll keep you updated on the next steps.', true),
('Appointment Reminder', 'appointments', 'Hi [NAME], this is a reminder about our appointment tomorrow to view your property at [ADDRESS]. Please confirm if this still works for you.', true);