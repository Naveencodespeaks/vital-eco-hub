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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Count total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Sum total CO2 saved across all users
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics')
      .select('co2_emission');

    if (metricsError) throw metricsError;

    const totalCO2Saved = metricsData?.reduce((sum, m) => sum + (m.co2_emission || 0), 0) || 0;

    // Upsert into global_impact table
    const { data: impact, error: impactError } = await supabase
      .from('global_impact')
      .upsert({
        id: 1,
        total_users: totalUsers || 0,
        total_co2_saved: Math.abs(totalCO2Saved),
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (impactError) throw impactError;

    return new Response(
      JSON.stringify(impact),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in global_impact function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
