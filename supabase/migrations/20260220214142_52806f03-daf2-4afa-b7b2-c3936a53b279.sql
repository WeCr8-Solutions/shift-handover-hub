-- Drop the old check constraint and add updated one with all operation types
ALTER TABLE public.work_order_routing DROP CONSTRAINT work_order_routing_operation_type_check;

ALTER TABLE public.work_order_routing ADD CONSTRAINT work_order_routing_operation_type_check 
  CHECK (operation_type = ANY (ARRAY[
    'internal'::text, 
    'outside_processing'::text, 
    'inspection'::text, 
    'shipping'::text,
    'quote'::text,
    'engineering'::text,
    'purchasing'::text,
    'receiving'::text
  ]));