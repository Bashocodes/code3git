import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
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

interface GalleryViewProps {
  onClose: () => void;
  onViewAnalysis: (post: Post) => void;
  authLoading: boolean;
}

export function GalleryView({ onClose, onViewAnalysis, authLoading }: GalleryViewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortOrder, setSortOrder] = useState<'new' | 'top' | 'hot'>('new');
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const POSTS_PER_PAGE = 12;

  const loadPosts = useCallback(async (isLoadMore = false) => {
    // Don't load posts if auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, skipping post fetch...');
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const currentOffset = isLoadMore ? offset : 0;
      console.log(`🔄 Loading posts: isLoadMore=${isLoadMore}, offset=${currentOffset}, sortOrder=${sortOrder}`);
      
      const result = await getPosts(POSTS_PER_PAGE, currentOffset, sortOrder);
      
      if (result.error) {
        console.error('❌ Error loading posts:', result.error);
        setError(result.error);
      } else {
        const newPosts = result.data || [];
        
        if (isLoadMore) {
          // Append new posts to existing ones
          setPosts(prevPosts => [...prevPosts, ...newPosts]);
          setOffset(prevOffset => prevOffset + POSTS_PER_PAGE);
        } else {
          // Replace posts with new ones (initial load or refresh)
          setPosts(newPosts);
          setOffset(POSTS_PER_PAGE);
        }
        
        setHasMore(result.hasMore);
        console.log(`📊 Loaded ${newPosts.length} posts, total: ${isLoadMore ? posts.length + newPosts.length : newPosts.length}, hasMore: ${result.hasMore}, sortOrder: ${sortOrder}`);
      }
    } catch (err) {
      console.error('💥 Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [authLoading, offset, posts.length, sortOrder]);

  // Initial load - only when auth loading is complete
  useEffect(() => {
    if (!authLoading) {
      console.log('🔄 Auth loading complete, loading initial posts...');
      loadPosts(false);
    }
  }, [authLoading, loadPosts]);

  // Reset and reload when sort order changes
  useEffect(() => {
    if (!authLoading) {
      console.log('🔄 Sort order changed, reloading posts...');
      setOffset(0);
      setHasMore(true);
      loadPosts(false);
    }
  }, [sortOrder, authLoading]);

  // Infinite scroll setup
  useEffect(() => {
    if (loadingMore || !hasMore || authLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          console.log('🔄 Intersection detected, loading more posts...');
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
  }, [loadPosts, hasMore, loadingMore, authLoading]);

  const handleSortChange = (newSortOrder: 'new' | 'top' | 'hot') => {
    if (authLoading) return;
    setSortOrder(newSortOrder);
  };

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
            onLoad={() => console.log(`🖼️ Image loaded: ${post.title}`)}
            onError={(e) => {
              console.error(`❌ Image failed to load: ${post.title}`, e);
            }}
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
              onLoadStart={() => console.log(`🎥 Video loading started: ${post.title}`)}
              onError={(e) => {
                console.error(`❌ Video failed to load: ${post.title}`, e);
              }}
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
        {/* Simplified Header - Only count and dropdown - Now scrolls with content */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          {/* Count in code-like box */}
          <div className="bg-[#1A1A1A] border border-white/20 rounded-lg px-3 py-1">
            <span className="text-[#E0E0E0] font-mono text-sm">
              {authLoading ? 'Loading...' : loading ? 'Loading...' : `${posts.length} creative styles`}
            </span>
          </div>
          
          {/* Sort Dropdown */}
          {!authLoading && !loading && !error && (
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value as 'new' | 'top' | 'hot')}
                className="appearance-none bg-[#B8A082]/20 hover:bg-[#B8A082]/30 text-[#B8A082] rounded-xl px-4 py-2 pr-8 font-medium transition-colors text-sm cursor-pointer border-none outline-none"
              >
                <option value="new" className="bg-[#1a1a1a] text-[#B8A082]">New</option>
                <option value="top" className="bg-[#1a1a1a] text-[#B8A082]">Top</option>
                <option value="hot" className="bg-[#1a1a1a] text-[#B8A082]">Hot</option>
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#B8A082] pointer-events-none" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {authLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#B8A082] animate-spin" />
                <p className="text-white/70 text-lg">Authenticating...</p>
                <p className="text-white/50 text-sm">Please wait while we verify your session</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#B8A082] animate-spin" />
                <p className="text-white/70 text-lg">Loading gallery...</p>
                <p className="text-white/50 text-sm">Optimized for fast loading</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-400 text-lg mb-2">Failed to Load Gallery</p>
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
                Start analyzing media and posting your favorite styles to see them here
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#B8A082] hover:bg-[#A69072] text-[#1a1a1a] rounded-xl font-medium transition-colors"
              >
                Start Creating
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onViewAnalysis(post)}
                    className="bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-all group border border-white/10 hover:border-white/20 hover:scale-[1.02] transform duration-300 cursor-pointer"
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
                      <Loader2 className="w-6 h-6 text-[#B8A082] animate-spin" />
                      <p className="text-white/50 text-sm">Loading more styles...</p>
                    </div>
                  )}
                </div>
              )}

              {/* End of content indicator */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm">You've reached the end of the gallery</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}