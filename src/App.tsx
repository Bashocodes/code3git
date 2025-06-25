import React, { useState, useRef } from 'react';
import { GlassmorphicHeader } from './components/GlassmorphicHeader';
import { AnalysisInterface } from './components/AnalysisInterface';
import { BookmarksView } from './components/BookmarksView';
import { StaticHomepage } from './components/StaticHomepage';
import { ImageGenerationPage } from './components/ImageGenerationPage';
import { GalleryView } from './components/GalleryView';
import { AccountSettingsView } from './components/AccountSettingsView';
import { ArtistProfileView } from './components/ArtistProfileView';
import { AnalysisResult, BookmarkedAnalysis, MediaType, ViewMode } from './types';
import { analyzeMedia } from './utils/api';
import { getBookmarks } from './utils/storage';
import { useAuth } from './context/AuthContext';

// Define Post interface for gallery - now includes analysis data
interface Post {
  id: string;
  media_url: string;
  media_type: 'image' | 'video' | 'audio';
  title: string;
  style: string;
  created_at: string;
  analysis_data?: AnalysisResult; // Optional for backward compatibility
  username?: string; // Add username field
  user_id?: string; // Add user_id field
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery'); // Changed from 'main' to 'gallery'
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('image');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null); // Add state for current username
  const [currentArtistId, setCurrentArtistId] = useState<string | null>(null); // Add state for current artist ID
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null); // Add state for selected artist
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, booting } = useAuth();

  // All hooks must be called before any conditional returns
  React.useEffect(() => {
    setBookmarkCount(getBookmarks().length);
  }, []);

  // Show loading screen while authentication is initializing - moved after all hooks
  if (booting) {
    return (
      <div className="min-h-screen bg-charcoal-matte flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#B8A082] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/70 text-lg">Initializing StyleLabs...</p>
          <p className="text-white/50 text-sm">Loading your session</p>
        </div>
      </div>
    );
  }

  const getMediaType = (file: File): MediaType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'image'; // fallback
  };

  const handleMediaSelect = (file: File) => {
    const mediaType = getMediaType(file);
    setSelectedMediaType(mediaType);
    setSelectedMediaFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedMediaUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleMediaSelect(file);
    }
  };

  const handleMediaRemove = () => {
    setSelectedMediaFile(null);
    setSelectedMediaUrl(null);
    setSelectedMediaType('image');
    setCurrentAnalysis(null);
    setCurrentUsername(null); // Reset username when media is removed
    setCurrentArtistId(null); // Reset artist ID when media is removed
  };

  const handleAnalyze = async () => {
    // Only allow analysis if media is provided
    if (!selectedMediaUrl) return;

    setIsAnalyzing(true);
    try {
      // Media-based analysis only
      const analysis = await analyzeMedia(selectedMediaUrl, selectedMediaType, []);

      setCurrentAnalysis(analysis);
      setCurrentUsername(null); // No username for new analysis
      setCurrentArtistId(null); // No artist ID for new analysis
      setViewMode('analysis');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = () => {
    setViewMode('generate');
  };

  const handleChat = () => {
    // Placeholder for chat functionality
    console.log('Chat button clicked');
  };

  const handleSpeak = () => {
    // Placeholder for speak functionality
    console.log('Speak button clicked');
  };

  const handleDecode = () => {
    // CRITICAL FIX: Reset all media-related state when navigating to decode page
    // This ensures the placeholder image is always shown initially
    setSelectedMediaFile(null);
    setSelectedMediaUrl(null);
    setSelectedMediaType('image');
    setCurrentAnalysis(null);
    setCurrentUsername(null);
    setCurrentArtistId(null);
    setViewMode('main');
  };

  const handleViewLiked = () => {
    setViewMode('bookmarks');
  };

  const handleViewAnalysisFromBookmark = (bookmark: BookmarkedAnalysis) => {
    setSelectedMediaUrl(bookmark.mediaUrl);
    setSelectedMediaType(bookmark.mediaType);
    setCurrentAnalysis(bookmark.analysis);
    setCurrentUsername(null); // Bookmarks don't have usernames
    setCurrentArtistId(null); // Bookmarks don't have artist IDs
    setViewMode('analysis');
  };

  const handleViewAnalysisFromGallery = (post: Post) => {
    // Set the media URL and type from the gallery post
    setSelectedMediaUrl(post.media_url);
    setSelectedMediaType(post.media_type);
    setCurrentUsername(post.username || null); // Set the username from the post
    setCurrentArtistId(post.user_id || null); // Set the artist ID from the post

    // Use stored analysis data if available, otherwise create a minimal analysis
    if (post.analysis_data) {
      console.log('✅ Using stored analysis data from gallery post');
      setCurrentAnalysis(post.analysis_data);
    } else {
      console.log('⚠️ No stored analysis data, creating minimal analysis from post data');
      // Create a minimal analysis from the available post data
      const minimalAnalysis: AnalysisResult = {
        title: post.title,
        style: post.style,
        prompt: `Analysis for ${post.title}`,
        keyTokens: [],
        creativeRemixes: [],
        outpaintingPrompts: [],
        animationPrompts: [],
        musicPrompts: [],
        dialoguePrompts: [],
        storyPrompts: []
      };
      setCurrentAnalysis(minimalAnalysis);
    }

    setViewMode('analysis');
  };

  const handleViewArtistProfile = (artistId: string) => {
    setSelectedArtistId(artistId);
    setViewMode('artistProfile');
  };

  const handleCloseAnalysis = () => {
    setViewMode('gallery'); // Changed from 'main' to 'gallery'
    // CRITICAL FIX: Reset all selected media state when closing analysis
    // This ensures the decode page shows its default placeholder image
    setSelectedMediaFile(null);
    setSelectedMediaUrl(null);
    setSelectedMediaType('image');
    setCurrentAnalysis(null);
    setCurrentUsername(null); // Reset username when closing analysis
    setCurrentArtistId(null); // Reset artist ID when closing analysis
  };

  const handleCloseLiked = () => {
    setViewMode('gallery'); // Changed from 'main' to 'gallery'
    setBookmarkCount(getBookmarks().length);
  };

  const handleCloseGenerate = () => {
    setViewMode('gallery'); // Changed from 'main' to 'gallery'
  };

  const handleCloseGallery = () => {
    setViewMode('gallery'); // Keep on gallery since it's now the homepage
  };

  const handleCloseSettings = () => {
    setViewMode('gallery'); // Changed from 'main' to 'gallery'
  };

  const handleCloseArtistProfile = () => {
    setViewMode('gallery'); // Changed from 'main' to 'gallery'
    setSelectedArtistId(null);
  };

  const handleLogoClick = () => {
    // Navigate to gallery view when logo is clicked (this is now the homepage)
    setViewMode('gallery');
  };

  const handleTextClick = (text: string) => {
    // This function is kept for compatibility with other components
    console.log('Text clicked:', text);
  };

  const handleViewSettings = () => {
    setViewMode('settings');
  };

  // Simplified authentication check - just check if user exists
  const isAuthenticated = () => {
    return !!user;
  };

  const renderMediaDisplay = () => {
    if (!selectedMediaUrl) return null;

    const baseClasses = "max-w-full max-h-full object-contain rounded-2xl shadow-2xl";

    switch (selectedMediaType) {
      case 'image':
        return (
          <img
            src={selectedMediaUrl}
            alt="Selected for analysis"
            className={baseClasses}
          />
        );

      case 'video':
        return (
          <video
            src={selectedMediaUrl}
            controls
            className={baseClasses}
            style={{ maxHeight: '70vh' }}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-48 h-48 bg-gradient-to-br from-[#B8A082]/20 to-[#7C9A92]/20 rounded-2xl flex items-center justify-center border border-white/10">
              <svg className="w-24 h-24 text-[#B8A082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-5a3 3 0 00-6 0v5z" />
              </svg>
            </div>
            <audio
              src={selectedMediaUrl}
              controls
              className="w-full max-w-md"
              preload="metadata"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      default:
        return null;
    }
  };

  const getMediaTypeLabel = () => {
    switch (selectedMediaType) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio file';
      default:
        return 'media';
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-matte font-sans">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Glassmorphic Header - Single consolidated header */}
      <GlassmorphicHeader
        bookmarkCount={bookmarkCount}
        onBookmarksClick={handleViewLiked}
        onGenerateClick={handleGenerate}
        onChatClick={handleChat}
        onSpeakClick={handleSpeak}
        onDecodeClick={handleDecode}
        onLogoClick={handleLogoClick}
        onSettingsClick={handleViewSettings}
      />

      {/* Main Content */}
      {viewMode === 'main' && (
        <StaticHomepage
          onUploadClick={handleUploadClick}
          onTextClick={handleTextClick}
          selectedMediaUrl={selectedMediaUrl}
          selectedMediaType={selectedMediaType}
          isAnalyzing={isAnalyzing}
          onSubmitClick={handleAnalyze}
          onMediaRemove={handleMediaRemove}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          renderMediaDisplay={renderMediaDisplay}
          getMediaTypeLabel={getMediaTypeLabel}
          isAuthenticated={isAuthenticated()}
          authLoading={false} // Auth loading is handled at app level now
        />
      )}

      {/* Gallery View - Now the default homepage */}
      {viewMode === 'gallery' && (
        <GalleryView
          onClose={handleCloseGallery}
          onViewAnalysis={handleViewAnalysisFromGallery}
          authLoading={false} // Auth loading is handled at app level now
        />
      )}

      {/* Analysis Interface */}
      {viewMode === 'analysis' && currentAnalysis && (
        <AnalysisInterface
          mediaUrl={selectedMediaUrl || '/xyber3_85247_httpss.mj.runGheQ7nmBn6I_Asymetrical_fantasy_run_2176d81e-df11-4ba8-9dfc-1b65006c574f_1.png'}
          mediaType={selectedMediaType}
          analysis={currentAnalysis}
          onClose={handleCloseAnalysis}
          onTextClick={handleTextClick}
          isTextOnlyAnalysis={false}
          selectedMediaFile={selectedMediaFile}
          isAuthenticated={isAuthenticated()}
          authLoading={false} // Auth loading is handled at app level now
          username={currentUsername} // Pass the username to AnalysisInterface
          artistId={currentArtistId} // Pass the artist ID to AnalysisInterface
          onViewArtistProfile={handleViewArtistProfile} // Pass the artist profile handler
        />
      )}

      {/* Image Generation Page */}
      {viewMode === 'generate' && (
        <ImageGenerationPage
          initialPrompt=""
          onClose={handleCloseGenerate}
        />
      )}

      {/* Liked View (formerly Bookmarks) */}
      {viewMode === 'bookmarks' && (
        <BookmarksView
          onClose={handleCloseLiked}
          onViewAnalysis={handleViewAnalysisFromBookmark}
        />
      )}

      {/* Artist Profile View */}
      {viewMode === 'artistProfile' && selectedArtistId && (
        <ArtistProfileView
          artistId={selectedArtistId}
          onClose={handleCloseArtistProfile}
          onViewAnalysis={handleViewAnalysisFromGallery}
        />
      )}

      {/* Account Settings View */}
      {viewMode === 'settings' && (
        <AccountSettingsView
          onClose={handleCloseSettings}
        />
      )}
    </div>
  );
}

export default App;