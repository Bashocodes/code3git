import React from 'react';
import { Trash2, ArrowLeft, Play, Volume2, Image } from 'lucide-react';
import { BookmarkedAnalysis } from '../types';
import { getBookmarks, removeBookmark } from '../utils/storage';

interface BookmarksViewProps {
  onClose: () => void;
  onViewAnalysis: (bookmark: BookmarkedAnalysis) => void;
}

export function BookmarksView({ onClose, onViewAnalysis }: BookmarksViewProps) {
  const [bookmarks, setBookmarks] = React.useState<BookmarkedAnalysis[]>([]);

  React.useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const handleRemoveBookmark = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (removeBookmark(id)) {
      setBookmarks(getBookmarks());
    }
  };

  const renderMediaPreview = (bookmark: BookmarkedAnalysis) => {
    const baseClasses = "w-full h-64 object-cover shadow-double-border";
    
    switch (bookmark.mediaType) {
      case 'image':
        return (
          <img
            src={bookmark.mediaUrl}
            alt={bookmark.analysis.title}
            className={baseClasses}
          />
        );
      
      case 'video':
        return (
          <div className="relative w-full h-64 bg-black flex items-center justify-center shadow-double-border">
            <video
              src={bookmark.mediaUrl}
              className={baseClasses}
              muted
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play size={24} className="text-white" />
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="w-full h-64 bg-gradient-to-br from-[#B8A082]/20 to-[#7C9A92]/20 flex items-center justify-center shadow-double-border">
            <Volume2 size={32} className="text-[#B8A082]" />
          </div>
        );
      
      default:
        return (
          <div className="w-full h-64 bg-white/10 flex items-center justify-center shadow-double-border">
            <Image size={32} className="text-white/50" />
          </div>
        );
    }
  };

  return (
    <div className="pt-[76px] min-h-screen">
      <div className="overflow-y-auto">
        {/* Header - Now scrolls with content */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Back to homepage"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>
            <h1 className="text-xl font-light text-[#E0E0E0]">
              Liked ({bookmarks.length})
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-white/50 text-base mb-1">No liked items yet</p>
              <p className="text-white/30 text-xs">
                Like analyses to access them quickly later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-all group border border-white/10 hover:border-white/20 hover:scale-[1.02] transform duration-300 cursor-pointer"
                  onClick={() => onViewAnalysis(bookmark)}
                >
                  <div className="relative overflow-hidden">
                    {renderMediaPreview(bookmark)}
                    <button
                      onClick={(e) => handleRemoveBookmark(bookmark.id, e)}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from liked"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                    
                    {/* Style name overlay - rounded top corners, dull green text */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black px-3 py-2 rounded-t-lg">
                      <p className="text-neon-green font-mono text-xs font-medium text-center whitespace-nowrap">
                        {bookmark.analysis.style}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}