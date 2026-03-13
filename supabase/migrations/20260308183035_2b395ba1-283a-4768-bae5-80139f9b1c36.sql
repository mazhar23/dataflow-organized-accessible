
-- Drop policies that depend on the app_role overload first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Now drop the app_role overload
DROP FUNCTION public.has_role(uuid, app_role);

-- Recreate all policies using the text-based has_role
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));
