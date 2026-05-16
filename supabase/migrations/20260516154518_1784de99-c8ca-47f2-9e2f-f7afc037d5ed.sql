
-- Helper functions (SECURITY DEFINER, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND org_id = _org_id);
$$;

CREATE OR REPLACE FUNCTION public.is_coord_or_admin(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND org_id = _org_id AND role IN ('coordinator','admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_any_org_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_anywhere(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.shares_org(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ra
    JOIN public.user_roles rb ON ra.org_id = rb.org_id
    WHERE ra.user_id = _a AND rb.user_id = _b
  );
$$;

-- Auto-create profile + coordinator role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  default_org uuid;
BEGIN
  SELECT id INTO default_org FROM public.organizations ORDER BY created_at LIMIT 1;
  INSERT INTO public.profiles (user_id, org_id, display_name)
    VALUES (NEW.id, default_org, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  IF default_org IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, org_id, role) VALUES (NEW.id, default_org, 'coordinator');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop old permissive policies and recreate scoped ones
-- Containers
DROP POLICY IF EXISTS containers_read ON public.containers;
DROP POLICY IF EXISTS containers_write ON public.containers;
CREATE POLICY containers_select ON public.containers FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY containers_insert ON public.containers FOR INSERT TO authenticated
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY containers_update ON public.containers FOR UPDATE TO authenticated
  USING (public.is_coord_or_admin(auth.uid(), org_id))
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY containers_delete ON public.containers FOR DELETE TO authenticated
  USING (public.is_coord_or_admin(auth.uid(), org_id));

-- Documents
DROP POLICY IF EXISTS documents_read ON public.documents;
DROP POLICY IF EXISTS documents_write ON public.documents;
CREATE POLICY documents_select ON public.documents FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY documents_insert ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY documents_update ON public.documents FOR UPDATE TO authenticated
  USING (public.is_coord_or_admin(auth.uid(), org_id))
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY documents_delete ON public.documents FOR DELETE TO authenticated
  USING (public.is_coord_or_admin(auth.uid(), org_id));

-- Logistics events
DROP POLICY IF EXISTS logistics_events_read ON public.logistics_events;
DROP POLICY IF EXISTS logistics_events_write ON public.logistics_events;
CREATE POLICY logistics_events_select ON public.logistics_events FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY logistics_events_insert ON public.logistics_events FOR INSERT TO authenticated
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY logistics_events_update ON public.logistics_events FOR UPDATE TO authenticated
  USING (public.is_coord_or_admin(auth.uid(), org_id))
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY logistics_events_delete ON public.logistics_events FOR DELETE TO authenticated
  USING (public.is_coord_or_admin(auth.uid(), org_id));

-- Alerts
DROP POLICY IF EXISTS alerts_read ON public.alerts;
DROP POLICY IF EXISTS alerts_write ON public.alerts;
CREATE POLICY alerts_select ON public.alerts FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY alerts_insert ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY alerts_update ON public.alerts FOR UPDATE TO authenticated
  USING (public.is_coord_or_admin(auth.uid(), org_id))
  WITH CHECK (public.is_coord_or_admin(auth.uid(), org_id));
CREATE POLICY alerts_delete ON public.alerts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), org_id, 'admin'));

-- Intake metrics
DROP POLICY IF EXISTS intake_metrics_read ON public.intake_metrics;
DROP POLICY IF EXISTS intake_metrics_write ON public.intake_metrics;
CREATE POLICY intake_metrics_select ON public.intake_metrics FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY intake_metrics_insert ON public.intake_metrics FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- KPI snapshots & daily briefings (org-scoped read; admin writes)
DROP POLICY IF EXISTS kpi_snapshots_read ON public.kpi_snapshots;
DROP POLICY IF EXISTS kpi_snapshots_write ON public.kpi_snapshots;
CREATE POLICY kpi_snapshots_select ON public.kpi_snapshots FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY kpi_snapshots_write ON public.kpi_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), org_id, 'admin'))
  WITH CHECK (public.has_role(auth.uid(), org_id, 'admin'));

DROP POLICY IF EXISTS daily_briefings_read ON public.daily_briefings;
DROP POLICY IF EXISTS daily_briefings_write ON public.daily_briefings;
CREATE POLICY daily_briefings_select ON public.daily_briefings FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY daily_briefings_write ON public.daily_briefings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), org_id, 'admin'))
  WITH CHECK (public.has_role(auth.uid(), org_id, 'admin'));

-- Alert rules (reference-ish, org-scoped)
DROP POLICY IF EXISTS alert_rules_read ON public.alert_rules;
DROP POLICY IF EXISTS alert_rules_write ON public.alert_rules;
CREATE POLICY alert_rules_select ON public.alert_rules FOR SELECT TO authenticated
  USING (org_id IS NULL OR public.is_org_member(auth.uid(), org_id));
CREATE POLICY alert_rules_write ON public.alert_rules FOR ALL TO authenticated
  USING (org_id IS NOT NULL AND public.has_role(auth.uid(), org_id, 'admin'))
  WITH CHECK (org_id IS NOT NULL AND public.has_role(auth.uid(), org_id, 'admin'));

-- Carriers (reference, simple SELECT for members, INSERT/UPDATE/DELETE admin)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['carriers','vessels','drayage_carriers','labs','terminals','products','pack_types','payment_terms','buyers']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_read ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_write ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (org_id IS NULL OR public.is_org_member(auth.uid(), org_id))', t, t);
    EXECUTE format('CREATE POLICY %I_write ON public.%I FOR ALL TO authenticated USING (org_id IS NOT NULL AND public.has_role(auth.uid(), org_id, ''admin'')) WITH CHECK (org_id IS NOT NULL AND public.has_role(auth.uid(), org_id, ''admin''))', t, t);
  END LOOP;
END $$;

-- Ports (no org_id) — any authenticated read, admin (anywhere) write
DROP POLICY IF EXISTS ports_read ON public.ports;
DROP POLICY IF EXISTS ports_write ON public.ports;
CREATE POLICY ports_select ON public.ports FOR SELECT TO authenticated USING (true);
CREATE POLICY ports_write ON public.ports FOR ALL TO authenticated
  USING (public.is_admin_anywhere(auth.uid()))
  WITH CHECK (public.is_admin_anywhere(auth.uid()));

-- Organizations
DROP POLICY IF EXISTS organizations_read ON public.organizations;
DROP POLICY IF EXISTS organizations_write ON public.organizations;
CREATE POLICY organizations_select ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), id));
CREATE POLICY organizations_write ON public.organizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), id, 'admin'))
  WITH CHECK (public.has_role(auth.uid(), id, 'admin'));

-- Profiles
DROP POLICY IF EXISTS profiles_read ON public.profiles;
DROP POLICY IF EXISTS profiles_write ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.shares_org(auth.uid(), user_id));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User roles
DROP POLICY IF EXISTS user_roles_read ON public.user_roles;
DROP POLICY IF EXISTS user_roles_write ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), org_id, 'admin'));
CREATE POLICY user_roles_write ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), org_id, 'admin'))
  WITH CHECK (public.has_role(auth.uid(), org_id, 'admin'));
