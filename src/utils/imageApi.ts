const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ImageGenerationOptions {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';
  model?: 'ray-1-6' | 'ray-2' | 'ray-flash-2' | 'dall-e-3' | 'gpt-image-1';
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto';
}

export interface ImageGenerationResult {
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

export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  }

  const apiUrl = `${SUPABASE_URL}/functions/v1/generate-image`;

  const headers = {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // Create generation via edge function
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage += ` - ${errorData.error || 'Unknown error'}`;
      } catch {
        errorMessage += ` - ${errorText || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.id) {
      throw new Error('No generation ID received from API');
    }

    // For OpenAI models (DALL-E 3 and GPT Image), the response is immediate (completed state)
    if (options.model === 'dall-e-3' || options.model === 'gpt-image-1') {
      if (data.state === 'completed') {
        return data;
      } else {
        throw new Error('OpenAI generation did not complete immediately as expected');
      }
    }

    // For Luma models, poll for completion
    return await pollForCompletion(data.id);
  } catch (error) {
    console.error('Image Generation Error:', error);
    throw error;
  }
}

async function pollForCompletion(generationId: string): Promise<ImageGenerationResult> {
  const maxAttempts = 60; // 5 minutes max (5 second intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image/${generationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check generation status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.state === 'completed') {
        return {
          id: data.id,
          state: data.state,
          url: data.assets?.image || data.url,
          thumbnail_url: data.thumbnail_url,
          created_at: data.created_at,
          assets: data.assets,
        };
      }

      if (data.state === 'failed') {
        throw new Error(data.failure_reason || 'Generation failed without specific reason');
      }

      // Still pending or dreaming, wait and try again
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
    } catch (error) {
      if (attempts >= maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
  }

  throw new Error('Generation timed out after 5 minutes');
}

export async function getGenerationStatus(generationId: string): Promise<ImageGenerationResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image/${generationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get generation status: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
}