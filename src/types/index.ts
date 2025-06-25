export interface AnalysisResult {
  title: string;
  style: string;
  prompt: string;
  keyTokens: string[]; // 7 two-word tokens that best summarize the media
  creativeRemixes: string[];
  outpaintingPrompts: string[];
  animationPrompts: string[];
  musicPrompts: string[];
  dialoguePrompts: string[]; // Renamed from voicePrompts
  storyPrompts: string[];
}

export interface BookmarkedAnalysis {
  id: string;
  mediaUrl: string; // Changed from imageUrl to support all media types
  mediaType: 'image' | 'video' | 'audio'; // Added media type
  analysis: AnalysisResult;
  timestamp: number;
}

export type ModuleType = 'REMIX' | 'OUTPAINT' | 'VIDEO' | 'MUSIC' | 'DIALOGUE' | 'STORY'; // Renamed AUDIO to MUSIC, VOICE to DIALOGUE

export interface ModuleConfig {
  id: ModuleType;
  label: string;
  icon: string;
  color: string;
  description: string; // Added description property
}

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

export type MediaType = 'image' | 'video' | 'audio';

// Profile interface for user profile data
export interface Profile {
  id: string;
  username: string;
}

// Simplified user interface - removed dateOfBirth and acknowledgementSigned
export interface User {
  id: string;
  email?: string;
  username?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  booting: boolean; // Renamed from loading
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { username?: string }) => Promise<{ success: boolean; error?: string }>; // Simplified to only username
}

// Extend ViewMode for new pages (removed 'history')
export type ViewMode = 'main' | 'analysis' | 'bookmarks' | 'generate' | 'gallery' | 'settings' | 'profile' | 'artistProfile';