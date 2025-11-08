-- Add unique constraint on user_id and month for bills table
-- This allows upsert operations to work correctly
ALTER TABLE public.bills 
ADD CONSTRAINT bills_user_id_month_unique UNIQUE (user_id, month);