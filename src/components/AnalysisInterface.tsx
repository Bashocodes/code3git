import React, { useState } from 'react';
import { Heart, HeartHandshake, ArrowLeft, Type, Play, Volume2, Upload, LogIn } from 'lucide-react';
import { AnalysisResult, ModuleType, BookmarkedAnalysis, MediaType } from '../types';
import { MODULES } from '../constants/modules';
import { addBookmark, removeBookmark, isBookmarked } from '../utils/storage';
import { postAnalysis, uploadMediaToStorage } from '../utils/supabase';
import { AnalysisContent } from './AnalysisContent';
import { useAuth } from '../context/AuthContext';

interface AnalysisInterfaceProps {
  mediaUrl: string;
  mediaType: MediaType;
  analysis: AnalysisResult;
  onClose: () => void;
  onTextClick?: (text: string) => void;
  isTextOnlyAnalysis?: boolean;
  selectedMediaFile?: File | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  username?: string;
  artistId?: string;
  onViewArtistProfile?: (artistId: string) => void;
}

export function AnalysisInterface({
  mediaUrl,
  mediaType,
  analysis,
  onClose,
  onTextClick,
  isTextOnlyAnalysis = false,
  selectedMediaFile,
  isAuthenticated,
  authLoading,
  username,
  artistId,
  onViewArtistProfile,
}: AnalysisInterfaceProps) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(analysis.title));
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { user, profile, signInWithGoogle } = useAuth();

  // Define module groups
  const topModules = MODULES.filter(m => ['STORY', 'VIDEO', 'DIALOGUE'].includes(m.id));
  const bottomModules = MODULES.filter(m => ['REMIX', 'OUTPAINT', 'MUSIC'].includes(m.id));

  // State for active tabs
  const [activeTopTab, setActiveTopTab] = useState<ModuleType>('STORY');
  const [activeBottomTab, setActiveBottomTab] = useState<ModuleType>('REMIX');

  // Check if this is a post from the gallery (has username and artistId)
  const isGalleryPost = !!(username && artistId);

  const handleBookmarkToggle = async () => {
    // Check if user is authenticated before allowing bookmark action
    if (!isAuthenticated || !user) {
      console.log('❌ User not authenticated, prompting sign-in for bookmark action');
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Sign-in failed:', error);
      }
      return;
    }

    const bookmarkData: BookmarkedAnalysis = {
      id: analysis.title,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      analysis,
      timestamp: Date.now(),
    };

    if (bookmarked) {
      if (removeBookmark(analysis.title)) {
        setBookmarked(false);
        console.log('Removed from liked successfully');
      }
    } else {
      if (addBookmark(bookmarkData)) {
        setBookmarked(true);
        console.log('Added to liked successfully');
      }
    }
  };

  const handlePost = async () => {
    // Check authentication and loading state
    if (authLoading) {
      console.log('⏳ Authentication state is loading, please wait...');
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('❌ User not authenticated, prompting sign-in');
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Sign-in failed:', error);
        setPostStatus('error');
        setTimeout(() => setPostStatus('idle'), 3000);
      }
      return;
    }

    // Ensure user has required data
    if (!user.id || !profile?.username) {
      console.error('❌ User missing required data:', { id: user.id, username: profile?.username });
      setPostStatus('error');
      setTimeout(() => setPostStatus('idle'), 3000);
      return;
    }

    if (isPosting) return;

    setIsPosting(true);
    setPostStatus('idle');

    try {
      let finalMediaUrl = mediaUrl;

      // If we have a selected media file, upload it to Supabase Storage first
      if (selectedMediaFile) {
        console.log('📁 Uploading media file to storage...');
        try {
          finalMediaUrl = await uploadMediaToStorage(selectedMediaFile, mediaType);
          console.log('✅ Media uploaded successfully:', finalMediaUrl);
        } catch (uploadError) {
          console.error('❌ Media upload failed:', uploadError);
          // Fall back to using the existing mediaUrl (base64 or existing URL)
          console.log('⚠️ Falling back to existing media URL');
        }
      }

      // Post with the complete analysis data and user information
      const result = await postAnalysis({
        media_url: finalMediaUrl,
        media_type: mediaType,
        title: analysis.title,
        style: analysis.style,
        analysis: analysis,
        user_id: user.id,
        username: profile.username
      });

      if (result.success) {
        setPostStatus('success');
        setTimeout(() => setPostStatus('idle'), 3000);
        console.log('✅ Analysis posted successfully with full data');
      } else {
        setPostStatus('error');
        setTimeout(() => setPostStatus('idle'), 3000);
        console.error('❌ Post failed:', result.error);
      }
    } catch (error) {
      setPostStatus('error');
      setTimeout(() => setPostStatus('idle'), 3000);
      console.error('💥 Post error:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const renderMediaDisplay = () => {
    const baseClasses = "max-w-full max-h-full object-contain rounded-2xl shadow-2xl";

    switch (mediaType) {
      case 'image':
        return (
          <img
            src={mediaUrl}
            alt="Analysis subject"
            className={baseClasses}
          />
        );

      case 'video':
        return (
          <video
            src={mediaUrl}
            controls
            className={baseClasses}
            style={{ maxHeight: '80vh' }}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-32 h-32 bg-gradient-to-br from-[#B8A082]/20 to-[#7C9A92]/20 rounded-2xl flex items-center justify-center border border-white/10">
              <Volume2 size={48} className="text-[#B8A082]" />
            </div>
            <audio
              src={mediaUrl}
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
    switch (mediaType) {
      case 'image':
        return 'Image';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Audio';
      default:
        return 'Media';
    }
  };

  const getMediaTypeIcon = () => {
    switch (mediaType) {
      case 'video':
        return <Play size={12} className="text-[#B8A082]" />;
      case 'audio':
        return <Volume2 size={12} className="text-[#B8A082]" />;
      default:
        return <Type size={12} className="text-[#B8A082]" />;
    }
  };

  const getPostButtonContent = () => {
    if (authLoading) {
      return (
        <>
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      );
    }

    if (!isAuthenticated || !user) {
      return (
        <>
          <LogIn size={12} />
          <span>Sign In to Post</span>
        </>
      );
    }

    if (!profile?.username) {
      return (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Set Username</span>
        </>
      );
    }

    if (isPosting) {
      return (
        <>
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          <span>Posting...</span>
        </>
      );
    }

    switch (postStatus) {
      case 'success':
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Posted!</span>
          </>
        );
      case 'error':
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <Upload size={12} />
            <span>POST</span>
          </>
        );
    }
  };

  const getPostButtonClass = () => {
    const baseClass = "flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all text-xs";

    if (authLoading) {
      return `${baseClass} bg-white/10 text-white/50 cursor-not-allowed`;
    }

    if (!isAuthenticated || !user) {
      return `${baseClass} bg-white/10 text-white/50 hover:bg-white/20`;
    }

    if (!profile?.username) {
      return `${baseClass} bg-orange-500/20 text-orange-400 hover:bg-orange-500/30`;
    }

    if (isPosting) {
      return `${baseClass} bg-white/10 text-white/50 cursor-not-allowed`;
    }

    switch (postStatus) {
      case 'success':
        return `${baseClass} bg-green-500/20 text-green-400 hover:bg-green-500/30`;
      case 'error':
        return `${baseClass} bg-red-500/20 text-red-400 hover:bg-red-500/30`;
      default:
        return `${baseClass} bg-[#B8A082]/20 text-[#B8A082] hover:bg-[#B8A082]/30`;
    }
  };

  const getPostButtonTitle = () => {
    if (authLoading) {
      return 'Loading authentication status...';
    }

    if (!isAuthenticated || !user) {
      return 'Sign in to post this analysis to the website';
    }

    if (!profile?.username) {
      return 'Please set your username in account settings before posting';
    }

    switch (postStatus) {
      case 'success':
        return 'Successfully posted to website with full analysis data';
      case 'error':
        return 'Failed to post - click to retry';
      default:
        return 'Post this analysis to the website with complete data';
    }
  };

  const getBookmarkButtonTitle = () => {
    if (!isAuthenticated || !user) {
      return 'Sign in to like this analysis';
    }
    return bookmarked ? "Remove from liked" : "Add to liked";
  };

  return (
    <div className="pt-16 h-screen overflow-hidden">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Media Section - Fixed height, no scroll */}
        <div className="w-2/3 p-4 flex items-center justify-center relative">
          {renderMediaDisplay()}

          {/* Media type indicator */}
          {(isTextOnlyAnalysis || mediaType !== 'image') && (
            <div className="absolute top-3 left-3 bg-[#B8A082]/20 backdrop-blur-sm rounded-xl px-2 py-1 border border-[#B8A082]/30">
              <div className="flex items-center gap-1">
                {getMediaTypeIcon()}
                <span className="text-[#B8A082] text-xs font-medium">
                  {isTextOnlyAnalysis ? 'Text-Based Analysis' : `${getMediaTypeLabel()} Analysis`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Control Deck - Scrollable content only */}
        <div className="w-1/3 flex flex-col">
          {/* Artist Username - Above everything, connected to main content */}
          {username && (
            <div className="bg-black/50 backdrop-blur-md shadow-inner px-4 pt-4 flex justify-end rounded-t-2xl">
              <button
                onClick={() => artistId && onViewArtistProfile?.(artistId)}
                className="text-artist-purple font-mono text-sm cursor-pointer hover:underline transition-colors"
                disabled={!artistId || !onViewArtistProfile}
                title="View artist profile"
              >
                @{username}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className={`bg-black/50 backdrop-blur-md shadow-inner relative ${username ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl'}`}>
              {/* Header with Back Button */}
              <div className="p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={onClose}
                    className="p-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title="Back to homepage"
                  >
                    <ArrowLeft size={16} className="text-white" />
                  </button>
                  <h1 className="text-3xl font-light text-[#7C9A92] flex-1">{analysis.title}</h1>

                  {/* POST Button - Only show if this is NOT a gallery post */}
                  {!isGalleryPost && (
                    <button
                      onClick={handlePost}
                      disabled={isPosting || authLoading}
                      className={getPostButtonClass()}
                      title={getPostButtonTitle()}
                    >
                      {getPostButtonContent()}
                    </button>
                  )}

                  <button
                    onClick={handleBookmarkToggle}
                    className={`p-1 rounded-xl transition-all duration-300 ${
                      bookmarked
                        ? 'text-red-500 bg-red-500/20 hover:bg-red-500/30 scale-110'
                        : 'text-[#B8A082] hover:text-[#A69072] hover:bg-white/10'
                    }`}
                    title={getBookmarkButtonTitle()}
                  >
                    {bookmarked ? (
                      <Heart size={20} className="fill-red-500" />
                    ) : (
                      <Heart size={20} />
                    )}
                  </button>
                </div>

                <p
                  className="text-[#7C9A92] font-mono text-sm leading-relaxed cursor-pointer hover:text-[#8FAAA3] transition-colors mb-2"
                  onClick={() => onTextClick?.(analysis.style)}
                  title="Click to use as vision text"
                >
                  {analysis.style}
                </p>

                {/* Prompt as textarea - Always visible below style */}
                {analysis.prompt && (
                  <div className="mb-3">
                    <textarea
                      value={analysis.prompt}
                      readOnly
                      rows={3}
                      className="w-full bg-white/5 rounded-xl p-3 text-[#E0E0E0] text-sm font-mono leading-relaxed resize-none border-none outline-none"
                    />
                  </div>
                )}

                {/* Key Tokens - Display directly below prompt */}
                {analysis.keyTokens && analysis.keyTokens.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyTokens.map((token, index) => (
                        <button
                          key={index}
                          onClick={() => onTextClick?.(token)}
                          className="px-2 py-1 bg-black/30 text-[#94AFA7] text-xs font-mono rounded-xl hover:opacity-80 transition-opacity cursor-pointer"
                          title="Click to add to prompt"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Section: Story | Video | Dialogue */}
              <div className="px-4 mb-4">
                <div className="border border-white/10 rounded-xl overflow-hidden shadow-lg">
                  {/* Top Tab Navigation */}
                  <div className="flex border-b border-white/10">
                    {topModules.map((module, index) => (
                      <React.Fragment key={module.id}>
                        <button
                          onClick={() => setActiveTopTab(module.id)}
                          className={`flex-1 p-2 text-xs font-medium transition-all ${
                            activeTopTab === module.id
                              ? 'text-[#1a1a1a]'
                              : 'text-white/70 hover:text-white/90 hover:bg-white/5'
                          }`}
                          style={
                            activeTopTab === module.id
                              ? { backgroundColor: module.color }
                              : {}
                          }
                        >
                          {module.label}
                        </button>
                        {index < topModules.length - 1 && (
                          <div className="w-px bg-white/10" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Top Content */}
                  <div className="p-3">
                    <AnalysisContent
                      activeTab={activeTopTab}
                      analysis={analysis}
                      onTextClick={onTextClick}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Section: Remix | Outpaint | Music */}
              <div className="px-4 pb-4">
                <div className="border border-white/10 rounded-xl overflow-hidden shadow-lg">
                  {/* Bottom Tab Navigation */}
                  <div className="flex border-b border-white/10">
                    {bottomModules.map((module, index) => (
                      <React.Fragment key={module.id}>
                        <button
                          onClick={() => setActiveBottomTab(module.id)}
                          className={`flex-1 p-2 text-xs font-medium transition-all ${
                            activeBottomTab === module.id
                              ? 'text-[#1a1a1a]'
                              : 'text-white/70 hover:text-white/90 hover:bg-white/5'
                          }`}
                          style={
                            activeBottomTab === module.id
                              ? { backgroundColor: module.color }
                              : {}
                          }
                        >
                          {module.label}
                        </button>
                        {index < bottomModules.length - 1 && (
                          <div className="w-px bg-white/10" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Bottom Content */}
                  <div className="p-3">
                    <AnalysisContent
                      activeTab={activeBottomTab}
                      analysis={analysis}
                      onTextClick={onTextClick}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}