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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users with recent activity
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email');

    if (usersError) throw usersError;

    let processedUsers = 0;
    let tipsCreated = 0;

    for (const user of users || []) {
      try {
        // Fetch last 24h metrics for this user
        const { data: metrics, error: metricsError } = await supabase
          .from('metrics')
          .select('*')
          .eq('user_id', user.id)
          .gte('timestamp', yesterday.toISOString())
          .order('timestamp', { ascending: false });

        if (metricsError || !metrics || metrics.length === 0) continue;

        // Calculate averages
        const avgEnergy = metrics.reduce((sum, m) => sum + m.energy_usage, 0) / metrics.length;
        const avgWater = metrics.reduce((sum, m) => sum + m.water_usage, 0) / metrics.length;
        const avgCO2 = metrics.reduce((sum, m) => sum + m.co2_emission, 0) / metrics.length;

        // Generate AI tips
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are EcoPulse AI Copilot. Generate 2-3 concise, actionable sustainability tips based on user metrics. Be encouraging and specific.'
              },
              {
                role: 'user',
                content: `User: ${user.name}\nLast 24h avg: Energy=${avgEnergy.toFixed(1)} kWh, Water=${avgWater.toFixed(1)}L, CO2=${avgCO2.toFixed(1)}kg\n\nProvide 2-3 brief tips to improve.`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            console.log('Rate limit reached, pausing copilot run');
            break;
          }
          if (aiResponse.status === 402) {
            console.log('Credits depleted, pausing copilot run');
            break;
          }
          throw new Error(`AI Gateway error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const tips = aiData.choices?.[0]?.message?.content || 'Keep up the great work!';

        // Insert agent log
        const { error: logError } = await supabase
          .from('agent_logs')
          .insert({
            user_id: user.id,
            summary: `Daily EcoPulse Copilot insights for ${user.name}`,
            ai_action: tips,
          });

        if (logError) {
          console.error('Error inserting agent log:', logError);
          continue;
        }

        // Award eco points and update streak
        const { data: existingPoints } = await supabase
          .from('eco_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const currentStreak = existingPoints?.streak_days || 0;
        const newStreak = currentStreak + 1;

        const { error: pointsError } = await supabase
          .from('eco_points')
          .upsert({
            user_id: user.id,
            points: (existingPoints?.points || 0) + 5,
            streak_days: newStreak,
          });

        if (pointsError) {
          console.error('Error updating eco points:', pointsError);
        }

        // Calculate and update eco_score
        const ecoScore = Math.min(
          100,
          Math.max(0, Math.round(100 - (avgEnergy * 0.3 + avgWater * 0.3 + avgCO2 * 0.4)))
        );

        await supabase
          .from('profiles')
          .update({ eco_score: ecoScore })
          .eq('id', user.id);

        processedUsers++;
        tipsCreated++;
        
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_users: processedUsers, 
        tips_created: tipsCreated 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in eco_copilot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
