-- Enums mirroring src/shared/data/types.ts
CREATE TYPE public.container_status AS ENUM ('action','in-transit','at-port','delivered','draft');
CREATE TYPE public.logistics_status AS ENUM ('pending-load','origin-received','gated-in','loaded-vessel','arrived-discharge','closed');
CREATE TYPE public.doc_type AS ENUM ('phyto','bol','commercial-invoice','packing-list');
CREATE TYPE public.doc_status AS ENUM ('attached','draft','missing');
CREATE TYPE public.alert_tone AS ENUM ('danger','warning','info');

-- CONTAINERS: logistics tracking is keyed by container_id (NutWare convention)
CREATE TABLE public.containers (
  container_id        TEXT PRIMARY KEY,
  booking_id          TEXT NOT NULL,
  vessel              TEXT NOT NULL,
  voyage              TEXT NOT NULL,
  pol                 TEXT NOT NULL,
  pod                 TEXT NOT NULL,
  destination         TEXT NOT NULL,
  buyer               TEXT NOT NULL,
  product             TEXT NOT NULL,
  weight_kg           INTEGER NOT NULL,
  eta                 DATE NOT NULL,
  cutoff              TIMESTAMPTZ NOT NULL,
  status              public.container_status NOT NULL DEFAULT 'in-transit',
  alert               TEXT,
  phyto_complete      BOOLEAN NOT NULL DEFAULT false,
  facility            TEXT NOT NULL,
  lots                TEXT[] NOT NULL DEFAULT '{}',
  shipment_week       TEXT NOT NULL,
  logistics_status    public.logistics_status NOT NULL DEFAULT 'pending-load',
  eta_delayed         BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX containers_booking_id_idx     ON public.containers (booking_id);
CREATE INDEX containers_shipment_week_idx  ON public.containers (shipment_week);
CREATE INDEX containers_status_idx         ON public.containers (status);

-- DOCUMENTS: keyed by booking_id (NutWare convention — documents live with the booking, not the container)
CREATE TABLE public.documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  TEXT NOT NULL,
  doc_type    public.doc_type NOT NULL,
  status      public.doc_status NOT NULL DEFAULT 'missing',
  file_url    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, doc_type)
);
CREATE INDEX documents_booking_id_idx ON public.documents (booking_id);

-- LOGISTICS EVENTS: keyed by container_id (NutWare convention)
CREATE TABLE public.logistics_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id  TEXT NOT NULL REFERENCES public.containers(container_id) ON DELETE CASCADE,
  status        public.logistics_status NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX logistics_events_container_id_idx ON public.logistics_events (container_id);
CREATE INDEX logistics_events_occurred_at_idx  ON public.logistics_events (occurred_at DESC);

-- ALERTS
CREATE TABLE public.alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  tag           TEXT NOT NULL,
  tone          public.alert_tone NOT NULL DEFAULT 'warning',
  container_ref TEXT,
  booking_ref   TEXT,
  status_text   TEXT NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX alerts_acknowledged_idx ON public.alerts (acknowledged);

-- CARRIERS (reference data for Settings)
CREATE TABLE public.carriers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  scac        TEXT NOT NULL UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER containers_touch BEFORE UPDATE ON public.containers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER documents_touch  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS: public read, authenticated write (auth not wired yet — writes intentionally blocked for now)
ALTER TABLE public.containers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "containers_read"        ON public.containers       FOR SELECT USING (true);
CREATE POLICY "documents_read"         ON public.documents        FOR SELECT USING (true);
CREATE POLICY "logistics_events_read"  ON public.logistics_events FOR SELECT USING (true);
CREATE POLICY "alerts_read"            ON public.alerts           FOR SELECT USING (true);
CREATE POLICY "carriers_read"          ON public.carriers         FOR SELECT USING (true);

CREATE POLICY "containers_write"       ON public.containers       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "documents_write"        ON public.documents        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "logistics_events_write" ON public.logistics_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "alerts_write"           ON public.alerts           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "carriers_write"         ON public.carriers         FOR ALL TO authenticated USING (true) WITH CHECK (true);