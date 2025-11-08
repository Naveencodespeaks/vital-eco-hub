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

    const { plotSize, plotUnit, facing, numFloors, numRooms, greenFeatures } = await req.json();

    // Generate detailed blueprint using AI with image generation
    const blueprintPrompt = `Create a detailed architectural floor plan blueprint for a sustainable, Vastu-compliant house with these specifications:
- Plot Size: ${plotSize} ${plotUnit}
- Facing Direction: ${facing}
- Number of Floors: ${numFloors}
- Number of Rooms: ${numRooms}
- Green Features: ${greenFeatures.join(', ')}

Requirements:
1. Follow Vastu Shastra principles: entrance in the ${facing === 'East' ? 'East (prosperity)' : facing === 'North' ? 'North (wealth)' : facing === 'West' ? 'West (evening sun)' : 'South (stability)'} direction
2. Incorporate sustainable design elements: ${greenFeatures.includes('solar') ? 'rooftop solar panels' : ''} ${greenFeatures.includes('rainwater') ? 'rainwater harvesting system' : ''} ${greenFeatures.includes('natural_ventilation') ? 'cross-ventilation design' : ''}
3. Show room layouts with dimensions, door/window placements
4. Include compass directions and Vastu zones (fire in SE, water in NE, etc.)
5. Mark green features with icons (solar panels, water tanks, ventilation paths)
6. Professional architectural style with clean lines and labels

Make it look like a professional architectural blueprint with a title block showing project details.`;

    // Generate blueprint image
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: blueprintPrompt }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (imageResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits depleted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const blueprintImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    // Generate analysis using AI
    const analysisPrompt = `Analyze this sustainable house design:
- Plot: ${plotSize} ${plotUnit}, Facing: ${facing}
- ${numFloors} floor(s), ${numRooms} rooms
- Features: ${greenFeatures.join(', ')}

Provide:
1. Energy Efficiency Insights: Sunlight direction, natural lighting, ventilation zones, solar potential
2. Sustainability Score (0-100): Based on green features, orientation, natural resource usage
3. Vastu Compliance Rating (0-10): How well it follows Vastu principles for the ${facing} facing direction

Format as JSON: {"energyInsights": "...", "sustainabilityScore": 85, "vastuRating": 8.5, "analysis": "..."}`;

    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis AI Gateway error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON from analysis
    let parsedAnalysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      parsedAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch {
      parsedAnalysis = {
        energyInsights: analysisText,
        sustainabilityScore: 75,
        vastuRating: 7.5,
        analysis: analysisText
      };
    }

    // Store in database
    const { data: blueprint, error: dbError } = await supabase
      .from('blueprints')
      .insert({
        user_id: user.id,
        plot_size: plotSize,
        plot_unit: plotUnit,
        facing_direction: facing,
        num_floors: numFloors,
        num_rooms: numRooms,
        green_features: greenFeatures,
        blueprint_image_url: blueprintImageUrl,
        energy_insights: parsedAnalysis.energyInsights,
        sustainability_score: parsedAnalysis.sustainabilityScore,
        vastu_rating: parsedAnalysis.vastuRating,
        ai_analysis: parsedAnalysis.analysis
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Log to agent_logs
    await supabase
      .from('agent_logs')
      .insert({
        user_id: user.id,
        summary: `Blueprint: ${plotSize}${plotUnit}, ${facing}-facing, ${numRooms} rooms`,
        ai_action: `Generated sustainable Vastu blueprint with score ${parsedAnalysis.sustainabilityScore}/100`,
      });

    return new Response(
      JSON.stringify({ blueprint }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate_blueprint function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
