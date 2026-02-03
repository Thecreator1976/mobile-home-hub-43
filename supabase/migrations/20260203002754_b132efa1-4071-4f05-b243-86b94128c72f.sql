-- Enable RLS on all audit tables that currently have it disabled
ALTER TABLE public.security_audit_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_access_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_access_audit ENABLE ROW LEVEL SECURITY;

-- Super admins can view all audit tables
CREATE POLICY "Super admins can view security audit changes"
  ON public.security_audit_changes
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view contact access audit"
  ON public.contact_access_audit
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view dashboard access log"
  ON public.dashboard_access_log
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view profile access audit"
  ON public.profile_access_audit
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- System/authenticated users can insert audit records (for logging purposes)
CREATE POLICY "System can insert security audit changes"
  ON public.security_audit_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert contact access audit"
  ON public.contact_access_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert dashboard access log"
  ON public.dashboard_access_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert profile access audit"
  ON public.profile_access_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);