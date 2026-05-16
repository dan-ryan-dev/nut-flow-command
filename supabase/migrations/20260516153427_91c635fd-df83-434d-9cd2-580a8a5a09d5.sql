
CREATE UNIQUE INDEX IF NOT EXISTS documents_booking_doc_unique
  ON public.documents (booking_id, doc_type);
