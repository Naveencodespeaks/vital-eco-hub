-- Add user_feedback table for adaptive learning
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  report_id uuid REFERENCES public.reports(id),
  feedback_type text NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'followed', 'ignored')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add forecasts table for predictive analytics
CREATE TABLE IF NOT EXISTS public.forecasts (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  predicted_energy_kwh numeric NOT NULL DEFAULT 0,
  predicted_water_liters numeric NOT NULL DEFAULT 0,
  predicted_co2_kg numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add global_impact table for public stats
CREATE TABLE IF NOT EXISTS public.global_impact (
  id bigserial PRIMARY KEY,
  total_users int NOT NULL DEFAULT 0,
  total_co2_saved numeric NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_impact ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_feedback
CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for forecasts
CREATE POLICY "Users can view own forecasts"
  ON public.forecasts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own forecasts"
  ON public.forecasts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for global_impact (public read)
CREATE POLICY "Anyone can view global impact"
  ON public.global_impact
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_report_id ON public.user_feedback(report_id);
CREATE INDEX idx_forecasts_user_id ON public.forecasts(user_id);
CREATE INDEX idx_forecasts_period ON public.forecasts(period_start, period_end);