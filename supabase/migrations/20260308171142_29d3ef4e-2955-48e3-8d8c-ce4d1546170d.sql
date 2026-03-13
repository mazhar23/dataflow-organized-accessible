
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
