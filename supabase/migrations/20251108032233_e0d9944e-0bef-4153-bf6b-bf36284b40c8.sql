-- Create storage bucket for analyzed images
INSERT INTO storage.buckets (id, name, public)
VALUES ('analyzed-images', 'analyzed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track image analyses
CREATE TABLE IF NOT EXISTS public.image_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_url TEXT,
  modified_image_url TEXT,
  generated_image_url TEXT,
  analysis_text TEXT,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analyses"
  ON public.image_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
  ON public.image_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON public.image_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for analyzed-images bucket
CREATE POLICY "Users can view their own images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'analyzed-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'analyzed-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'analyzed-images' AND auth.uid()::text = (storage.foldername(name))[1]);