-- Pin search_path on the trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Replace permissive write policies with explicit auth.uid() checks
DROP POLICY IF EXISTS "containers_write"       ON public.containers;
DROP POLICY IF EXISTS "documents_write"        ON public.documents;
DROP POLICY IF EXISTS "logistics_events_write" ON public.logistics_events;
DROP POLICY IF EXISTS "alerts_write"           ON public.alerts;
DROP POLICY IF EXISTS "carriers_write"         ON public.carriers;

CREATE POLICY "containers_write"       ON public.containers       FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "documents_write"        ON public.documents        FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "logistics_events_write" ON public.logistics_events FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "alerts_write"           ON public.alerts           FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "carriers_write"         ON public.carriers         FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);