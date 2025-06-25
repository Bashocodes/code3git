import React, { useState } from 'react';
import { Heart, Wand2, MessageSquare, Mic, Code, LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GlassmorphicHeaderProps {
  bookmarkCount?: number;
  onBookmarksClick?: () => void;
  onGenerateClick?: () => void;
  onChatClick?: () => void;
  onSpeakClick?: () => void;
  onDecodeClick?: () => void;
  onLogoClick?: () => void;
  onSettingsClick?: () => void;
}

export function GlassmorphicHeader({
  bookmarkCount = 0,
  onBookmarksClick,
  onGenerateClick,
  onChatClick,
  onSpeakClick,
  onDecodeClick,
  onLogoClick,
  onSettingsClick,
}: GlassmorphicHeaderProps) {
  const { user, profile, booting, signOut, signInWithGoogle } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSettingsClick = () => {
    setShowProfileMenu(false);
    onSettingsClick?.();
  };

  return (
    <div className="fixed top-1 left-1 right-1 z-40">
      <div className="bg-black/50 backdrop-blur-xl border border-black/50 rounded-2xl shadow-2xl h-18 flex items-center justify-between px-4">
        {/* Left Section - Logo, Generate, Chat, Speak, Decode */}
        <div className="flex items-center gap-4">
          {/* Logo - Retro-futuristic text */}
          <button
            onClick={onLogoClick}
            className="hover:opacity-80 transition-all duration-300 transform hover:scale-105"
            title="Go to homepage"
          >
            <span className="text-[#D5C3A5] font-mono text-xl font-bold tracking-wider uppercase">
              StyleLabs
            </span>
          </button>

          {/* Generate Button */}
          <button
            onClick={onGenerateClick}
            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl transition-colors font-mono tracking-wide bg-black/50 hover:bg-black/60 text-[#66BB6A]"
            title="Generate image with AI"
          >
            <Wand2 size={16} />
            <span className="text-sm">Generate</span>
          </button>

          {/* Chat Button */}
          <button
            onClick={onChatClick}
            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl transition-colors font-mono tracking-wide bg-black/50 hover:bg-black/60 text-[#5A7C9D]"
            title="Chat with AI"
          >
            <MessageSquare size={16} />
            <span className="text-sm">Chat</span>
          </button>

          {/* Speak Button */}
          <button
            onClick={onSpeakClick}
            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl transition-colors font-mono tracking-wide bg-black/50 hover:bg-black/60 text-[#7BB972]"
            title="Voice interaction"
          >
            <Mic size={16} />
            <span className="text-sm">Speak</span>
          </button>

          {/* Decode Button */}
          <button
            onClick={onDecodeClick}
            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl transition-colors font-mono tracking-wide bg-black/50 hover:bg-black/60 text-[#C78D4E]"
            title="Decode media"
          >
            <Code size={16} />
            <span className="text-sm">Decode</span>
          </button>
        </div>

        {/* Right Section - Liked (only when signed in), Auth/User */}
        <div className="flex items-center gap-4">
          {/* Liked (formerly Bookmarks) - Only show when user is signed in */}
          {user && !booting && (
            <button
              onClick={onBookmarksClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              title="View liked items"
            >
              <Heart size={16} className="text-[#B8A082]" />
            </button>
          )}

          {/* Auth/User Section */}
          {booting ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-black/50 text-white/50 font-mono tracking-wide">
              <Loader2 className="animate-spin w-4 h-4" />
              <span className="text-sm">Loading</span>
            </div>
          ) : user ? (
            <div className="relative">
              {/* Circular Profile Button */}
              <button
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/60 transition-colors flex items-center justify-center text-[#7C9A92]"
                title="Profile & Settings"
              >
                <UserIcon size={18} />
              </button>

              {/* Profile Hover Menu */}
              {showProfileMenu && (
                <div 
                  className="absolute top-12 right-0 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2 min-w-[160px] z-50"
                  onMouseEnter={() => setShowProfileMenu(true)}
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  {/* Account Settings */}
                  <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm"
                  >
                    <UserIcon size={16} />
                    <span>Account</span>
                  </button>

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sign In Button - Same styling as other action buttons */
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 px-4 py-1.5 rounded-2xl transition-colors font-mono tracking-wide bg-black/50 hover:bg-black/60 text-[#B8A082]"
              title="Sign In with Google"
            >
              <LogIn size={16} />
              <span className="text-sm">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}