-- Add 'quote' to the queue_item_type enum
ALTER TYPE public.queue_item_type ADD VALUE IF NOT EXISTS 'quote';