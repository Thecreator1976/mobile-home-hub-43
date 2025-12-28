-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'agent',
  invited_by uuid NOT NULL,
  token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create function to check if user can invite for an organization
CREATE OR REPLACE FUNCTION public.can_invite_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id) OR 
    (public.get_user_org(_user_id) = _org_id AND public.has_role(_user_id, 'tenant_admin'::app_role))
$$;

-- RLS Policies for invitations

-- Require authentication
CREATE POLICY "Require authentication for invitations"
ON public.invitations
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Super admins can manage all invitations
CREATE POLICY "Super admins can manage all invitations"
ON public.invitations
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Tenant admins can view invitations for their org
CREATE POLICY "Tenant admins can view invitations for their org"
ON public.invitations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'tenant_admin'::app_role) AND 
  public.get_user_org(auth.uid()) = organization_id
);

-- Tenant admins can create invitations for their org (agents/viewers only)
CREATE POLICY "Tenant admins can create invitations for their org"
ON public.invitations
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'tenant_admin'::app_role) AND 
  public.get_user_org(auth.uid()) = organization_id AND
  role IN ('agent'::app_role, 'viewer'::app_role)
);

-- Tenant admins can update invitations for their org
CREATE POLICY "Tenant admins can update invitations for their org"
ON public.invitations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'tenant_admin'::app_role) AND 
  public.get_user_org(auth.uid()) = organization_id
);

-- Tenant admins can delete invitations for their org
CREATE POLICY "Tenant admins can delete invitations for their org"
ON public.invitations
FOR DELETE
USING (
  public.has_role(auth.uid(), 'tenant_admin'::app_role) AND 
  public.get_user_org(auth.uid()) = organization_id
);

-- Create index for faster token lookups
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_organization_id ON public.invitations(organization_id);