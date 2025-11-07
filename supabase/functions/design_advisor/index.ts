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

    const { prompt, image } = await req.json();

    if (!prompt && !image) {
      throw new Error('Prompt or image is required');
    }

    const systemPrompt = `You are an eco-friendly design advisor specializing in sustainable solutions. 
Provide actionable, creative, and environmentally conscious design recommendations. 
Focus on reducing carbon footprint, using sustainable materials, and promoting circular economy principles.
Keep your advice practical and implementable.

When analyzing images, provide specific feedback about:
- Material sustainability
- Energy efficiency opportunities
- Waste reduction strategies
- Carbon impact assessment
- Circular economy integration`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt || 'Analyze this image for sustainability improvements' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    // Generate design advice using Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits depleted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const advice = aiData.choices?.[0]?.message?.content || 'Unable to generate advice at this time.';

    // Log to agent_logs
    await supabase
      .from('agent_logs')
      .insert({
        user_id: user.id,
        summary: `Design Advisor: ${prompt ? prompt.substring(0, 50) : 'Image analysis'}...`,
        ai_action: advice,
      });

    return new Response(
      JSON.stringify({ advice }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in design_advisor function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
