-- Create challenges table
CREATE TABLE public.challenges (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  reward_points integer NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  description text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now()
);

-- Create streaks table
CREATE TABLE public.streaks (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  current_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (public read-only)
CREATE POLICY "Anyone can view challenges"
ON public.challenges
FOR SELECT
USING (true);

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements"
ON public.achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
ON public.achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for streaks
CREATE POLICY "Users can view own streak"
ON public.streaks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
ON public.streaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
ON public.streaks
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert sample challenges
INSERT INTO public.challenges (title, description, reward_points, end_date) VALUES
('Go Car-Free for 2 Days', 'Reduce your carbon footprint by using public transport, cycling, or walking instead of driving for 2 consecutive days.', 25, CURRENT_DATE + INTERVAL '7 days'),
('Zero Food Waste Week', 'Plan meals carefully and compost scraps to achieve zero food waste for an entire week.', 50, CURRENT_DATE + INTERVAL '14 days'),
('Plant 5 Trees', 'Help reforest your community by planting 5 trees or donating to a tree-planting initiative.', 100, CURRENT_DATE + INTERVAL '30 days'),
('30-Day Veggie Challenge', 'Commit to a plant-based diet for 30 days to reduce your carbon emissions.', 150, CURRENT_DATE + INTERVAL '30 days'),
('Save 100 Liters of Water', 'Track and reduce your water usage by 100 liters through shorter showers and efficient appliances.', 35, CURRENT_DATE + INTERVAL '21 days');