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

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch last 7 days of metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: true });

    if (metricsError) throw metricsError;

    if (!metrics || metrics.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Not enough data for forecast. Add more daily metrics first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple average-based projection for next 7 days
    const avgEnergy = metrics.reduce((sum, m) => sum + m.energy_usage, 0) / metrics.length;
    const avgWater = metrics.reduce((sum, m) => sum + m.water_usage, 0) / metrics.length;
    const avgCO2 = metrics.reduce((sum, m) => sum + m.co2_emission, 0) / metrics.length;

    // Add slight trend adjustment (10% increase if last value > avg)
    const lastMetric = metrics[metrics.length - 1];
    const energyTrend = lastMetric.energy_usage > avgEnergy ? 1.1 : 0.95;
    const waterTrend = lastMetric.water_usage > avgWater ? 1.1 : 0.95;
    const co2Trend = lastMetric.co2_emission > avgCO2 ? 1.1 : 0.95;

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 7);

    // Insert forecast
    const { data: forecast, error: forecastError } = await supabase
      .from('forecasts')
      .insert({
        user_id: user.id,
        predicted_energy_kwh: avgEnergy * energyTrend,
        predicted_water_liters: avgWater * waterTrend,
        predicted_co2_kg: avgCO2 * co2Trend,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (forecastError) throw forecastError;

    return new Response(
      JSON.stringify({ forecast }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in eco_forecast function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
