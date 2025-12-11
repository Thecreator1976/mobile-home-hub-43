-- Add payment-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Create index for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_paid ON public.profiles(is_paid);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires ON public.profiles(subscription_expires_at);