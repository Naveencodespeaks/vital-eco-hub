-- Create policies table for prescriptive plans
CREATE TABLE IF NOT EXISTS public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rationale text NOT NULL,
  interventions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own policies"
  ON public.policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own policies"
  ON public.policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create dt_runs table for digital twin simulations
CREATE TABLE IF NOT EXISTS public.dt_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_id uuid REFERENCES public.policies(id),
  total_kg numeric NOT NULL DEFAULT 0,
  total_water_kl numeric NOT NULL DEFAULT 0,
  confidence_level numeric NOT NULL DEFAULT 0,
  simulation_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dt_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dt_runs"
  ON public.dt_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dt_runs"
  ON public.dt_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create scm_edges table for causal graph
CREATE TABLE IF NOT EXISTS public.scm_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_node text NOT NULL,
  target_node text NOT NULL,
  weight numeric NOT NULL DEFAULT 1.0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scm_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scm_edges"
  ON public.scm_edges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scm_edges"
  ON public.scm_edges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scm_edges"
  ON public.scm_edges FOR DELETE
  USING (auth.uid() = user_id);