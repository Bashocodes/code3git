import { AnalysisResult, MediaType } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function analyzeMedia(mediaBase64: string, mediaType: MediaType, selectedModules: any[], visionText?: string): Promise<AnalysisResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  }

  const apiUrl = `${SUPABASE_URL}/functions/v1/analyze-media`;

  const headers = {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    mediaBase64,
    mediaType,
    visionText
  };

  try {
    console.log(`🔄 Analyzing ${mediaType} via Supabase Edge Function...`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Analysis request failed: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage += ` - ${errorData.error || 'Unknown error'}`;
      } catch {
        errorMessage += ` - ${errorText || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }

    const analysis = await response.json();
    console.log(`✅ Analysis completed successfully`);
    
    return analysis;
  } catch (error) {
    console.error('💥 Analysis Error:', error);
    throw error;
  }
}

export async function analyzeText(visionText: string): Promise<AnalysisResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  }

  const apiUrl = `${SUPABASE_URL}/functions/v1/analyze-media`;

  const headers = {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    mediaBase64: '', // Empty for text-only analysis
    mediaType: 'image' as MediaType, // Default type for text analysis
    visionText
  };

  try {
    console.log(`🔄 Analyzing text concept via Supabase Edge Function...`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Text analysis request failed: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage += ` - ${errorData.error || 'Unknown error'}`;
      } catch {
        errorMessage += ` - ${errorText || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }

    const analysis = await response.json();
    console.log(`✅ Text analysis completed successfully`);
    
    return analysis;
  } catch (error) {
    console.error('💥 Text Analysis Error:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function analyzeImage(imageBase64: string, selectedModules: any[], visionText?: string): Promise<AnalysisResult> {
  return analyzeMedia(imageBase64, 'image', selectedModules, visionText);
}