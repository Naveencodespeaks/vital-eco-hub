-- Add is_read column to agent_logs table for notification tracking
ALTER TABLE public.agent_logs 
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on unread notifications
CREATE INDEX idx_agent_logs_is_read ON public.agent_logs(user_id, is_read, created_at DESC);