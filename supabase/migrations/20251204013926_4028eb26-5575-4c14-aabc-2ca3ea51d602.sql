-- External Integrations Table
CREATE TABLE public.external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- 'facebook', 'zapier', 'docusign'
  webhook_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social Media Posts Queue
CREATE TABLE public.social_posts_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_lead_id UUID REFERENCES public.seller_leads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'linkedin'
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'posted', 'failed'
  external_post_id TEXT,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_integrations
CREATE POLICY "Users can view their own integrations"
ON public.external_integrations FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own integrations"
ON public.external_integrations FOR ALL
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for social_posts_queue
CREATE POLICY "Agents and admins can view social posts"
ON public.social_posts_queue FOR SELECT
USING (public.is_admin_or_agent(auth.uid()));

CREATE POLICY "Agents and admins can manage social posts"
ON public.social_posts_queue FOR ALL
USING (public.is_admin_or_agent(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_external_integrations_updated_at
BEFORE UPDATE ON public.external_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_posts_queue_updated_at
BEFORE UPDATE ON public.social_posts_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();