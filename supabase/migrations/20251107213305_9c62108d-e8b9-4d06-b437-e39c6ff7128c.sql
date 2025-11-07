-- Create eco_points table
CREATE TABLE public.eco_points (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points int DEFAULT 0 NOT NULL,
  badge_level text DEFAULT 'Eco Starter' NOT NULL,
  streak_days int DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.eco_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own eco points"
  ON public.eco_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own eco points"
  ON public.eco_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own eco points"
  ON public.eco_points FOR UPDATE
  USING (auth.uid() = user_id);

-- Create teams table
CREATE TABLE public.teams (
  id bigserial PRIMARY KEY,
  team_name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update their teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Team creators can delete their teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = created_by);

-- Create team_members join table
CREATE TABLE public.team_members (
  id bigserial PRIMARY KEY,
  team_id bigint NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their memberships"
  ON public.team_members FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id
  ));

CREATE POLICY "Users can join teams"
  ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team creators can manage members"
  ON public.team_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = team_members.team_id 
    AND teams.created_by = auth.uid()
  ));

-- Create agent_logs table
CREATE TABLE public.agent_logs (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text NOT NULL,
  ai_action text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent logs"
  ON public.agent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent logs"
  ON public.agent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add eco_score to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS eco_score int DEFAULT 0;

-- Add uploaded_file column to bills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS uploaded_file text;

-- Create function to update eco_points badge based on points
CREATE OR REPLACE FUNCTION public.update_badge_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.points >= 300 THEN
    NEW.badge_level := 'Earth Guardian';
  ELSIF NEW.points >= 100 THEN
    NEW.badge_level := 'Green Hero';
  ELSE
    NEW.badge_level := 'Eco Starter';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_eco_points_badge
  BEFORE INSERT OR UPDATE OF points ON public.eco_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_badge_level();

-- Create function to auto-create eco_points for new users
CREATE OR REPLACE FUNCTION public.create_eco_points_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.eco_points (user_id, points, badge_level, streak_days)
  VALUES (NEW.id, 0, 'Eco Starter', 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_eco_points
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_eco_points_for_user();