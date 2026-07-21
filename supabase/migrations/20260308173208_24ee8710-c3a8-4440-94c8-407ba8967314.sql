-- Notifications table for client bell
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own notifications
CREATE POLICY "Clients can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_profile_id = get_profile_id(auth.uid()));

-- Clients can mark their own notifications as read
CREATE POLICY "Clients can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_profile_id = get_profile_id(auth.uid()));

-- Admins can insert notifications
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;