
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
