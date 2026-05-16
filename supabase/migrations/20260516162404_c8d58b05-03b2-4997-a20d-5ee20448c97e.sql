
ALTER TABLE public.containers ADD COLUMN IF NOT EXISTS purchase_order text;

CREATE TABLE IF NOT EXISTS public.container_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id text NOT NULL,
  org_id uuid,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS container_comments_container_idx
  ON public.container_comments (container_id, created_at DESC);

ALTER TABLE public.container_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY container_comments_select ON public.container_comments
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), org_id));

CREATE POLICY container_comments_insert ON public.container_comments
  FOR INSERT TO authenticated
  WITH CHECK (is_coord_or_admin(auth.uid(), org_id) AND author_id = auth.uid());

CREATE POLICY container_comments_update ON public.container_comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR has_role(auth.uid(), org_id, 'admin'::app_role))
  WITH CHECK (author_id = auth.uid() OR has_role(auth.uid(), org_id, 'admin'::app_role));

CREATE POLICY container_comments_delete ON public.container_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR has_role(auth.uid(), org_id, 'admin'::app_role));

CREATE TRIGGER container_comments_touch
  BEFORE UPDATE ON public.container_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
