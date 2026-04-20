
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS converted_to_work_order_id uuid REFERENCES public.queue_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_quote_id uuid REFERENCES public.queue_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_by uuid;

CREATE INDEX IF NOT EXISTS idx_queue_items_source_quote ON public.queue_items(source_quote_id) WHERE source_quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_queue_items_converted_to_wo ON public.queue_items(converted_to_work_order_id) WHERE converted_to_work_order_id IS NOT NULL;
