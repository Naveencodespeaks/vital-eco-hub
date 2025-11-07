import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { energy_usage, water_usage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating AI prediction for:', { energy_usage, water_usage });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI sustainability advisor. Analyze energy and water usage data and provide insights to reduce waste. Always respond in JSON format with these fields:
            {
              "ai_insight": "string (3-5 sentences with actionable advice)",
              "predicted_saving": number (percentage, 5-30),
              "risk_level": "low" | "medium" | "high",
              "tips": ["tip1", "tip2", "tip3"] (3 practical tips)
            }`
          },
          {
            role: 'user',
            content: `Analyze this usage data:
Energy: ${energy_usage} kWh
Water: ${water_usage} liters

Provide sustainability insights and predicted savings in JSON format.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    console.log('AI response received:', data);

    const aiContent = data.choices[0].message.content;
    
    // Try to parse JSON from the response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback response
      result = {
        ai_insight: aiContent.substring(0, 500),
        predicted_saving: 15,
        risk_level: 'medium',
        tips: [
          'Review your energy consumption patterns',
          'Consider water-saving fixtures',
          'Monitor usage during peak hours'
        ]
      };
    }

    console.log('Prediction result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in predict function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});