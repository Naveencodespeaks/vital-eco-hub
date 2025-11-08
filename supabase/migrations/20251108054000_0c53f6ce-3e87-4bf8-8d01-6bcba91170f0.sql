-- Create table for storing generated blueprints
CREATE TABLE public.blueprints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plot_size numeric NOT NULL,
  plot_unit text NOT NULL DEFAULT 'sqft',
  facing_direction text NOT NULL,
  num_floors integer NOT NULL DEFAULT 1,
  num_rooms integer NOT NULL,
  green_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  blueprint_image_url text,
  energy_insights text,
  sustainability_score numeric,
  vastu_rating numeric,
  ai_analysis text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own blueprints" 
ON public.blueprints 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blueprints" 
ON public.blueprints 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blueprints" 
ON public.blueprints 
FOR DELETE 
USING (auth.uid() = user_id);