
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
