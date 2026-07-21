-- Create admin_audit_log table for tracking admin password-reset actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   uuid NOT NULL REFERENCES auth.users(id),
  target_user_id  uuid NOT NULL REFERENCES auth.users(id),
  action          text NOT NULL CHECK (action IN ('direct_reset', 'send_reset_link')),
  ip_address      inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can insert (used by the edge function)
CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- No UPDATE or DELETE policies → immutable audit log
