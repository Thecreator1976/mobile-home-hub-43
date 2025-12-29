-- Add payment columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Index for faster queries on paid status
CREATE INDEX IF NOT EXISTS idx_organizations_is_paid ON public.organizations(is_paid);