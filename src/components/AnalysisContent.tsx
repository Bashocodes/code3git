import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { ModuleType, AnalysisResult } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface AnalysisContentProps {
  activeTab: ModuleType;
  analysis: AnalysisResult;
  onTextClick?: (text: string) => void;
}

export function AnalysisContent({ activeTab, analysis, onTextClick }: AnalysisContentProps) {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedItems(prev => new Set(prev).add(key));
      setTimeout(() => {
        setCopiedItems(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2000);
    }
  };

  const renderCopyButton = (text: string, key: string) => (
    <button
      onClick={() => handleCopy(text, key)}
      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copiedItems.has(key) ? (
        <Check size={12} className="text-green-400" />
      ) : (
        <Copy size={12} className="text-white/70" />
      )}
    </button>
  );

  switch (activeTab) {
    case 'REMIX':
      return (
        <div className="space-y-0">
          {analysis.creativeRemixes.map((remix, index) => (
            <div key={index} className="pb-3 border-b border-white/10 last:border-b-0 last:pb-0 flex items-start gap-2">
              <p 
                className="text-white/80 text-xs font-mono cursor-pointer hover:text-[#F0F0F0] transition-colors flex-1 leading-relaxed"
                onClick={() => onTextClick?.(remix)}
                title="Click to use as vision text"
              >
                {remix}
              </p>
              {renderCopyButton(remix, `remix-${index}`)}
            </div>
          ))}
        </div>
      );

    case 'OUTPAINT':
      return (
        <div className="space-y-0">
          {analysis.outpaintingPrompts.map((prompt, index) => (
            <div key={index} className="pb-3 border-b border-white/10 last:border-b-0 last:pb-0 flex items-start gap-2">
              <p 
                className="text-white/80 text-xs font-mono cursor-pointer hover:text-[#F0F0F0] transition-colors flex-1 leading-relaxed"
                onClick={() => onTextClick?.(prompt)}
                title="Click to use as vision text"
              >
                {prompt}
              </p>
              {renderCopyButton(prompt, `outpainting-${index}`)}
            </div>
          ))}
        </div>
      );

    case 'VIDEO':
      return (
        <div className="space-y-0">
          {analysis.animationPrompts.map((prompt, index) => (
            <div key={index} className="pb-3 border-b border-white/10 last:border-b-0 last:pb-0 flex items-start gap-2">
              <p 
                className="text-white/80 text-xs font-mono cursor-pointer hover:text-[#F0F0F0] transition-colors flex-1 leading-relaxed"
                onClick={() => onTextClick?.(prompt)}
                title="Click to use as vision text"
              >
                {prompt}
              </p>
              {renderCopyButton(prompt, `video-${index}`)}
            </div>
          ))}
        </div>
      );

    case 'MUSIC':
      return (
        <div className="space-y-0">
          {analysis.musicPrompts.map((prompt, index) => (
            <div key={index} className="pb-3 border-b border-white/10 last:border-b-0 last:pb-0 flex items-start gap-2">
              <p 
                className="text-white/80 text-xs font-mono cursor-pointer hover:text-[#F0F0F0] transition-colors flex-1 leading-relaxed"
                onClick={() => onTextClick?.(prompt)}
                title="Click to use as vision text"
              >
                {prompt}
              </p>
              {renderCopyButton(prompt, `music-${index}`)}
            </div>
          ))}
        </div>
      );

    case 'DIALOGUE':
      return (
        <div className="space-y-0">
          {analysis.dialoguePrompts.map((prompt, index) => (
            <div key={index} className="pb-3 border-b border-white/10 last:border-b-0 last:pb-0 flex items-start gap-2">
              <p 
                className="text-white/80 text-xs font-mono cursor-pointer hover:text-[#F0F0F0] transition-colors flex-1 leading-relaxed"
                onClick={() => onTextClick?.(prompt)}
                title="Click to use as vision text"
              >
                {prompt}
              </p>
              {renderCopyButton(prompt, `dialogue-${index}`)}
            </div>
          ))}
        </div>
      );

    case 'STORY':
      return (
        <div className="space-y-0">
          {analysis.storyPrompts.map((story, index) => (
            <div key={index} className="pb-3 border-b border-white/10 last:border-b-0 last:pb-0 flex items-start gap-2">
              <p 
                className="text-white/80 text-xs font-mono leading-relaxed cursor-pointer hover:text-[#F0F0F0] transition-colors flex-1"
                onClick={() => onTextClick?.(story)}
                title="Click to use as vision text"
              >
                {story}
              </p>
              {renderCopyButton(story, `story-${index}`)}
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}