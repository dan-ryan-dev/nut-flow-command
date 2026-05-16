
-- =========================================================
-- 1. Enums
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'coordinator', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 2. Core: organizations, profiles, user_roles
-- =========================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, role)
);

-- =========================================================
-- 3. has_role helper (SECURITY DEFINER, no recursion)
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _org_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND org_id = _org_id AND role = _role
  );
$$;

-- =========================================================
-- 4. Reference tables (org-scoped)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.vessels          (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.drayage_carriers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.labs             (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.terminals        (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.products         (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.pack_types       (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.payment_terms    (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.buyers           (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.alert_rules      (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());

-- Ports — global
CREATE TABLE IF NOT EXISTS public.ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unlocode text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 5. Briefings, KPI snapshots, intake metrics
-- =========================================================
CREATE TABLE IF NOT EXISTS public.daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  cards jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  taken_at timestamptz NOT NULL DEFAULT now(),
  shipment_week text NOT NULL,
  containers_count int NOT NULL DEFAULT 0,
  action_count int NOT NULL DEFAULT 0,
  logged_realtime int NOT NULL DEFAULT 0,
  demurrage_usd numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.intake_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_id text NOT NULL,
  pdf_filename text,
  duration_ms int NOT NULL,
  fields_extracted int NOT NULL,
  accuracy_pct numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 6. Extend existing tables
-- =========================================================
ALTER TABLE public.containers
  ADD COLUMN IF NOT EXISTS erd timestamptz,
  ADD COLUMN IF NOT EXISTS lrd timestamptz,
  ADD COLUMN IF NOT EXISTS carrier_last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.documents       ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.logistics_events ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.alerts          ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.carriers        ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- =========================================================
-- 7. RLS — enable on every new table
-- =========================================================
ALTER TABLE public.organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drayage_carriers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_terms     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_metrics    ENABLE ROW LEVEL SECURITY;

-- Policies: mirror existing pattern (public read, authenticated write).
-- Prompt 2 will tighten using has_role(auth.uid(), org_id, ...).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations','profiles','user_roles',
    'vessels','drayage_carriers','labs','terminals','products','pack_types','payment_terms','buyers','alert_rules',
    'ports','daily_briefings','kpi_snapshots','intake_metrics'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_read"  ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_write" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_read"  ON public.%I FOR SELECT TO public        USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_write" ON public.%I FOR ALL    TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t, t);
  END LOOP;
END $$;

-- =========================================================
-- 8. updated_at triggers where useful
-- =========================================================
DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- 9. Seed one default organization for the demo
-- =========================================================
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Capay Canyon Ranch')
ON CONFLICT (id) DO NOTHING;

-- Stamp existing rows with the default org so live queries return them.
UPDATE public.containers       SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.documents        SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.logistics_events SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.alerts           SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.carriers         SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
