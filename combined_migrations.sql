
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, company, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'company', ''),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'Cold' CHECK (status IN ('Hot', 'Warm', 'Cold')),
  source_file TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create uploads table
CREATE TABLE public.uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Leads: authenticated users can SELECT
CREATE POLICY "Authenticated users can view leads"
  ON public.leads FOR SELECT TO authenticated
  USING (true);

-- Leads: only admins can INSERT
CREATE POLICY "Admins can insert leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Leads: only admins can UPDATE
CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Leads: only admins can DELETE
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Uploads: users can view their own uploads
CREATE POLICY "Users can view own uploads"
  ON public.uploads FOR SELECT TO authenticated
  USING (uploaded_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Uploads: users can insert their own uploads
CREATE POLICY "Users can insert own uploads"
  ON public.uploads FOR INSERT TO authenticated
  WITH CHECK (uploaded_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update user_roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert user_roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete user_roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all uploads
CREATE POLICY "Admins can view all uploads"
  ON public.uploads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert uploads
CREATE POLICY "Admins can insert uploads"
  ON public.uploads FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS bank text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip text;

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_leads INTEGER NOT NULL DEFAULT 0,
  delivered_leads INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER,
  status order_status NOT NULL DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deliveries table (replaces uploads concept)
CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add order_id and delivery_id to leads
ALTER TABLE public.leads ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Orders RLS: Admins can do everything
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Orders RLS: Clients can view their own orders
CREATE POLICY "Clients can view own orders" ON public.orders FOR SELECT USING (
  client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Deliveries RLS: Admins can do everything
CREATE POLICY "Admins can manage deliveries" ON public.deliveries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Deliveries RLS: Clients can view deliveries for their orders
CREATE POLICY "Clients can view own deliveries" ON public.deliveries FOR SELECT USING (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.profiles p ON o.client_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Update leads RLS: drop old select policy (too permissive), add client-scoped one
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own leads" ON public.leads FOR SELECT USING (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.profiles p ON o.client_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Enable realtime for orders so clients see live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;

-- 1. Drop dependent tables first (order matters for foreign keys)
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.uploads CASCADE;

-- 2. Drop old orders table (leads references it, CASCADE handles that)
DROP TABLE IF EXISTS public.orders CASCADE;

-- 3. Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';

-- 4. Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create new orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  leads_per_day INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  total_leads_ordered INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Rebuild leads table columns
-- Drop old columns that no longer apply
ALTER TABLE public.leads DROP COLUMN IF EXISTS delivery_id;
ALTER TABLE public.leads DROP COLUMN IF EXISTS source_file;
ALTER TABLE public.leads DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE public.leads DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.leads DROP COLUMN IF EXISTS last_name;
ALTER TABLE public.leads DROP COLUMN IF EXISTS address;
ALTER TABLE public.leads DROP COLUMN IF EXISTS zip;
ALTER TABLE public.leads DROP COLUMN IF EXISTS bank;

-- Add new columns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Rename created_at to uploaded_at conceptually — keep created_at but add uploaded_at alias
ALTER TABLE public.leads RENAME COLUMN created_at TO uploaded_at;

-- Ensure order_id references new orders table
-- (CASCADE already dropped the old FK, re-add it)
ALTER TABLE public.leads DROP COLUMN IF EXISTS order_id;
ALTER TABLE public.leads ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- 7. Create uploads_log table
CREATE TABLE public.uploads_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  delivery_date DATE,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Enable RLS on new tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads_log ENABLE ROW LEVEL SECURITY;

-- 9. Drop ALL old RLS policies on leads
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Clients can view own leads" ON public.leads;

-- 10. Update has_role function to check profiles.role instead of user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 11. Create helper to get profile id from auth id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 12. RLS policies for vendors (admin only)
CREATE POLICY "Admins can manage vendors" ON public.vendors FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view vendors" ON public.vendors FOR SELECT USING (true);

-- 13. RLS policies for orders
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own orders" ON public.orders FOR SELECT USING (
  client_id = public.get_profile_id(auth.uid())
);

-- 14. RLS policies for leads
CREATE POLICY "Admins can manage leads" ON public.leads FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own leads" ON public.leads FOR SELECT USING (
  client_id = public.get_profile_id(auth.uid())
);

-- 15. RLS policies for uploads_log
CREATE POLICY "Admins can manage uploads_log" ON public.uploads_log FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own uploads_log" ON public.uploads_log FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE client_id = public.get_profile_id(auth.uid()))
);

-- 16. Update handle_new_user trigger to set role='client' on profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, company, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'company', ''),
    NEW.email,
    'client'
  );
  RETURN NEW;
END;
$$;

-- 17. Realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;-- Notifications table for client bell
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
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Clients can view vendors" ON public.vendors;

CREATE POLICY "Clients can view own order vendors"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::text)
    OR id IN (
      SELECT vendor_id FROM public.orders
      WHERE client_id = public.get_profile_id(auth.uid())
    )
  );

-- Fix 1: Restrict INSERT on profiles to enforce role = 'client'
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'client');

-- Fix 2: Convert ALL restrictive policies to permissive (the default)
-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- leads
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
CREATE POLICY "Admins can manage leads" ON public.leads FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text)) WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Clients can view own leads" ON public.leads;
CREATE POLICY "Clients can view own leads" ON public.leads FOR SELECT TO authenticated USING (client_id = get_profile_id(auth.uid()));

-- orders
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text)) WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Clients can view own orders" ON public.orders;
CREATE POLICY "Clients can view own orders" ON public.orders FOR SELECT TO authenticated USING (client_id = get_profile_id(auth.uid()));

-- vendors
DROP POLICY IF EXISTS "Admins can manage vendors" ON public.vendors;
CREATE POLICY "Admins can manage vendors" ON public.vendors FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text)) WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Clients can view own order vendors" ON public.vendors;
CREATE POLICY "Clients can view own order vendors" ON public.vendors FOR SELECT TO authenticated
  USING (id IN (SELECT vendor_id FROM public.orders WHERE client_id = get_profile_id(auth.uid())));

-- notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text)) WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Clients can view own notifications" ON public.notifications;
CREATE POLICY "Clients can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_profile_id = get_profile_id(auth.uid()));

DROP POLICY IF EXISTS "Clients can update own notifications" ON public.notifications;
CREATE POLICY "Clients can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_profile_id = get_profile_id(auth.uid()));

-- uploads_log
DROP POLICY IF EXISTS "Admins can manage uploads_log" ON public.uploads_log;
CREATE POLICY "Admins can manage uploads_log" ON public.uploads_log FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::text)) WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Clients can view own uploads_log" ON public.uploads_log;
CREATE POLICY "Clients can view own uploads_log" ON public.uploads_log FOR SELECT TO authenticated USING (order_id IN (SELECT id FROM orders WHERE client_id = get_profile_id(auth.uid())));

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

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
