-- Add UPDATE policy for agent_logs to allow users to mark their own notifications as read
CREATE POLICY "Users can update own agent logs"
ON public.agent_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);