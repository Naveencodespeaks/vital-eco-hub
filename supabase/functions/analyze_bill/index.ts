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
    const { file_url, month } = await req.json();
    
    if (!file_url || !month) {
      throw new Error('file_url and month are required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch the file (assuming it's an image URL for now)
    console.log('Analyzing bill from:', file_url);

    // Use Gemini Vision to analyze the bill
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
            content: 'You are an expert at analyzing Indian utility bills. Extract energy cost, water cost (in Indian Rupees ₹), energy usage (kWh), water usage (liters), and provide a concise actionable summary in 80 words or less. All monetary values should be in Indian Rupees (INR). Return as JSON: { "energy_cost": number, "water_cost": number, "energy_usage": number, "water_usage": number, "ai_summary": string }'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this utility bill for month: ${month}. Extract all costs and usage data.`
              },
              {
                type: 'image_url',
                image_url: { url: file_url }
              }
            ]
          }
        ],
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
          JSON.stringify({ error: 'Credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON from response (handle markdown code blocks)
    let parsedData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      parsedData = {
        energy_cost: 0,
        water_cost: 0,
        energy_usage: 0,
        water_usage: 0,
        ai_summary: 'Unable to parse bill details. Please check the image quality and try again.'
      };
    }

    // Upsert into bills table
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .upsert({
        user_id: user.id,
        month: month,
        total_amount: (parsedData.energy_cost || 0) + (parsedData.water_cost || 0),
        energy_usage: parsedData.energy_usage || 0,
        water_usage: parsedData.water_usage || 0,
        ai_summary: parsedData.ai_summary || 'Bill analyzed successfully',
        uploaded_file: file_url,
      }, {
        onConflict: 'user_id,month'
      })
      .select()
      .single();

    if (billError) throw billError;

    return new Response(
      JSON.stringify({ success: true, bill }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze_bill function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
