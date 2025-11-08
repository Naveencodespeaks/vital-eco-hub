-- Add UPDATE policy for bills table to allow upsert operations
CREATE POLICY "Users can update own bills"
ON public.bills
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);