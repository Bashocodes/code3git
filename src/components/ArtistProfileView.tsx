import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getPosts } from '../utils/supabase';
import { AnalysisResult } from '../types';

interface Post {
  id: string;
  media_url: string;
  media_type: 'image' | 'video' | 'audio';
  title: string;
  style: string;
  created_at: string;
  analysis_data?: AnalysisResult;
  username?: string;
  user_id?: string;
}

interface ArtistProfileViewProps {
  artistId: string;
  onClose: () => void;
  onViewAnalysis: (post: Post) => void;
}

export function ArtistProfileView({ artistId, onClose, onViewAnalysis }: ArtistProfileViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [artistUsername, setArtistUsername] = useState<string>('');
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const POSTS_PER_PAGE = 12;

  const loadPosts = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const currentOffset = isLoadMore ? offset : 0;
      console.log(`🔄 Loading artist posts: artistId=${artistId}, isLoadMore=${isLoadMore}, offset=${currentOffset}`);
      
      const result = await getPosts(POSTS_PER_PAGE, currentOffset, 'new', artistId);
      
      if (result.error) {
        console.error('❌ Error loading artist posts:', result.error);
        setError(result.error);
      } else {
        const newPosts = result.data || [];
        
        // Extract artist username from first post if available
        if (newPosts.length > 0 && newPosts[0].username && !artistUsername) {
          setArtistUsername(newPosts[0].username);
        }
        
        if (isLoadMore) {
          // Append new posts to existing ones
          setPosts(prevPosts => [...prevPosts, ...newPosts]);
          setOffset(prevOffset => prevOffset + POSTS_PER_PAGE);
        } else {
          // Replace posts with new ones (initial load or refresh)
          setPosts(newPosts);
          setOffset(POSTS_PER_PAGE);
          // Set artist username from first post
          if (newPosts.length > 0 && newPosts[0].username) {
            setArtistUsername(newPosts[0].username);
          }
        }
        
        setHasMore(result.hasMore);
        console.log(`📊 Loaded ${newPosts.length} artist posts, total: ${isLoadMore ? posts.length + newPosts.length : newPosts.length}, hasMore: ${result.hasMore}`);
      }
    } catch (err) {
      console.error('💥 Error loading artist posts:', err);
      setError('Failed to load artist posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [artistId, offset, posts.length, artistUsername]);

  // Initial load
  useEffect(() => {
    console.log('🔄 Loading initial artist posts...');
    loadPosts(false);
  }, [artistId]);

  // Infinite scroll setup
  useEffect(() => {
    if (loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          console.log('🔄 Intersection detected, loading more artist posts...');
          loadPosts(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadPosts, hasMore, loadingMore]);

  const renderMediaPreview = (post: Post) => {
    const baseClasses = "w-full h-64 object-cover shadow-double-border";
    
    switch (post.media_type) {
      case 'image':
        return (
          <img
            src={post.media_url}
            alt={post.title}
            className={baseClasses}
            loading="lazy"
            decoding="async"
          />
        );
      
      case 'video':
        return (
          <div className="relative w-full h-64 bg-black flex items-center justify-center shadow-double-border">
            <video
              src={post.media_url}
              className={baseClasses}
              muted
              preload="none"
              loading="lazy"
            />
          </div>
        );
      
      case 'audio':
        return (
          <div className="w-full h-64 bg-gradient-to-br from-[#B8A082]/20 to-[#7C9A92]/20 flex items-center justify-center shadow-double-border">
            <svg className="w-16 h-16 text-[#B8A082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-5a3 3 0 00-6 0v5z" />
            </svg>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-64 bg-white/10 flex items-center justify-center shadow-double-border">
            <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="pt-[76px] min-h-screen bg-[#1a1a1a]">
      <div className="overflow-y-auto">
        {/* Header - Now scrolls with content */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Back to previous page"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-artist-purple">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-light text-[#E0E0E0]">@{artistUsername}</h1>
                <p className="text-[#7C9A92] font-mono text-sm">
                  {loading ? 'Loading...' : `${posts.length} creative ${posts.length === 1 ? 'style' : 'styles'}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-artist-purple animate-spin" />
                <p className="text-white/70 text-lg">Loading artist profile...</p>
                <p className="text-white/50 text-sm">Fetching @{artistUsername}'s creative works</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-400 text-lg mb-2">Failed to Load Artist Profile</p>
              <p className="text-white/50 text-sm mb-4">{error}</p>
              <button
                onClick={() => loadPosts(false)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <p className="text-white/50 text-lg mb-2">No Styles Yet</p>
              <p className="text-white/30 text-sm mb-4">
                @{artistUsername} hasn't shared any creative styles yet
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-artist-purple hover:bg-artist-purple/80 text-white rounded-xl font-medium transition-colors"
              >
                Back to Gallery
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onViewAnalysis(post)}
                    className="bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-all group border border-white/10 hover:border-artist-purple/50 hover:scale-[1.02] transform duration-300 cursor-pointer"
                  >
                    <div className="relative overflow-hidden">
                      {renderMediaPreview(post)}
                      
                      {/* Style name overlay - rounded top corners, dull green text */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black px-3 py-2 rounded-t-lg">
                        <p className="text-neon-green font-mono text-xs font-medium text-center whitespace-nowrap">
                          {post.style}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Infinite scroll trigger and loading indicator */}
              {hasMore && (
                <div 
                  ref={loadMoreRef}
                  className="flex items-center justify-center py-8"
                >
                  {loadingMore && (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-artist-purple animate-spin" />
                      <p className="text-white/50 text-sm">Loading more styles...</p>
                    </div>
                  )}
                </div>
              )}

              {/* End of content indicator */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm">You've seen all of @{artistUsername}'s styles</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}