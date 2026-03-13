
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
