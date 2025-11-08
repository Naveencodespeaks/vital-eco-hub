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
    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error("user_id is required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Discovering causal edges for user:', user_id);

    // Fetch user's recent metrics
    const { data: metrics } = await supabase
      .from('metrics')
      .select('*')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Fetch recent bills
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent policies
    const { data: policies } = await supabase
      .from('policies')
      .select('*, dt_runs(*)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Build context for AI
    const avgEnergy = metrics?.reduce((sum, m) => sum + m.energy_usage, 0) / (metrics?.length || 1);
    const avgWater = metrics?.reduce((sum, m) => sum + m.water_usage, 0) / (metrics?.length || 1);
    const avgCO2 = metrics?.reduce((sum, m) => sum + m.co2_emission, 0) / (metrics?.length || 1);

    const prompt = `You are a causal inference AI analyzing sustainability data to discover structural causal model (SCM) edges.

User Data Summary:
- Average Energy Usage: ${avgEnergy.toFixed(2)} kWh
- Average Water Usage: ${avgWater.toFixed(2)} liters
- Average CO2 Emissions: ${avgCO2.toFixed(2)} kg
- Number of Bills: ${bills?.length || 0}
- Recent Interventions: ${policies?.map(p => p.interventions?.map((i: any) => i.type).join(', ')).join('; ')}

Task: Discover 5-8 causal edges in the form of directed relationships between variables.
Consider these node types:
- Energy factors: grid_price, temperature, energy_usage, cooling_load, heating_load
- Water factors: water_usage, water_price, irrigation, appliances
- Environmental: co2_emission, carbon_intensity, renewable_energy
- Behavioral: occupancy, usage_patterns, conservation_actions
- Infrastructure: insulation, solar_panels, smart_devices, hvac_efficiency

Return your response as JSON with an array of edges:
{
  "edges": [
    {
      "source_node": "temperature",
      "target_node": "cooling_load",
      "weight": 0.85
    }
  ]
}

Each edge should have:
- source_node: The causal variable (string)
- target_node: The effect variable (string)
- weight: Strength of causal relationship (0.0 to 1.0)

Base your edges on realistic causal physics and sustainability science.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a causal inference AI. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    console.log('AI Response:', content);

    // Parse JSON response
    let edgesData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      edgesData = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback edges
      edgesData = {
        edges: [
          { source_node: "temperature", target_node: "cooling_load", weight: 0.82 },
          { source_node: "cooling_load", target_node: "energy_usage", weight: 0.75 },
          { source_node: "energy_usage", target_node: "co2_emission", weight: 0.90 },
          { source_node: "grid_price", target_node: "conservation_actions", weight: 0.65 },
          { source_node: "insulation", target_node: "heating_load", weight: 0.78 }
        ]
      };
    }

    // Delete existing edges for this user
    await supabase
      .from('scm_edges')
      .delete()
      .eq('user_id', user_id);

    // Insert new edges
    const edgesToInsert = edgesData.edges.map((edge: any) => ({
      user_id,
      source_node: edge.source_node,
      target_node: edge.target_node,
      weight: edge.weight
    }));

    const { data: insertedEdges, error: insertError } = await supabase
      .from('scm_edges')
      .insert(edgesToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting edges:', insertError);
      throw insertError;
    }

    // Log the action
    await supabase
      .from('agent_logs')
      .insert({
        user_id,
        ai_action: 'pcwno_discover_edges',
        summary: `Auto-discovered ${insertedEdges?.length || 0} causal edges in structural causal model`
      });

    return new Response(
      JSON.stringify({
        edges: insertedEdges,
        success: true,
        message: `Successfully discovered ${insertedEdges?.length || 0} causal edges`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pcwno_discover_edges:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
