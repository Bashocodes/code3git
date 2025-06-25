import { createClient } from '@supabase/supabase-js';
import { AnalysisResult, User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with proper session persistence and auto-refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Export supabase.auth for direct access
export const auth = supabase.auth;

// Attach to window for debugging (dev only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).supabase = supabase;
}

export interface PostData {
  media_url: string;
  media_type: 'image' | 'video' | 'audio';
  title: string;
  style: string;
  analysis: AnalysisResult;
  user_id: string;
  username: string;
}

// Simplified profile management function - only fetches id and username
export async function getProfile(userId: string): Promise<{ data: User | null; error?: string }> {
  try {
    console.log('📡 getProfile: Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .single();

    console.log('📥 getProfile: Raw Supabase response:', { data, error });

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('❌ getProfile: Supabase error:', error);
      return { data: null, error: error.message };
    }

    if (!data) {
      console.log('⚠️ getProfile: No profile data found');
      return { data: null };
    }

    const profileData = {
      id: data.id,
      username: data.username
    };

    console.log('✅ getProfile: Returning profile data:', profileData);
    return { data: profileData as User };
  } catch (error) {
    console.error('💥 getProfile: Exception:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function uploadMediaToStorage(file: File, mediaType: 'image' | 'video' | 'audio'): Promise<string> {
  try {
    // Generate a unique file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `${mediaType}_${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `${mediaType}s/${fileName}`;

    console.log('🚀 Uploading file to Supabase Storage:', filePath);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('posts-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    console.log('✅ File uploaded successfully:', data.path);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('posts-media')
      .getPublicUrl(data.path);

    console.log('🔗 Public URL generated:', urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error) {
    console.error('💥 Upload to storage failed:', error);
    throw error;
  }
}

export async function postAnalysis(data: PostData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 Posting analysis with user data:', {
      user_id: data.user_id,
      username: data.username,
      title: data.title
    });

    // Insert the post with analysis data, user_id, and username
    const { error } = await supabase
      .from('posts')
      .insert([{
        media_url: data.media_url,
        media_type: data.media_type,
        title: data.title,
        style: data.style,
        analysis_data: data.analysis,
        user_id: data.user_id,
        username: data.username
      }]);

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Analysis posted successfully');
    return { success: true };
  } catch (error) {
    console.error('💥 Post analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getPosts(
  limit: number = 12, 
  offset: number = 0, 
  sortOrder: 'new' | 'top' | 'hot' = 'new',
  userId?: string
): Promise<{ data: any[] | null; error?: string; hasMore: boolean }> {
  try {
    console.log(`📡 Fetching posts: limit=${limit}, offset=${offset}, sortOrder=${sortOrder}, userId=${userId || 'all'}`);
    
    let query = supabase
      .from('posts')
      .select('id, media_url, media_type, title, style, created_at, analysis_data, username, user_id');

    // Filter by user if userId is provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply sorting based on sortOrder
    switch (sortOrder) {
      case 'new':
        query = query.order('created_at', { ascending: false });
        break;
      case 'top':
        // For now, use created_at as placeholder for 'top' sorting
        // In the future, this could be based on likes, views, etc.
        query = query.order('created_at', { ascending: false });
        break;
      case 'hot':
        // For now, use created_at as placeholder for 'hot' sorting
        // In the future, this could be based on recent engagement
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Fetch one extra post to determine if there are more
    const { data, error } = await query
      .range(offset, offset + limit) // Fetch limit + 1 to check for more
      .limit(limit + 1);

    if (error) {
      console.error('❌ Supabase error:', error);
      return { data: null, error: error.message, hasMore: false };
    }

    // Check if there are more posts
    const hasMore = data.length > limit;
    
    // Return only the requested number of posts
    const posts = hasMore ? data.slice(0, limit) : data;

    console.log(`📊 Loaded ${posts.length} posts, hasMore: ${hasMore}, sortOrder: ${sortOrder}, userId: ${userId || 'all'}`);
    
    return { data: posts, hasMore };
  } catch (error) {
    console.error('💥 Get posts error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      hasMore: false
    };
  }
}