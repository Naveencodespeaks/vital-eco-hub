import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, policy_id } = await req.json();
    
    if (!user_id || !policy_id) {
      throw new Error("user_id and policy_id are required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Applying policy:', policy_id, 'for user:', user_id);

    // Fetch the policy and associated dt_run
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('*, dt_runs(*)')
      .eq('id', policy_id)
      .eq('user_id', user_id)
      .single();

    if (policyError || !policy) {
      throw new Error('Policy not found or access denied');
    }

    // Award eco points based on expected savings
    const dtRun = policy.dt_runs?.[0];
    const pointsEarned = Math.round((dtRun?.total_kg || 0) * 2); // 2 points per kg CO2

    const { data: ecoPoints, error: pointsError } = await supabase
      .from('eco_points')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (ecoPoints) {
      // Update existing points
      await supabase
        .from('eco_points')
        .update({
          points: ecoPoints.points + pointsEarned
        })
        .eq('user_id', user_id);
    } else {
      // Create new eco_points record
      await supabase
        .from('eco_points')
        .insert({
          user_id,
          points: pointsEarned,
          badge_level: 'Eco Starter',
          streak_days: 1
        });
    }

    // Create achievement record
    await supabase
      .from('achievements')
      .insert({
        user_id,
        title: 'Applied Prescriptive Plan',
        description: `Applied PCW-NO plan with expected ${dtRun?.total_kg || 0} kg CO2 savings`
      });

    // Log the action
    await supabase
      .from('agent_logs')
      .insert({
        user_id,
        ai_action: 'pcwno_apply',
        summary: `Applied policy ${policy_id}: ${policy.rationale.substring(0, 100)}...`
      });

    return new Response(
      JSON.stringify({
        success: true,
        points_earned: pointsEarned,
        message: `Plan applied successfully! You earned ${pointsEarned} eco points.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pcwno_apply:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});