import React, { useState } from 'react';
import { Upload, Sparkles, X, Play, Volume2 } from 'lucide-react';
import { ModuleType, MediaType } from '../types';
import { MODULES } from '../constants/modules';

interface StaticHomepageProps {
  onUploadClick: () => void;
  onTextClick?: (text: string) => void;
  selectedMediaUrl: string | null;
  selectedMediaType: MediaType;
  isAnalyzing: boolean;
  onSubmitClick: () => void;
  onMediaRemove: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  renderMediaDisplay: () => React.ReactNode;
  getMediaTypeLabel: () => string;
  isAuthenticated: boolean;
  authLoading: boolean;
}

export function StaticHomepage({
  onUploadClick,
  onTextClick,
  selectedMediaUrl,
  selectedMediaType,
  isAnalyzing,
  onSubmitClick,
  onMediaRemove,
  fileInputRef,
  onFileChange,
  renderMediaDisplay,
  getMediaTypeLabel,
  isAuthenticated,
  authLoading,
}: StaticHomepageProps) {
  const [activeTab, setActiveTab] = useState<ModuleType>('REMIX');

  // Get description for active tab
  const getActiveTabDescription = () => {
    const module = MODULES.find(m => m.id === activeTab);
    return module?.description || '';
  };

  // Always render the main layout - no more conditional rendering
  return (
    <div className="pt-16 h-screen overflow-hidden bg-[#0E0E0E]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={onFileChange}
        className="hidden"
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Media Section - Left Side (70%) */}
        <div className="w-[70%] p-4 flex items-center justify-center relative">
          {selectedMediaUrl ? (
            <>
              {/* Render selected media */}
              {renderMediaDisplay()}
              
              {/* Remove button */}
              <button
                onClick={onMediaRemove}
                className="absolute top-6 right-6 p-2 bg-red-500/80 hover:bg-red-500 rounded-xl transition-colors"
                title="Remove media"
              >
                <X size={16} className="text-white" />
              </button>
            </>
          ) : (
            /* Default placeholder image with upload overlay */
            <div className="relative group cursor-pointer w-full h-full flex items-center justify-center" onClick={onUploadClick}>
              <img
                src="/xyber3_85247_httpss.mj.runGheQ7nmBn6I_Asymetrical_fantasy_run_2176d81e-df11-4ba8-9dfc-1b65006c574f_1.png"
                alt="Example fantasy artwork"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-opacity group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#D5C3A5] rounded-full flex items-center justify-center">
                    <Upload size={24} className="text-[#0E0E0E]" />
                  </div>
                  <p className="text-white text-lg font-medium mb-2">Upload Your Media</p>
                  <p className="text-white/70 text-sm">Click to analyze your own image, video, or audio</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel - Right Side (30%) - Sticky aside with max-width 380px */}
        <aside className="w-[30%] max-w-[380px] h-full sticky top-0 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Header - Exact copy as specified */}
              <div className="mb-6">
                <h2 className="text-[32px] font-light text-[#E6E6E6] leading-tight mb-3" style={{ fontFamily: 'Inter, SF Pro, sans-serif' }}>
                  Decode. Discover. Dream.
                </h2>
                <h4 className="text-[11px] font-bold uppercase text-[#E6E6E6] opacity-80 mb-6" style={{ letterSpacing: '0.08em' }}>
                  WHAT YOU'LL GET
                </h4>
                
                {/* Intro paragraph in styled box */}
                <div className="bg-[#1A1A1A] rounded-xl p-6 mb-6 shadow-[0_0_0_1px_#1B1B1B_inset]">
                  <p className="text-[#E6E6E6] opacity-80 text-[16px] leading-relaxed" style={{ fontFamily: 'Inter, SF Pro, sans-serif' }}>
                    Upload any image, video, or audio. StyleLabs pulls the DNA apart and hands you ready-to-use prompts for every creative lane—instantly.
                  </p>
                </div>
              </div>

              {/* Tab Navigation - 6 tabs in 3x2 grid with gap-1 and pill styling */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-1">
                  {/* Top Row */}
                  <button
                    onClick={() => setActiveTab('REMIX')}
                    className={`p-3 rounded-xl font-medium transition-all bg-[#1A1A1A] text-[#E6E6E6] ${
                      activeTab === 'REMIX'
                        ? 'border border-[#D5C3A5]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      fontSize: '13px',
                      fontFamily: 'Inter, SF Pro, sans-serif'
                    }}
                  >
                    REMIX
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('OUTPAINT')}
                    className={`p-3 rounded-xl font-medium transition-all bg-[#1A1A1A] text-[#E6E6E6] ${
                      activeTab === 'OUTPAINT'
                        ? 'border border-[#D5C3A5]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      fontSize: '13px',
                      fontFamily: 'Inter, SF Pro, sans-serif'
                    }}
                  >
                    OUTPAINT
                  </button>

                  <button
                    onClick={() => setActiveTab('MUSIC')}
                    className={`p-3 rounded-xl font-medium transition-all bg-[#1A1A1A] text-[#E6E6E6] ${
                      activeTab === 'MUSIC'
                        ? 'border border-[#D5C3A5]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      fontSize: '13px',
                      fontFamily: 'Inter, SF Pro, sans-serif'
                    }}
                  >
                    MUSIC
                  </button>

                  {/* Bottom Row */}
                  <button
                    onClick={() => setActiveTab('STORY')}
                    className={`p-3 rounded-xl font-medium transition-all bg-[#1A1A1A] text-[#E6E6E6] ${
                      activeTab === 'STORY'
                        ? 'border border-[#D5C3A5]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      fontSize: '13px',
                      fontFamily: 'Inter, SF Pro, sans-serif'
                    }}
                  >
                    STORY
                  </button>

                  <button
                    onClick={() => setActiveTab('VIDEO')}
                    className={`p-3 rounded-xl font-medium transition-all bg-[#1A1A1A] text-[#E6E6E6] ${
                      activeTab === 'VIDEO'
                        ? 'border border-[#D5C3A5]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      fontSize: '13px',
                      fontFamily: 'Inter, SF Pro, sans-serif'
                    }}
                  >
                    VIDEO
                  </button>

                  <button
                    onClick={() => setActiveTab('DIALOGUE')}
                    className={`p-3 rounded-xl font-medium transition-all bg-[#1A1A1A] text-[#E6E6E6] ${
                      activeTab === 'DIALOGUE'
                        ? 'border border-[#D5C3A5]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      fontSize: '13px',
                      fontFamily: 'Inter, SF Pro, sans-serif'
                    }}
                  >
                    DIALOGUE
                  </button>
                </div>
              </div>

              {/* Active Tab Description */}
              <div className="mb-6">
                <p className="text-[#E6E6E6] opacity-80 text-[16px] leading-relaxed" style={{ fontFamily: 'Inter, SF Pro, sans-serif' }}>
                  {getActiveTabDescription()}
                </p>
              </div>

              {/* Removed the Analysis Status section completely */}
            </div>
          </div>

          {/* Big Decode Button - Fixed at bottom */}
          <div className="p-6 border-t border-[#1B1B1B]">
            <button
              onClick={onSubmitClick}
              disabled={!selectedMediaUrl || isAnalyzing}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all font-semibold text-lg ${
                selectedMediaUrl && !isAnalyzing
                  ? 'bg-[#D5C3A5] hover:bg-[#C5B395] text-[#0E0E0E] shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  : 'bg-[#1A1A1A] text-[#E6E6E6] opacity-40 cursor-not-allowed'
              }`}
              style={{ fontFamily: 'Inter, SF Pro, sans-serif' }}
              title={
                !selectedMediaUrl 
                  ? 'Upload media first to decode'
                  : isAnalyzing 
                  ? 'Analysis in progress...'
                  : 'Start decoding your media'
              }
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Decoding...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Decode Media</span>
                </>
              )}
            </button>
            
            {/* Helper text */}
            <p className="text-center text-[#E6E6E6] opacity-50 text-xs mt-3" style={{ fontFamily: 'Inter, SF Pro, sans-serif' }}>
              {!selectedMediaUrl 
                ? 'Upload an image, video, or audio file to begin'
                : isAnalyzing
                ? 'Analysis will complete in moments'
                : 'Ready to analyze with all creative modules'
              }
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}