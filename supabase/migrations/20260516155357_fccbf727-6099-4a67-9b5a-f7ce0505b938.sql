
-- Enforce unique booking_id on containers
ALTER TABLE public.containers ADD CONSTRAINT containers_booking_id_key UNIQUE (booking_id);

-- Server-side ERD/LRD validation
CREATE OR REPLACE FUNCTION public.validate_erd_lrd()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.erd IS NOT NULL AND NEW.lrd IS NOT NULL AND NEW.lrd < NEW.erd THEN
    RAISE EXCEPTION 'LRD (%) cannot be earlier than ERD (%)', NEW.lrd, NEW.erd
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS containers_validate_erd_lrd ON public.containers;
CREATE TRIGGER containers_validate_erd_lrd
BEFORE INSERT OR UPDATE OF erd, lrd ON public.containers
FOR EACH ROW EXECUTE FUNCTION public.validate_erd_lrd();
