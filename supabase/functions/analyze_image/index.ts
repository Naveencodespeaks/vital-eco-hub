import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { imageData, textPrompt, mode } = await req.json();
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Handle text-to-image generation
    if (mode === 'generate' && textPrompt) {
      console.log('Generating image from prompt...');
      
      const generateResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: textPrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Image generation error:', generateResponse.status, errorText);
        
        if (generateResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (generateResponse.status === 402) {
          throw new Error('AI credits depleted. Please add credits to your workspace.');
        }
        throw new Error(`Image generation failed: ${errorText}`);
      }

      const generateData = await generateResponse.json();
      const generatedImage = generateData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

      if (!generatedImage) {
        throw new Error('No image was generated');
      }

      return new Response(
        JSON.stringify({ generatedImage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Handle image analysis (existing functionality)
    if (!imageData) {
      throw new Error('No image data provided');
    }

    console.log('Analyzing image with Gemini...');

    // First, get text analysis
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image in detail. Describe what you see, identify objects, colors, composition, and any notable features. Provide a comprehensive analysis.'
              },
              {
                type: 'image_url',
                image_url: { url: imageData }
              }
            ]
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('AI API error:', analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (analysisResponse.status === 402) {
        throw new Error('AI credits depleted. Please add credits to your workspace.');
      }
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const analysis = analysisData.choices?.[0]?.message?.content || 'No analysis available';

    console.log('Generating enhanced version of image...');

    // Generate an enhanced version of the image
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Enhance and improve this image by making colors more vibrant, improving clarity, and optimizing the overall composition while maintaining the original subject and style.'
              },
              {
                type: 'image_url',
                image_url: { url: imageData }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      console.error('Image generation error:', imageResponse.status);
      // Return analysis without modified image if image generation fails
      return new Response(
        JSON.stringify({ analysis, modifiedImage: null }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const imageResponseData = await imageResponse.json();
    const modifiedImage = imageResponseData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    return new Response(
      JSON.stringify({ analysis, modifiedImage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in analyze_image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
