const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ImageGenerationOptions {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';
  model?: 'ray-1-6' | 'ray-2' | 'ray-flash-2' | 'dall-e-3' | 'gpt-image-1';
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto';
}

interface ImageGenerationResult {
  id: string;
  state: 'pending' | 'dreaming' | 'completed' | 'failed';
  url?: string;
  thumbnail_url?: string;
  failure_reason?: string;
  created_at: string;
  assets?: {
    image?: string;
  };
}

const LUMA_API_URL = 'https://api.lumalabs.ai/dream-machine/v1/generations';
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

// Helper function to convert aspect ratio to size format based on model
function aspectRatioToSize(aspectRatio: string, model: string): string {
  if (model === 'gpt-image-1') {
    // GPT Image 1 uses specific size mappings
    switch (aspectRatio) {
      case '1:1':
        return '1024x1024';
      case '16:9':
        return '1536x1024';
      case '9:16':
        return '1024x1536';
      case '4:3':
        return '1024x768';
      case '3:4':
        return '768x1024';
      case '21:9':
        return '1792x768';
      case '9:21':
        return '768x1792';
      default:
        return '1024x1024';
    }
  } else {
    // DALL-E 3 uses different size mappings
    switch (aspectRatio) {
      case '1:1':
        return '1024x1024';
      case '16:9':
        return '1792x1024';
      case '9:16':
        return '1024x1792';
      case '4:3':
        return '1024x768';
      case '3:4':
        return '768x1024';
      case '21:9':
        return '1792x768';
      case '9:21':
        return '768x1792';
      default:
        return '1024x1024';
    }
  }
}

// Helper function to convert quality for Luma models
function mapQualityForLuma(quality?: string): string {
  switch (quality) {
    case 'low':
      return 'draft';
    case 'medium':
      return 'standard';
    case 'high':
      return 'enhanced';
    default:
      return 'standard';
  }
}

// Helper function to generate a unique ID for OpenAI requests
function generateId(): string {
  return 'openai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const generationId = pathSegments[pathSegments.length - 1];

    if (req.method === 'POST') {
      // Create new generation
      const options: ImageGenerationOptions = await req.json();
      
      // Check if this is an OpenAI request (DALL-E 3 or GPT Image 1)
      if (options.model === 'dall-e-3' || options.model === 'gpt-image-1') {
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        if (!OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'OPENAI_API_KEY environment variable is not set' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        let payload: any;

        if (options.model === 'gpt-image-1') {
          // GPT Image 1 payload - CRITICAL: No response_format, uses output_format
          payload = {
            model: 'gpt-image-1',
            prompt: options.prompt,
            n: 1,
            size: aspectRatioToSize(options.aspect_ratio || '1:1', 'gpt-image-1'),
            quality: options.quality || 'auto',
            output_format: 'png',
            background: 'auto'
          };
        } else {
          // DALL-E 3 payload
          const dalleQuality = options.quality === 'hd' ? 'hd' : 'standard';
          payload = {
            model: 'dall-e-3',
            prompt: options.prompt,
            n: 1,
            size: aspectRatioToSize(options.aspect_ratio || '1:1', 'dall-e-3'),
            quality: dalleQuality,
            response_format: 'url'
          };
        }

        console.log(`🚀 Making ${options.model} request with payload:`, JSON.stringify(payload, null, 2));

        const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ OpenAI API Error (${response.status}):`, errorText);
          
          let errorMessage = `OpenAI API request failed: ${response.status}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage += ` - ${errorData.error?.message || errorData.message || 'Unknown error'}`;
          } catch {
            errorMessage += ` - ${errorText || 'Unknown error'}`;
          }
          
          return new Response(
            JSON.stringify({ error: errorMessage }),
            {
              status: response.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const data = await response.json();
        console.log(`✅ ${options.model} API Response:`, JSON.stringify(data, null, 2));
        
        // Transform OpenAI response to match our expected format
        let result: ImageGenerationResult;

        if (options.model === 'gpt-image-1') {
          // For GPT Image 1, convert base64 to data URL
          const base64Data = data.data[0].b64_json;
          const outputFormat = payload.output_format || 'png';
          const dataUrl = `data:image/${outputFormat};base64,${base64Data}`;
          
          console.log(`🎨 GPT Image 1 - Created data URL (length: ${dataUrl.length})`);
          
          result = {
            id: generateId(),
            state: 'completed',
            url: dataUrl,
            created_at: new Date().toISOString(),
            assets: {
              image: dataUrl
            }
          };
        } else {
          // For DALL-E 3, use the URL directly
          result = {
            id: generateId(),
            state: 'completed',
            url: data.data[0].url,
            created_at: new Date().toISOString(),
            assets: {
              image: data.data[0].url
            }
          };
        }

        console.log(`📦 Final result object:`, JSON.stringify(result, null, 2));
        
        return new Response(
          JSON.stringify(result),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Handle Luma Labs request
        const LUMA_API_KEY = Deno.env.get('LUMA_API_KEY');
        if (!LUMA_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'LUMA_API_KEY environment variable is not set' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Build payload for Luma API
        const payload: any = {
          prompt: options.prompt,
          aspect_ratio: options.aspect_ratio || '1:1',
          model: options.model || 'ray-flash-2',
        };

        // Add quality parameter for Luma models if supported
        if (options.quality) {
          payload.quality = mapQualityForLuma(options.quality);
        }

        const response = await fetch(LUMA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LUMA_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Luma API request failed: ${response.status}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage += ` - ${errorData.detail || errorData.error?.message || errorData.message || 'Unknown error'}`;
          } catch {
            errorMessage += ` - ${errorText || 'Unknown error'}`;
          }
          
          return new Response(
            JSON.stringify({ error: errorMessage }),
            {
              status: response.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const data = await response.json();
        
        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (req.method === 'GET' && generationId && generationId !== 'generate-image') {
      // Only Luma generations need status checking (OpenAI is immediate)
      if (generationId.startsWith('openai_')) {
        return new Response(
          JSON.stringify({ error: 'OpenAI generations are completed immediately and do not support status checking' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get Luma generation status
      const LUMA_API_KEY = Deno.env.get('LUMA_API_KEY');
      if (!LUMA_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'LUMA_API_KEY environment variable is not set' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const response = await fetch(`${LUMA_API_URL}/${generationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LUMA_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({ error: `Failed to get generation status: ${response.status} - ${errorText}` }),
          {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const data = await response.json();
      
      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});