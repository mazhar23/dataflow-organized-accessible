
-- Ensure only the text-based has_role exists (drop app_role overload if it lingers)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- ============================================================
-- DROP ALL EXISTING RESTRICTIVE POLICIES
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- leads
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Clients can view own leads" ON public.leads;

-- orders
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can view own orders" ON public.orders;

-- vendors
DROP POLICY IF EXISTS "Admins can manage vendors" ON public.vendors;
DROP POLICY IF EXISTS "Clients can view own order vendors" ON public.vendors;

-- notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Clients can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Clients can update own notifications" ON public.notifications;

-- uploads_log
DROP POLICY IF EXISTS "Admins can manage uploads_log" ON public.uploads_log;
DROP POLICY IF EXISTS "Clients can view own uploads_log" ON public.uploads_log;

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- ============================================================
-- RECREATE ALL POLICIES AS PERMISSIVE (default)
-- ============================================================

-- profiles
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'client');

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

-- leads
CREATE POLICY "Admins can manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Clients can view own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (client_id = get_profile_id(auth.uid()));

-- orders
CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Clients can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (client_id = get_profile_id(auth.uid()));

-- vendors
CREATE POLICY "Admins can manage vendors" ON public.vendors
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Clients can view own order vendors" ON public.vendors
  FOR SELECT TO authenticated
  USING (id IN (SELECT orders.vendor_id FROM orders WHERE orders.client_id = get_profile_id(auth.uid())));

-- notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Clients can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_profile_id = get_profile_id(auth.uid()));

CREATE POLICY "Clients can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_profile_id = get_profile_id(auth.uid()));

-- uploads_log
CREATE POLICY "Admins can manage uploads_log" ON public.uploads_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Clients can view own uploads_log" ON public.uploads_log
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT orders.id FROM orders WHERE orders.client_id = get_profile_id(auth.uid())));

-- user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));
